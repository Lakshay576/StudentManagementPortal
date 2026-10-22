import User from '../models/User.js';
import School from '../models/School.js';
import bcrypt from 'bcryptjs';

export const createSchoolAdmin = async (req, res) => {
  try {
    const { name, email, password, schoolId, phone } = req.body;

    // Check if user email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Verify if school exists
    const schoolExists = await School.findById(schoolId);
    if (!schoolExists) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'SchoolAdmin',
      schoolId,
      phone
    });

    res.status(201).json({
      success: true,
      message: 'School Admin created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId
      }
    });
  } catch (error) {
    console.error('Create School Admin Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, profileImage } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;


    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password cannot be the same as the old password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const toggleAdminStatus = async (req, res) => {
  try {
    // Only find users that are SchoolAdmins
    const user = await User.findOne({ _id: req.params.id, role: 'SchoolAdmin' });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'School Admin not found' });
    }

    // Toggle the status
    user.status = user.status === 'Active' ? 'Suspended' : 'Active';
    await user.save();

    res.status(200).json({
      success: true,
      message: `Admin account is now ${user.status}`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Toggle Admin Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
