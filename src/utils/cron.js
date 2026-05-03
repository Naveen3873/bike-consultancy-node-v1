const cron = require('node-cron');
const Vehicle = require('../models/Vehicle');
const { Notification } = require('../models/index');

// Run every day at 9 AM
const insuranceExpiryJob = cron.schedule('0 9 * * *', async () => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const vehicles = await Vehicle.find({
      is_deleted: false,
      status: 'Available',
      insurance_status: 'Active',
      insurance_expiry_date: { $lte: thirtyDaysFromNow, $gte: new Date() },
    });

    for (const vehicle of vehicles) {
      const daysLeft = Math.ceil(
        (vehicle.insurance_expiry_date - new Date()) / (1000 * 60 * 60 * 24)
      );
      await Notification.create({
        title: 'Insurance Expiring Soon',
        message: `${vehicle.vehicle_name} (${vehicle.reg_number}) insurance expires in ${daysLeft} day(s)`,
        type: 'warning',
        vehicle_id: vehicle._id,
      });
    }

    if (vehicles.length > 0) {
      console.log(`⚠️  Insurance expiry alerts created for ${vehicles.length} vehicles`);
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
}, { scheduled: false });

module.exports = insuranceExpiryJob;
