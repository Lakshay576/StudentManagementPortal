import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { JWT_SECRET, JWT_EXPIRE, COOKIE_EXPIRE, NODE_ENV } = process.env;


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // if (user.role !== role) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Access denied: Role mismatch'
    //   });
    // }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status.toLowerCase()}. Please contact support.`
      });
    }

    const payload = {
      id: user._id,
      role: user.role,
      schoolId: user.schoolId
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRE
    });

    // Configure cookie options (from env in days)
    const cookieExpireDays = Number(COOKIE_EXPIRE);
    const cookieOptions = {
      expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
      httpOnly: true, // Secure, prevents XSS attacks
      secure: NODE_ENV === 'production',
    };

    res.status(200).cookie('authToken', token, cookieOptions).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};


export const logout = (req, res) => {
  res
    .clearCookie('authToken', {
      httpOnly: true,
      secure: NODE_ENV === 'production',
    })
    .status(200)
    .json({ success: true, message: 'Logged out successfully' });
};