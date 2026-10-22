import School from '../models/School.js';
import User from '../models/User.js';
import Video from '../models/Video.js';

const pctChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10; // 1 decimal
};

export const getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const startThis = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // total + this month + last month + % change for any model/filter
    const countStats = async (Model, base = {}) => {
      const [total, thisMonth, lastMonth] = await Promise.all([
        Model.countDocuments(base),
        Model.countDocuments({ ...base, createdAt: { $gte: startThis } }),
        Model.countDocuments({ ...base, createdAt: { $gte: startLast, $lt: startThis } }),
      ]);
      return { total, thisMonth, lastMonth, change: pctChange(thisMonth, lastMonth) };
    };

    const [
      schools, activeSchools, inactiveSchools,
      admins, students,
      videos, activeVideos,
      [storage],
    ] = await Promise.all([
      countStats(School),
      School.countDocuments({ status: 'Active' }),
      School.countDocuments({ status: 'Inactive' }),
      countStats(User, { role: 'SchoolAdmin' }),
      countStats(User, { role: 'Student' }),
      countStats(Video),
      Video.countDocuments({ status: 'Active' }),
      Video.aggregate([
        { $group: { _id: null, totalSize: { $sum: '$size' }, totalDuration: { $sum: '$duration' } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        schools: { ...schools, active: activeSchools, inactive: inactiveSchools },
        admins,
        students,
        videos: {
          ...videos,
          active: activeVideos,
          totalSize: storage?.totalSize || 0,         // bytes
          totalDuration: storage?.totalDuration || 0, // seconds
        },
      },
    });
  } catch (error) {
    console.error('Dashboard Summary Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};