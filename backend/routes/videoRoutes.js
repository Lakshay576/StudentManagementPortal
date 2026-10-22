import express from 'express';
import { uploadVideo, getVideos, getVideo, updateVideo, deleteVideo,  uploadSchoolVideo, getSchoolVideos, getSchoolVideo, updateSchoolVideo, deleteSchoolVideo } from '../controllers/videoController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import { uploadVideoFile } from '../middlewares/uploadVideoMiddleware.js';
import { uploadVideoValidator, updateVideoValidator, uploadSchoolVideoValidator, updateSchoolVideoValidator } from '../validators/videoUploadValidator.js';


const router = express.Router();

router.use(protect); 

const superAdmin = authorizeRoles('SuperAdmin');
const schoolAdmin = authorizeRoles('SchoolAdmin');

// Super Admin
router.post('/upload', superAdmin, uploadVideoFile, uploadVideoValidator, uploadVideo);
router.get('/get-videos', superAdmin, getVideos);
router.get('/single-video/:id', superAdmin, getVideo);
router.put('/update-video/:id', superAdmin, updateVideoValidator, updateVideo);
router.delete('/delete-video/:id', superAdmin, deleteVideo);

// School Admin
router.post('/school/upload', schoolAdmin, uploadVideoFile, uploadSchoolVideoValidator, uploadSchoolVideo);
router.get('/school/get-videos', schoolAdmin, getSchoolVideos);
router.get('/school/single-video/:id', schoolAdmin, getSchoolVideo);
router.put('/school/update-video/:id', schoolAdmin, updateSchoolVideoValidator, updateSchoolVideo);
router.delete('/school/delete-video/:id', schoolAdmin, deleteSchoolVideo);

export default router;