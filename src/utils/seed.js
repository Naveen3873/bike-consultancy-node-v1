require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { ExpenseCategory } = require('../models/index');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Create default admin
  const existing = await User.findOne({ username: 'admin' });
  if (!existing) {
    await User.create({
      username: 'admin',
      password_hash: 'Admin@123',
      full_name: 'Shop Administrator',
      email: 'admin@bikeconsultancy.com',
      role: 'admin',
    });
    console.log('✅ Default admin created: admin / Admin@123');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // Create default categories
  const cats = ['Rent', 'Electricity', 'Water', 'Salaries', 'Maintenance', 'Supplies', 'Marketing', 'Internet', 'Miscellaneous'];
  for (const name of cats) {
    await ExpenseCategory.findOneAndUpdate({ name }, { name, is_active: true }, { upsert: true });
  }
  console.log('✅ Expense categories seeded');

  await mongoose.disconnect();
  console.log('Done!');
};

seed().catch(console.error);
