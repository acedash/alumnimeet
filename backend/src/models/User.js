import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    userType: { type: String, enum: ['student', 'alumni', 'admin'], required: true },
    graduationYear: {
        type: Number,
        required: function () {
            return this.userType === 'alumni';
        }
    },
    currentYear: {
        type: Number,
        required: function () {
            return this.userType === 'student';
        }
    },
    department: { type: String, required: true },
    currentJob: {
        type: String,
        required: function () {
            return this.userType === 'alumni';
        }
    },
    location: String,
    profilePicture: String,
    bio: { type: String, maxlength: 500 },
    socialLinks: {
        linkedin: String,
        twitter: String,
        personalWebsite: String
    },
    achievements: [{
        title: String,
        description: String,
        year: Number
    }],
    experiences: [{
        company: String,
        role: String,
        startYear: Number,
        endYear: Number,
        description: String
    }],
    education: [{
        institution: String,
        degree: String,
        fieldOfStudy: String,
        startYear: Number,
        endYear: Number
    }],
    skills: [String],
    interests: [String],
    isAvailableForMentorship: { type: Boolean, default: true },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    verificationDocument: {
        type: String,
        required: function () {
            return this.userType !== 'admin';
        }
    },
    verificationNotes: { type: String, default: '' },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: Date
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Static method to verify JWT token
userSchema.statics.verifyToken = async function (token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await this.findById(decoded.id).select('-password');
        return user;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

const User = mongoose.model('User', userSchema);

export default User;
