import User from '../models/User.js';

// @desc    Get all verified alumni (without pagination)
// @route   GET /api/alumni
// @access  Private
export const getAllAlumni = async (req, res) => {
  try {
    // Get all verified alumni
    const alumni = await User.find({ 
      userType: 'alumni',
     
    })
    .select('-password -verificationDocument -verificationNotes -__v')
    .sort({ graduationYear: -1, name: 1 });
console.log(alumni);

    res.json({
      success: true,
      count: alumni.length,
      data: alumni
    });
  } catch (error) {
    console.error('Error fetching alumni:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch alumni',
      error: error.message 
    });
  }
};

// @desc    Get available filter options for alumni
// @route   GET /api/alumni/filters
// @access  Private
export const getAlumniFilters = async (req, res) => {
  try {
    const graduationYears = await User.distinct('graduationYear', { 
      userType: 'alumni',
      graduationYear: { $ne: null }
    }).sort({ graduationYear: -1 });

    const departments = await User.distinct('department', { 
      userType: 'alumni',
      department: { $ne: null }
    }).sort({ department: 1 });

    const skills = await User.aggregate([
      { $match: { userType: 'alumni', skills: { $ne: null, $exists: true } } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills' } },
      { $sort: { _id: 1 } }
    ]).then(results => results.map(item => item._id));

    res.json({
      success: true,
      data: {
        graduationYears,
        departments,
        skills
      }
    });
  } catch (error) {
    console.error('Error fetching alumni filters:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch filter options',
      error: error.message 
    });
  }
};

// @desc    Get single alumni profile
// @route   GET /api/alumni/:id
// @access  Private
export const getAlumniProfile = async (req, res) => {
  try {
    const alumni = await User.findOne({
      _id: req.params.id,
      userType: 'alumni'
    }).select('-password -verificationDocument -verificationNotes -__v');

    if (!alumni) {
      return res.status(404).json({
        success: false,
        message: 'Alumni not found'
      });
    }

    res.json({
      success: true,
      data: alumni
    });
  } catch (error) {
    console.error('Error fetching alumni profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch alumni profile',
      error: error.message 
    });
  }
};

// @desc    Search alumni by name, skills, or job
// @route   GET /api/alumni/search
// @access  Private
export const searchAlumni = async (req, res) => {
  try {
    const { q: query, limit = 5 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = await User.find({
      userType: 'alumni',
      verificationStatus: 'verified',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { currentJob: { $regex: query, $options: 'i' } },
        { skills: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name profilePicture currentJob graduationYear department skills')
    .limit(parseInt(limit));

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error searching alumni:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to search alumni',
      error: error.message 
    });
  }
};

// @desc    Get similar alumni (by department and skills)
// @route   GET /api/alumni/:id/similar
// @access  Private
export const getSimilarAlumni = async (req, res) => {
  try {
    const alumni = await User.findById(req.params.id)
      .select('department skills');

    if (!alumni) {
      return res.status(404).json({
        success: false,
        message: 'Alumni not found'
      });
    }

    const similarAlumni = await User.find({
      _id: { $ne: req.params.id },
      userType: 'alumni',
      verificationStatus: 'verified',
      $or: [
        { department: alumni.department },
        { skills: { $in: alumni.skills || [] } }
      ]
    })
    .select('name profilePicture currentJob graduationYear department skills')
    .limit(6);

    res.json({
      success: true,
      count: similarAlumni.length,
      data: similarAlumni
    });
  } catch (error) {
    console.error('Error fetching similar alumni:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch similar alumni',
      error: error.message 
    });
  }
};