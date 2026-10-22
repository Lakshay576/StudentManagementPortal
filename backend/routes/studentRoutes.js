import express from 'express'
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import { createStudent, getStudents, getStudent, updateStudent, deleteStudent } from '../controllers/studentController.js';
import { createStudentValidator, updateStudentValidator } from '../validators/studentValidator.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('SchoolAdmin'));

router.post('/create-student', createStudentValidator, createStudent);
router.get('/get-students', getStudents);
router.get('/single-student/:id', getStudent);
router.put('/update-student/:id', updateStudentValidator, updateStudent);
router.delete('/delete-student/:id', deleteStudent);

export default router;