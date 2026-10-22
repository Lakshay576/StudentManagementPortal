import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UPLOAD_ROOT } from '../utils/Storage.js';

const VIDEO_DIR = path.join(UPLOAD_ROOT, 'videos');
fs.mkdirSync(VIDEO_DIR, { recursive: true });

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB
const ALLOWED = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, VIDEO_DIR),
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${ALLOWED[file.mimetype]}`),
  }),
  fileFilter: (req, file, cb) => {
    if (!ALLOWED[file.mimetype]) return cb(new Error('Only MP4, WebM or MOV videos are allowed'));
    cb(null, true);
  },
  limits: { fileSize: MAX_SIZE, files: 1 },
}).single('video'); // form-data field name

// wrapper so multer errors return clean JSON
export const uploadVideoFile = (req, res, next) => {
  upload(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Video exceeds the 500 MB limit' : err.message;
    res.status(400).json({ success: false, message });
  });
};