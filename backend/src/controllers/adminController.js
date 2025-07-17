import User from '../models/User.js';

// Get all pending verifications
export const getPendingVerifications = async (req, res) => {
    try {
        const pendingUsers = await User.find({ verificationStatus: 'pending' })
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verify a user
export const verifyUser = async (req, res) => {
    try {
        const { userId, status, notes } = req.body;
        const adminId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.verificationStatus !== 'pending') {
            return res.status(400).json({ message: 'User is not pending verification' });
        }

        user.verificationStatus = status;
        user.verificationNotes = notes;
        user.verifiedBy = adminId;
        user.verifiedAt = new Date();

        await user.save();

        res.json({ message: 'User verification status updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all users with their verification status
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get verification statistics
export const getVerificationStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: '$verificationStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = stats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.json(formattedStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 