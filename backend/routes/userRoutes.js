import express from 'express';
import { getProfile, updateProfile, changePassword, createSchoolAdmin, toggleAdminStatus } from '../controllers/userController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import { updateProfileValidator, changePasswordValidator, createSchoolAdminValidator } from '../validators/userValidator.js';

const router = express.Router();

router.use(protect);

router.post('/create-admin', authorizeRoles('SuperAdmin'), createSchoolAdminValidator, createSchoolAdmin);

router.put('/toggle-status/:id', authorizeRoles('SuperAdmin'), toggleAdminStatus);

router.get('/profile', getProfile);

router.put('/profile', updateProfileValidator, updateProfile);

router.put('/change-password', changePasswordValidator, changePassword);

export default router;
