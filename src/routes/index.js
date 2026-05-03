const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const vehicleCtrl = require('../controllers/vehicleController');
const dashCtrl = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ─── Auth Routes ──────────────────────────────────────────
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', protect, authCtrl.getMe);
router.put('/auth/profile', protect, authCtrl.updateProfile);
router.put('/auth/change-password', protect, authCtrl.changePassword);

// ─── Dashboard & Reports ──────────────────────────────────
router.get('/dashboard', protect, dashCtrl.getDashboard);
router.get('/reports', protect, adminOnly, dashCtrl.getReports);

// ─── Vehicle Routes ───────────────────────────────────────
router.get('/vehicles', protect, vehicleCtrl.getVehicles);
router.post('/vehicles', protect, upload.array('images', 10), vehicleCtrl.createVehicle);
router.get('/vehicles/:id', protect, vehicleCtrl.getVehicle);
router.put('/vehicles/:id', protect, vehicleCtrl.updateVehicle);
router.delete('/vehicles/:id', protect, adminOnly, vehicleCtrl.deleteVehicle);
router.post('/vehicles/:id/sell', protect, vehicleCtrl.sellVehicle);
router.post('/vehicles/:id/expenses', protect, vehicleCtrl.addExpense);
router.post('/vehicles/:id/images', protect, upload.array('images', 10), vehicleCtrl.uploadImages);
router.delete('/vehicles/:id/images/:imageId', protect, vehicleCtrl.deleteImage);

// ─── Office Expenses ──────────────────────────────────────
router.get('/expenses/categories', protect, dashCtrl.getCategories);
router.post('/expenses/categories', protect, adminOnly, dashCtrl.createCategory);
router.get('/expenses/office', protect, dashCtrl.getOfficeExpenses);
router.post('/expenses/office', protect, upload.single('receipt'), dashCtrl.createOfficeExpense);
router.delete('/expenses/office/:id', protect, adminOnly, dashCtrl.deleteOfficeExpense);

// ─── Notifications ────────────────────────────────────────
router.get('/notifications', protect, dashCtrl.getNotifications);
router.put('/notifications/read-all', protect, dashCtrl.markNotificationsRead);

module.exports = router;
