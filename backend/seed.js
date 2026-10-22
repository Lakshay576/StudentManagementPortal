import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');

    const { SUPERADMIN_NAME, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = process.env;

    if (!SUPERADMIN_NAME || !SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
      console.error('SuperAdmin credentials not found in .env');
      process.exit(1);
    }

    // Check if SuperAdmin already exists
    const adminExists = await User.findOne({ email: SUPERADMIN_EMAIL });
    if (adminExists) {
      console.log('SuperAdmin already exists in the database.');
      process.exit(0);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, salt);

    // Create the SuperAdmin user
    const superAdmin = await User.create({
      name: SUPERADMIN_NAME,
      email: SUPERADMIN_EMAIL,
      password: hashedPassword,
      role: 'SuperAdmin',
      status: 'Active'
    });

    console.log('SuperAdmin Account Created Successfully:');
    console.log(`Email: ${superAdmin.email}`);
    process.exit(0);
  } catch (error) {
    console.error(`Error Seeding Data: ${error.message}`);
    process.exit(1);
  }
};

seedSuperAdmin();
