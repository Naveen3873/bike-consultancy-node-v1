const Vehicle = require('../models/Vehicle');
const { VehicleImage, VehicleExpense, SoldVehicle, Notification } = require('../models/index');
const path = require('path');
const fs = require('fs');

// @desc    Get all vehicles (with filters/pagination)
// @route   GET /api/vehicles
exports.getVehicles = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 12, sort = '-created_at' } = req.query;

    const filter = { is_deleted: false };
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { vehicle_name: { $regex: search, $options: 'i' } },
        { reg_number: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { purchase_from: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Vehicle.countDocuments(filter);
    const vehicles = await Vehicle.find(filter)
      .populate('created_by', 'full_name username')
      .populate({ path: 'images', match: { is_primary: true }, select: 'image_url' })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
exports.getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, is_deleted: false })
      .populate('created_by', 'full_name username')
      .populate('images')
      .populate({ path: 'expenses', populate: { path: 'added_by', select: 'full_name' } });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Get sold info if sold
    let soldInfo = null;
    if (vehicle.status === 'Sold') {
      soldInfo = await SoldVehicle.findOne({ vehicle_id: vehicle._id }).populate(
        'sold_by',
        'full_name'
      );
    }

    // Calculate total expenses
    const expenseAgg = await VehicleExpense.aggregate([
      { $match: { vehicle_id: vehicle._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalExpenses = expenseAgg[0]?.total || 0;

    res.json({
      success: true,
      data: { vehicle, soldInfo, totalExpenses },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create vehicle
// @route   POST /api/vehicles
exports.createVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create({ ...req.body, created_by: req.user._id });

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      const imageData = req.files.map((file, index) => ({
        vehicle_id: vehicle._id,
        image_url: `/uploads/${file.filename}`,
        is_primary: index === 0,
      }));
      await VehicleImage.insertMany(imageData);
    }

    // Create notification
    await Notification.create({
      title: 'New Vehicle Added',
      message: `${vehicle.vehicle_name} (${vehicle.reg_number}) has been added to inventory`,
      type: 'success',
      vehicle_id: vehicle._id,
    });

    const populatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('created_by', 'full_name username')
      .populate('images');

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: { vehicle: populatedVehicle },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
exports.updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, is_deleted: false },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('created_by', 'full_name username')
      .populate('images');

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, message: 'Vehicle updated', data: { vehicle } });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete vehicle
// @route   DELETE /api/vehicles/:id
exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, is_deleted: false },
      { is_deleted: true },
      { new: true }
    );
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark vehicle as sold
// @route   POST /api/vehicles/:id/sell
exports.sellVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, is_deleted: false });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    if (vehicle.status === 'Sold') {
      return res.status(400).json({ success: false, message: 'Vehicle already sold' });
    }

    const soldRecord = await SoldVehicle.create({
      ...req.body,
      vehicle_id: vehicle._id,
      sold_by: req.user._id,
    });

    vehicle.status = 'Sold';
    await vehicle.save();

    await Notification.create({
      title: 'Vehicle Sold',
      message: `${vehicle.vehicle_name} (${vehicle.reg_number}) sold to ${soldRecord.buyer_name} for ₹${soldRecord.sold_price.toLocaleString('en-IN')}`,
      type: 'success',
      vehicle_id: vehicle._id,
    });

    res.json({ success: true, message: 'Vehicle marked as sold', data: { soldRecord } });
  } catch (error) {
    next(error);
  }
};

// @desc    Add expense to vehicle
// @route   POST /api/vehicles/:id/expenses
exports.addExpense = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, is_deleted: false });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const expense = await VehicleExpense.create({
      ...req.body,
      vehicle_id: vehicle._id,
      added_by: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Expense added', data: { expense } });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload images to existing vehicle
// @route   POST /api/vehicles/:id/images
exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    const existingCount = await VehicleImage.countDocuments({ vehicle_id: req.params.id });

    const imageData = req.files.map((file, index) => ({
      vehicle_id: req.params.id,
      image_url: `/uploads/${file.filename}`,
      is_primary: existingCount === 0 && index === 0,
    }));

    const images = await VehicleImage.insertMany(imageData);
    res.status(201).json({ success: true, message: 'Images uploaded', data: { images } });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vehicle image
// @route   DELETE /api/vehicles/:id/images/:imageId
exports.deleteImage = async (req, res, next) => {
  try {
    const image = await VehicleImage.findOneAndDelete({
      _id: req.params.imageId,
      vehicle_id: req.params.id,
    });
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    // Remove file from disk
    const filePath = path.join(__dirname, '../../', image.image_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    next(error);
  }
};
