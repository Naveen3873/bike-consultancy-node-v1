const { OfficeExpense, ExpenseCategory, Notification, SoldVehicle, VehicleExpense } = require('../models/index');
const Vehicle = require('../models/Vehicle');

// ─── Expense Categories ───────────────────────────────────

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await ExpenseCategory.find({ is_active: true }).sort('name');
    res.json({ success: true, data: { categories } });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await ExpenseCategory.create(req.body);
    res.status(201).json({ success: true, message: 'Category created', data: { category } });
  } catch (error) {
    next(error);
  }
};

// ─── Office Expenses ──────────────────────────────────────

exports.getOfficeExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, month, year } = req.query;
    const filter = { is_deleted: false };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.expense_date = { $gte: start, $lte: end };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await OfficeExpense.countDocuments(filter);
    const expenses = await OfficeExpense.find(filter)
      .populate('category_id', 'name')
      .populate('added_by', 'full_name username')
      .sort('-expense_date')
      .skip(skip)
      .limit(parseInt(limit));

    // Total for filtered set
    const agg = await OfficeExpense.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      data: {
        expenses,
        totalAmount: agg[0]?.total || 0,
        pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createOfficeExpense = async (req, res, next) => {
  try {
    const data = { ...req.body, added_by: req.user._id };
    if (req.file) data.receipt_url = `/uploads/${req.file.filename}`;
    const expense = await OfficeExpense.create(data);
    const populated = await OfficeExpense.findById(expense._id)
      .populate('category_id', 'name')
      .populate('added_by', 'full_name');
    res.status(201).json({ success: true, message: 'Expense recorded', data: { expense: populated } });
  } catch (error) {
    next(error);
  }
};

exports.deleteOfficeExpense = async (req, res, next) => {
  try {
    const expense = await OfficeExpense.findByIdAndUpdate(req.params.id, { is_deleted: true });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── Notifications ────────────────────────────────────────

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .sort('-created_at')
      .limit(50)
      .populate('vehicle_id', 'vehicle_name reg_number');
    const unreadCount = await Notification.countDocuments({ is_read: false });
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    next(error);
  }
};

exports.markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ is_read: false }, { is_read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// ─── Dashboard ────────────────────────────────────────────

exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalVehicles,
      availableCount,
      pendingCount,
      soldCount,
      recentVehicles,
      recentSales,
      monthlyRevenue,
    ] = await Promise.all([
      Vehicle.countDocuments({ is_deleted: false }),
      Vehicle.countDocuments({ status: 'Available', is_deleted: false }),
      Vehicle.countDocuments({ status: 'Pending', is_deleted: false }),
      Vehicle.countDocuments({ status: 'Sold', is_deleted: false }),
      Vehicle.find({ is_deleted: false })
        .sort('-created_at')
        .limit(5)
        .populate({ path: 'images', match: { is_primary: true }, select: 'image_url' }),
      SoldVehicle.find()
        .sort('-sold_date')
        .limit(5)
        .populate('vehicle_id', 'vehicle_name reg_number model year')
        .populate('sold_by', 'full_name'),
      SoldVehicle.aggregate([
        {
          $group: {
            _id: { month: { $month: '$sold_date' }, year: { $year: '$sold_date' } },
            revenue: { $sum: '$sold_price' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
    ]);

    // Total revenue and profit calculation
    const revenueAgg = await SoldVehicle.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$sold_price' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // Total vehicle expenses
    const vehicleExpAgg = await VehicleExpense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalVehicleExpenses = vehicleExpAgg[0]?.total || 0;

    // Total office expenses
    const officeExpAgg = await OfficeExpense.aggregate([
      { $match: { is_deleted: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalOfficeExpenses = officeExpAgg[0]?.total || 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalVehicles,
          availableCount,
          pendingCount,
          soldCount,
          totalRevenue,
          totalVehicleExpenses,
          totalOfficeExpenses,
          netProfit: totalRevenue - totalVehicleExpenses - totalOfficeExpenses,
        },
        recentVehicles,
        recentSales,
        monthlyRevenue: monthlyRevenue.reverse(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reports ──────────────────────────────────────────────

exports.getReports = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const soldVehiclesWithProfit = await SoldVehicle.aggregate([
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicle_id',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: '$vehicle' },
      {
        $lookup: {
          from: 'vehicleexpenses',
          localField: 'vehicle_id',
          foreignField: 'vehicle_id',
          as: 'expenses',
        },
      },
      {
        $addFields: {
          totalExpenses: { $sum: '$expenses.amount' },
          profit: {
            $subtract: [
              '$sold_price',
              { $add: ['$vehicle.purchase_cost', { $sum: '$expenses.amount' }] },
            ],
          },
        },
      },
      {
        $match: {
          $expr: { $eq: [{ $year: '$sold_date' }, parseInt(year)] },
        },
      },
      { $sort: { sold_date: -1 } },
    ]);

    const monthlyStats = await SoldVehicle.aggregate([
      { $match: { $expr: { $eq: [{ $year: '$sold_date' }, parseInt(year)] } } },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicle_id',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: '$vehicle' },
      {
        $lookup: {
          from: 'vehicleexpenses',
          localField: 'vehicle_id',
          foreignField: 'vehicle_id',
          as: 'expenses',
        },
      },
      {
        $group: {
          _id: { $month: '$sold_date' },
          revenue: { $sum: '$sold_price' },
          purchaseCost: { $sum: '$vehicle.purchase_cost' },
          repairCost: { $sum: { $sum: '$expenses.amount' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: { soldVehiclesWithProfit, monthlyStats },
    });
  } catch (error) {
    next(error);
  }
};
