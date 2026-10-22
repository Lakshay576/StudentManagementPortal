import School from '../models/School.js';
import Video from '../models/Video.js';
import { removeFile } from '../utils/Storage.js';


export const createSchool = async (req, res) => {
  try {
    const { email, schoolCode } = req.body;

    // Check for existing school by email
    const emailExists = await School.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'A school with this email already exists' });
    }

    // Check if school with this exact code already exists
    const codeExists = await School.findOne({ schoolCode });
    if (codeExists) {
      return res.status(400).json({ success: false, message: 'A school with this school code already exists' });
    }

    const school = await School.create(req.body);
    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: school
    });
  } catch (error) {
    console.error('Create School Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const getSchools = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const { search, status } = req.query;
    const filter = {};
    if (search?.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escaped, $options: 'i' };
    }

    if (['Active', 'Inactive'].includes(status)) filter.status = status;

    const total = await School.countDocuments(filter);

    // Do not populate admins on the list view to keep the payload lightweight
    const schools = await School.find(filter).skip(startIndex).limit(limit);

    // Setup pagination object
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: schools.length,
      total,
      pagination,
      data: schools
    });
  } catch (error) {
    console.error('Get Schools Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const getSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id).populate('admins', 'name email phone status profileImage');
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // every video belongs to exactly one school now
    const videoFilter = { schoolId: school._id };

    const [videos, [stats]] = await Promise.all([
      Video.find(videoFilter)
        .select('title category status size duration mimeType storageKey uploaderRole createdAt')
        .sort({ createdAt: -1 })
        .limit(50),
      Video.aggregate([
        { $match: videoFilter },
        {
          $group: {
            _id: null,
            totalVideos: { $sum: 1 },
            totalSize: { $sum: '$size' },         // bytes on the server
            totalDuration: { $sum: '$duration' }, // seconds
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...school.toJSON(),
        videos,
        videoStats: {
          totalVideos: stats?.totalVideos || 0,
          totalSize: stats?.totalSize || 0,
          totalDuration: stats?.totalDuration || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get School Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const updateSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    res.status(200).json({ success: true, data: school });
  } catch (error) {
    console.error('Update School Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const deleteSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // all of this school's videos go with it: records first, then the files
    const videos = await Video.find({ schoolId: school._id }).select('storageKey thumbnailKey');

    if (videos.length) {
      await Video.deleteMany({ schoolId: school._id });
      await Promise.all(
        videos.flatMap((v) => [removeFile(v.storageKey), removeFile(v.thumbnailKey)])
      );
    }

    res.status(200).json({
      success: true,
      message: 'School deleted successfully',
      deletedVideos: videos.length,
    });
  } catch (error) {
    console.error('Delete School Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};