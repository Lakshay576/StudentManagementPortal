import express from 'express';
import { login, logout } from '../controllers/authController.js';
import { loginValidator } from '../validators/authValidator.js';

const router = express.Router();

router.post('/login', loginValidator, login);
router.post('/logout', logout);

export default router;
