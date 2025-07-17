import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Register a new student
export const registerStudent = async (req, res) => {
    try {
        const { name, email, password, currentYear, department, verificationDocument } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Verification document is required' });
        }

        const verificationDocumentPath = `/uploads/${req.file.filename}`;
        // Create new user
        const user = await User.create({
            name,
            email,
            password,
            userType: 'student',
            currentYear,
            department,
            verificationDocument:verificationDocumentPath,
            verificationStatus: 'pending'
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                verificationStatus: user.verificationStatus,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Register a new alumni
export const registerAlumni = async (req, res) => {
    try {
        const { name, email, password, graduationYear, department, currentJob } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Verification document is required' });
        }

        const verificationDocumentPath = `/uploads/${req.file.filename}`;
        
        // Create new alumni user
        const user = await User.create({
            name,
            email,
            password,
            userType: 'alumni',
            graduationYear,
            department,
            currentJob,
            verificationDocument: verificationDocumentPath,
            verificationStatus: 'pending'
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            userType: user.userType,
            verificationStatus: user.verificationStatus,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login user
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check verification status
        // if (user.verificationStatus === 'pending') {
        //     return res.status(403).json({ 
        //         message: 'Your account is pending verification. Please wait for admin approval.' 
        //     });
        // }

        if (user.verificationStatus === 'rejected') {
            return res.status(403).json({ 
                message: 'Your account verification was rejected. Please contact support.' 
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            userType: user.userType,
            verificationStatus: user.verificationStatus,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user profile
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        console.log("user",user);
        if (user) {
            console.log("user",user);
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 
// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Basic info that all users can update
        user.name = req.body.name || user.name;
        user.bio = req.body.bio || user.bio;
        user.location = req.body.location || user.location;
        
        // Profile picture update
        if (req.file) {
            user.profilePicture = `/uploads/${req.file.filename}`;
        }

        // Social links
        if (req.body.socialLinks) {
            user.socialLinks = {
                linkedin: req.body.socialLinks.linkedin || user.socialLinks?.linkedin,
                twitter: req.body.socialLinks.twitter || user.socialLinks?.twitter,
                personalWebsite: req.body.socialLinks.personalWebsite || user.socialLinks?.personalWebsite
            };
        }

        // User type specific fields
        if (user.userType === 'alumni') {
            user.currentJob = req.body.currentJob || user.currentJob;
            user.isAvailableForMentorship = req.body.isAvailableForMentorship !== undefined 
                ? req.body.isAvailableForMentorship 
                : user.isAvailableForMentorship;
        }

        // Arrays that can be updated (skills, interests, etc.)
        if (req.body.skills) {
            user.skills = req.body.skills;
        }

        if (req.body.interests) {
            user.interests = req.body.interests;
        }

        // Experiences
        if (req.body.experiences) {
            user.experiences = req.body.experiences.map(exp => ({
                company: exp.company,
                role: exp.role,
                startYear: exp.startYear,
                endYear: exp.endYear,
                description: exp.description
            }));
        }

        // Education
        if (req.body.education) {
            user.education = req.body.education.map(edu => ({
                institution: edu.institution,
                degree: edu.degree,
                fieldOfStudy: edu.fieldOfStudy,
                startYear: edu.startYear,
                endYear: edu.endYear
            }));
        }

        // Achievements
        if (req.body.achievements) {
            user.achievements = req.body.achievements.map(ach => ({
                title: ach.title,
                description: ach.description,
                year: ach.year
            }));
        }

        const updatedUser = await user.save();
        
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            userType: updatedUser.userType,
            profilePicture: updatedUser.profilePicture,
            bio: updatedUser.bio,
            socialLinks: updatedUser.socialLinks
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get all alumni with optional filters
export const getAllAlumni = async (req, res) => {
  try {
    // Extract query parameters
    const { 
      page = 1, 
      limit = 10,
      graduationYear,
      department,
      currentJob,
      skills,
      location,
      search
    } = req.query;

    // Build the filter object
    const filter = { userType: 'alumni', verificationStatus: 'verified' };
    
    // Add optional filters
    if (graduationYear) filter.graduationYear = graduationYear;
    if (department) filter.department = department;
    if (currentJob) filter.currentJob = { $regex: currentJob, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (skills) {
      filter.skills = { $in: skills.split(',') };
    }
    
    // Text search across multiple fields
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { currentJob: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const total = await User.countDocuments(filter);

    // Get paginated results
    const alumni = await User.find(filter)
      .select('-password -verificationDocument -verificationNotes')
      .skip(startIndex)
      .limit(parseInt(limit))
      .sort({ graduationYear: -1, name: 1 });

    // Response with pagination info
    res.json({
      success: true,
      count: alumni.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: alumni
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch alumni',
      error: error.message 
    });
  }
};
// Get filter options for alumni
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

    const skills = await User.distinct('skills', { 
      userType: 'alumni',
      skills: { $ne: null }
    }).sort();

    res.json({
      success: true,
      data: {
        graduationYears,
        departments,
        skills
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch filter options',
      error: error.message 
    });
  }
};