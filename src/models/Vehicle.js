const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    reg_number: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    vehicle_name: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1990, 'Year must be 1990 or later'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
    },
    rc_owner_name: {
      type: String,
      required: [true, 'RC owner name is required'],
      trim: true,
    },
    rc_owner_address: {
      type: String,
      required: [true, 'RC owner address is required'],
    },
    no_of_owners: {
      type: String,
      enum: ['1st', '2nd', '3rd', '4th+'],
      required: [true, 'Number of owners is required'],
    },
    selling_cost: {
      type: Number,
      required: [true, 'Selling cost is required'],
      min: [0, 'Selling cost cannot be negative'],
    },
    purchase_cost: {
      type: Number,
      required: [true, 'Purchase cost is required'],
      min: [0, 'Purchase cost cannot be negative'],
    },
    mileage_km: {
      type: Number,
      required: [true, 'Mileage is required'],
      min: [0, 'Mileage cannot be negative'],
    },
    insurance_status: {
      type: String,
      enum: ['Active', 'Expired', 'None'],
      required: [true, 'Insurance status is required'],
    },
    insurance_expiry_date: {
      type: Date,
      default: null,
    },
    hypothetication: {
      type: Boolean,
      default: false,
    },
    purchase_date: {
      type: Date,
      required: [true, 'Purchase date is required'],
    },
    purchase_from: {
      type: String,
      required: [true, 'Purchase source is required'],
      trim: true,
    },
    fine_details: {
      type: String,
      default: null,
    },
    remark: {
      type: String,
      default: null,
    },
    rto_status: {
      type: String,
      enum: ['Transfer Pending', 'Completed', 'Not Applicable'],
      default: 'Not Applicable',
    },
    status: {
      type: String,
      enum: ['Available', 'Pending', 'Sold'],
      default: 'Available',
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for images
vehicleSchema.virtual('images', {
  ref: 'VehicleImage',
  localField: '_id',
  foreignField: 'vehicle_id',
});

// Virtual for expenses
vehicleSchema.virtual('expenses', {
  ref: 'VehicleExpense',
  localField: '_id',
  foreignField: 'vehicle_id',
});

// Index for faster queries
vehicleSchema.index({ status: 1, is_deleted: 1 });
vehicleSchema.index({ reg_number: 1 });
vehicleSchema.index({ created_at: -1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
