import fs from 'fs/promises';
import path from 'path';

export const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

export const removeFile = async (key) => {
  if (!key) return;
  try {
    await fs.unlink(path.join(UPLOAD_ROOT, key));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Remove file error:', err.message);
  }
};