import mongoose from 'mongoose';
import Video from '../models/Video.js';
import School from '../models/School.js';
import { removeFile } from '../utils/Storage.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const paginate = (page, limit, total) => {
  const pagination = {};
  if (page * limit < total) pagination.next = { page: page + 1, limit };
  if (page > 1) pagination.prev = { page: page - 1, limit };
  return pagination;
};

const pageParams = (query) => ({
  page: Math.max(parseInt(query.page, 10) || 1, 1),
  limit: Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100),
});

// =====================================================
// SUPER ADMIN
// =====================================================

export const uploadVideo = async (req, res) => {
  const key = `videos/${req.file.filename}`;

  try {
    const { title, description, category, status, schoolId } = req.body;

    const video = await Video.create({
      title,
      description: description || '',
      category: category || '',
      storageKey: key,
      storageDriver: 'local',
      mimeType: req.file.mimetype,
      size: req.file.size,
      duration: Number(req.body.duration) || 0,
      schoolId,
      status: status === 'Inactive' ? 'Inactive' : 'Active',
      uploadedBy: req.user._id,
      uploaderRole: 'SuperAdmin',
    });

    res.status(201).json({ success: true, message: 'Video uploaded successfully', data: video });
  } catch (error) {
    await removeFile(key); // DB save failed, don't leave an orphan file
    console.error('Upload Video Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getVideos = async (req, res) => {
  try {
    const { page, limit } = pageParams(req.query);
    const { search, status, schoolId } = req.query;

    const filter = {};

    if (search?.trim()) {
      filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }
    if (status && status !== 'All') filter.status = status;

    // filter by the school the video belongs to
    if (schoolId) {
      if (!mongoose.isValidObjectId(schoolId)) {
        return res.status(400).json({ success: false, message: 'Invalid school id' });
      }
      filter.schoolId = schoolId;
    }

    const total = await Video.countDocuments(filter);
    const videos = await Video.find(filter)
      .populate('schoolId', 'name schoolCode')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: videos.length,
      total,
      pagination: paginate(page, limit, total),
      data: videos,
    });
  } catch (error) {
    console.error('Get Videos Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getVideo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid video id' });
    }

    const video = await Video.findById(id)
      .populate('schoolId', 'name email schoolCode phone status logo')
      .populate('uploadedBy', 'name email role phone profileImage');

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    res.status(200).json({ success: true, data: video });
  } catch (error) {
    console.error('Get Video Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid video id' });
    }

    // School Admin uploads are managed by their school, not edited here
    const video = await Video.findOne({ _id: id, uploaderRole: 'SuperAdmin' });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const { title, description, category, status, schoolId } = req.body;

    if (title !== undefined) video.title = title;
    if (description !== undefined) video.description = description;
    if (category !== undefined) video.category = category;
    if (status !== undefined) video.status = status;
    if (schoolId !== undefined) video.schoolId = schoolId; // move the video to another school

    await video.save();
    await video.populate('schoolId', 'name email schoolCode');

    res.status(200).json({ success: true, message: 'Video updated successfully', data: video });
  } catch (error) {
    console.error('Update Video Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid video id' });
    }

    // the Super Admin can delete any video
    const video = await Video.findByIdAndDelete(id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // LOCAL: removes the file from disk. CDN: see utils/Storage.js checklist.
    await removeFile(video.storageKey);
    if (video.thumbnailKey) await removeFile(video.thumbnailKey);

    res.status(200).json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete Video Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =====================================================
// SCHOOL ADMIN
// =====================================================

// per-school storage cap (MB), override in .env
const STORAGE_LIMIT = (Number(process.env.SCHOOL_STORAGE_LIMIT_MB) || 5120) * 1024 * 1024;

const noSchool = (res) =>
  res.status(403).json({ success: false, message: 'No school linked to this account' });

// the school's own uploads
const mine = (schoolId) => ({ schoolId, uploaderRole: 'SchoolAdmin' });
// Super Admin videos for this school (only Active ones)
const fromAdmin = (schoolId) => ({ schoolId, uploaderRole: 'SuperAdmin', status: 'Active' });
// everything this school can see
const visible = (schoolId) => ({ $or: [mine(schoolId), fromAdmin(schoolId)] });

export const uploadSchoolVideo = async (req, res) => {
  const key = `videos/${req.file.filename}`;
  try {
    const schoolId = req.user.schoolId; // forced from the account, never from the body
    if (!schoolId) {
      await removeFile(key);
      return noSchool(res);
    }

    // storage quota (only the school's own uploads count)
    const [usage] = await Video.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), uploaderRole: 'SchoolAdmin' } },
      { $group: { _id: null, used: { $sum: '$size' } } },
    ]);
    if ((usage?.used || 0) + req.file.size > STORAGE_LIMIT) {
      await removeFile(key);
      return res.status(400).json({ success: false, message: 'Storage limit reached for your school' });
    }

    const { title, description, category, status } = req.body;

    const video = await Video.create({
      title,
      description: description || '',
      category: category || '',
      storageKey: key,
      storageDriver: 'local',
      mimeType: req.file.mimetype,
      size: req.file.size,
      duration: Number(req.body.duration) || 0,
      schoolId,
      status: status === 'Inactive' ? 'Inactive' : 'Active',
      uploadedBy: req.user._id,
      uploaderRole: 'SchoolAdmin',
    });

    res.status(201).json({ success: true, message: 'Video uploaded successfully', data: video });
  } catch (error) {
    await removeFile(key); // don't leave orphan files
    console.error('Upload School Video Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getSchoolVideos = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) return noSchool(res);

    const { page, limit } = pageParams(req.query);
    const { search, status, source } = req.query; // source: All | Mine | Admin

    const base =
      source === 'Mine' ? mine(schoolId) : source === 'Admin' ? fromAdmin(schoolId) : visible(schoolId);

    const conditions = [base];
    if (search?.trim()) conditions.push({ title: { $regex: escapeRegex(search.trim()), $options: 'i' } });
    if (status && status !== 'All') conditions.push({ status });
    const filter = { $and: conditions };

    const total = await Video.countDocuments(filter);
    const videos = await Video.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // isOwn tells the UI which rows can be edited or deleted
    const data = videos.map((v) => ({ ...v.toJSON(), isOwn: v.uploaderRole === 'SchoolAdmin' }));

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      pagination: paginate(page, limit, total),
      data,
    });
  } catch (error) {
    console.error('Get School Videos Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getSchoolVideo = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) return noSchool(res);

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid video id' });
    }

    const video = await Video.findOne({ _id: id, ...visible(schoolId) })
      .populate('uploadedBy', 'name email role');

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    res.status(200).json({
      success: true,
      data: { ...video.toJSON(), isOwn: video.uploaderRole === 'SchoolAdmin' },
    });
  } catch (error) {
    console.error('Get School Video Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateSchoolVideo = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) return noSchool(res);

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid video id' });
    }

    const video = await Video.findOne({ _id: id, schoolId });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const { title, description, category, status } = req.body;
    if (title !== undefined) video.title = title;
    if (description !== undefined) video.description = description;
    if (category !== undefined) video.category = category;
    if (status !== undefined) video.status = status;

    await video.save();
    res.status(200).json({ success: true, message: 'Video updated successfully', data: video });
  } catch (error) {
    console.error('Update School Video Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteSchoolVideo = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) return noSchool(res);

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid video id' });
    }

    const video = await Video.findOneAndDelete({ _id: id, schoolId });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    await removeFile(video.storageKey);
    if (video.thumbnailKey) await removeFile(video.thumbnailKey);

    res.status(200).json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete School Video Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};