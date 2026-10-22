import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Check if token exists in cookies
  if (req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  } 
  // Fallback for Authorization header (Bearer token) if needed later
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route. Please login first.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User associated with this token no longer exists.' });
    }

    if (req.user.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your account is suspended or inactive.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid token. Please login again.' });
  }
};

// Grant access to specific roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not authorized to access this resource.`
      });
    }
    next();
  };
};
