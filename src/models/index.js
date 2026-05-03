const mongoose = require('mongoose');

// ─── Vehicle Images ───────────────────────────────────────
const vehicleImageSchema = new mongoose.Schema(
  {
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    image_url: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    is_primary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: 'uploaded_at', updatedAt: false } }
);
vehicleImageSchema.index({ vehicle_id: 1 });

// ─── Vehicle Expenses ─────────────────────────────────────
const vehicleExpenseSchema = new mongoose.Schema(
  {
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    expense_date: {
      type: Date,
      required: [true, 'Expense date is required'],
    },
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);
vehicleExpenseSchema.index({ vehicle_id: 1 });

// ─── Expense Categories ───────────────────────────────────
const expenseCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

// ─── Office Expenses ──────────────────────────────────────
const officeExpenseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseCategory',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    expense_date: {
      type: Date,
      required: [true, 'Expense date is required'],
    },
    receipt_url: {
      type: String,
      default: null,
    },
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);
officeExpenseSchema.index({ expense_date: -1 });

// ─── Sold Vehicles ────────────────────────────────────────
const soldVehicleSchema = new mongoose.Schema(
  {
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      unique: true,
    },
    buyer_name: {
      type: String,
      required: [true, 'Buyer name is required'],
      trim: true,
    },
    buyer_phone: {
      type: String,
      trim: true,
      default: null,
    },
    buyer_address: {
      type: String,
      default: null,
    },
    sold_price: {
      type: Number,
      required: [true, 'Sold price is required'],
      min: [0, 'Sold price cannot be negative'],
    },
    payment_mode: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Cheque', 'EMI'],
      required: [true, 'Payment mode is required'],
    },
    sold_date: {
      type: Date,
      required: [true, 'Sold date is required'],
    },
    sold_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

// ─── Notifications ────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'error'],
      default: 'info',
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);
notificationSchema.index({ is_read: 1, created_at: -1 });

module.exports = {
  VehicleImage: mongoose.model('VehicleImage', vehicleImageSchema),
  VehicleExpense: mongoose.model('VehicleExpense', vehicleExpenseSchema),
  ExpenseCategory: mongoose.model('ExpenseCategory', expenseCategorySchema),
  OfficeExpense: mongoose.model('OfficeExpense', officeExpenseSchema),
  SoldVehicle: mongoose.model('SoldVehicle', soldVehicleSchema),
  Notification: mongoose.model('Notification', notificationSchema),
};
