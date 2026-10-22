import express from 'express';
import { 
  createSchool, 
  getSchools, 
  getSchool, 
  updateSchool, 
  deleteSchool 
} from '../controllers/schoolController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import { createSchoolValidator, updateSchoolValidator } from '../validators/schoolValidator.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('SuperAdmin'));

// Routes
router.post('/create-school', createSchoolValidator, createSchool);
router.get('/get-schools', getSchools);

router.get('/single-school/:id', getSchool);
router.put('/update-school/:id', updateSchoolValidator, updateSchool);
router.delete('/delete-school/:id', deleteSchool);

export default router;
