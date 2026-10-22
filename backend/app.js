import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import schoolRoutes from './routes/schoolRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import dashboardRoutes from "./routes/dashboardRoutes.js";
import studentRoutes from './routes/studentRoutes.js';

const app = express();

// console.log('CORS origin:', process.env.FrontendUrl)

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Middleware
app.use(cors({
  origin: process.env.FrontendUrl, // e.g. http://localhost:5173
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Basic Route
app.get('/', (req, res) => {
  res.send('School Management API is running...');
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentRoutes);

export default app;
