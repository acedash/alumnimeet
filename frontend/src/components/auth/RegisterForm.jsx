import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ViewIcon, ViewOffIcon, AttachmentIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './RegisterForm.css';

const validationSchema = Yup.object().shape({
    name: Yup.string()
        .required('Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .matches(/^[a-zA-Z][a-zA-Z0-9 ]*$/, 'Name must start with a letter and can only contain letters, numbers, and spaces'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    userType: Yup.string().required('User type is required'),
    department: Yup.string()
        .required('Department is required')
        .min(2, 'Department must be at least 2 characters')
        .max(100, 'Department must not exceed 100 characters')
        .matches(/^[a-zA-Z &-]+$/, 'Department can only contain letters, spaces, ampersands, and hyphens'),
    currentYear: Yup.number()
        .nullable()
        .when('userType', {
            is: (userType) => userType === 'student',
            then: (schema) => schema
                .required('Current year is required for students')
                .min(1, 'Current year must be between 1 and 4')
                .max(4, 'Current year must be between 1 and 4')
                .integer('Current year must be a whole number'),
            otherwise: (schema) => schema.notRequired()
        }),
    graduationYear: Yup.number()
        .nullable()
        .when('userType', {
            is: (userType) => userType === 'alumni',
            then: (schema) => schema
                .required('Graduation year is required for alumni')
                .min(1980, 'Graduation year must be 1980 or later')
                .max(new Date().getFullYear(), 'Graduation year cannot be in the future')
                .integer('Graduation year must be a whole number'),
            otherwise: (schema) => schema.notRequired()
        }),
    currentJob: Yup.string()
        .nullable()
        .when('userType', {
            is: (userType) => userType === 'alumni',
            then: (schema) => schema
                .required('Current job is required for alumni')
                .min(2, 'Current job must be at least 2 characters')
                .max(200, 'Current job must not exceed 200 characters')
                .matches(/^[a-zA-Z0-9\s,.'&-]+$/, 'Current job can contain letters, numbers, spaces, commas, periods, apostrophes, ampersands, and hyphens'),
            otherwise: (schema) => schema.notRequired()
        }),
    bio: Yup.string()
        .max(500, 'Bio must not exceed 500 characters')
        .matches(/^[a-zA-Z0-9\s,.'&\-()!?]*$/, 'Bio contains invalid characters'),
    verificationDocument: Yup.mixed()
        .required('Verification document is required')
        .test('fileType', 'Only PDF, JPEG, PNG files are allowed', (value) => {
            if (!value) return false;
            return ['application/pdf', 'image/jpeg', 'image/png'].includes(value.type);
        })
        .test('fileSize', 'File size must not exceed 5MB', (value) => {
            if (!value) return false;
            return value.size <= 5 * 1024 * 1024; // 5MB
        }),
});

const RegisterForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [registrationError, setRegistrationError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { registerStudentUser, registerAlumniUser } = useAuth();

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            password: '',
            userType: 'student',
            currentYear: '',
            graduationYear: '',
            department: '',
            currentJob: '',
            bio: '',
            verificationDocument: null,
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                setIsUploading(true);
                setRegistrationError('');
                setSuccessMessage('');
                
                const formData = new FormData();
                
                // Common fields for all user types
                formData.append('name', values.name);
                formData.append('email', values.email);
                formData.append('password', values.password);
                formData.append('userType', values.userType);
                formData.append('department', values.department);
                
                // Conditional fields
                if (values.userType === 'student') {
                    formData.append('currentYear', values.currentYear);
                } else if (values.userType === 'alumni') {
                    formData.append('graduationYear', values.graduationYear);
                    formData.append('currentJob', values.currentJob);
                }
                
                // Bio is optional
                if (values.bio) {
                    formData.append('bio', values.bio);
                }
                
                // Append the file
                if (values.verificationDocument) {
                    formData.append('document', values.verificationDocument);
                }
                
                // Call the appropriate registration function
                let result;
                if (values.userType === 'student') {
                    result = await registerStudentUser(formData);
                } else {
                    result = await registerAlumniUser(formData);
                }
                
                if (result.success) {
                    setSuccessMessage(result.message || 'Registration successful! Your account is pending verification.');
                    // Reset form after successful registration
                    formik.resetForm();
                }
            } catch (error) {
                let errorMessage = 'Registration failed. Please try again.';
                
                // Handle validation errors
                if (error.response?.data?.errors) {
                    errorMessage = error.response.data.errors
                        .map(err => err.message)
                        .join(', ');
                }
                // Handle specific error responses
                else if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                }
                else if (error.message) {
                    errorMessage = error.message;
                }
                
                setRegistrationError(errorMessage);
            } finally {
                setIsUploading(false);
            }
        }
    });

    const handleFileChange = (event) => {
        const file = event.currentTarget.files[0];
        formik.setFieldValue('verificationDocument', file);
    };

    return (
        <div className="register-form-container">
            <form onSubmit={formik.handleSubmit} className="register-form">
                <div className="register-form-content">
                    <h1 className="register-form-title">Create Account</h1>
                    <div className="register-form-divider"></div>

                    {registrationError && (
                        <div className="register-form-error-alert">
                            <span className="register-form-error-icon">⚠️</span>
                            {registrationError}
                        </div>
                    )}

                    {successMessage && (
                        <div className="register-form-success-alert">
                            <span className="register-form-success-icon">✅</span>
                            {successMessage}
                        </div>
                    )}

                    <div className={`register-form-control ${formik.touched.name && formik.errors.name ? 'register-form-error' : ''}`}>
                        <label className="register-form-label">Name</label>
                        <input
                            type="text"
                        name="name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                                                    placeholder="e.g., John Doe, Alice Smith"
                            className="register-form-input"
                        />
                        {formik.touched.name && formik.errors.name && (
                            <div className="register-form-error-message">{formik.errors.name}</div>
                        )}
                    </div>

                    <div className={`register-form-control ${formik.touched.email && formik.errors.email ? 'register-form-error' : ''}`}>
                        <label className="register-form-label">Email</label>
                        <input
                        type="email"
                        name="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Enter your email"
                            className="register-form-input"
                        />
                        {formik.touched.email && formik.errors.email && (
                            <div className="register-form-error-message">{formik.errors.email}</div>
                        )}
                    </div>

                    <div className={`register-form-control ${formik.touched.password && formik.errors.password ? 'register-form-error' : ''}`}>
                        <label className="register-form-label">Password</label>
                        <div className="register-form-password-group">
                            <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                                                            placeholder="Min 6 chars with uppercase, lowercase & number"
                                className="register-form-input"
                            />
                            <button
                                type="button"
                                className="register-form-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        {formik.touched.password && formik.errors.password && (
                            <div className="register-form-error-message">{formik.errors.password}</div>
                        )}
                    </div>

                    <div className={`register-form-control ${formik.touched.userType && formik.errors.userType ? 'register-form-error' : ''}`}>
                        <label className="register-form-label">User Type</label>
                        <select
                        name="userType"
                        value={formik.values.userType}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                            className="register-form-select"
                    >
                        <option value="student">Student</option>
                        <option value="alumni">Alumni</option>
                        </select>
                        {formik.touched.userType && formik.errors.userType && (
                            <div className="register-form-error-message">{formik.errors.userType}</div>
                        )}
                    </div>

                {formik.values.userType === 'student' ? (
                        <div className={`register-form-control ${formik.touched.currentYear && formik.errors.currentYear ? 'register-form-error' : ''}`}>
                            <label className="register-form-label">Current Year</label>
                            <input
                            type="number"
                            name="currentYear"
                            value={formik.values.currentYear}
                            onChange={(e) => formik.setFieldValue('currentYear', parseInt(e.target.value) || '')}
                            onBlur={formik.handleBlur}
                            placeholder="Enter your current year (1-4)"
                                className="register-form-input"
                                min="1"
                                max="4"
                            />
                            {formik.touched.currentYear && formik.errors.currentYear && (
                                <div className="register-form-error-message">{formik.errors.currentYear}</div>
                            )}
                        </div>
                    ) : (
                        <div className={`register-form-control ${formik.touched.graduationYear && formik.errors.graduationYear ? 'register-form-error' : ''}`}>
                            <label className="register-form-label">Graduation Year</label>
                            <input
                            type="number"
                            name="graduationYear"
                            value={formik.values.graduationYear}
                            onChange={(e) => formik.setFieldValue('graduationYear', parseInt(e.target.value) || '')}
                            onBlur={formik.handleBlur}
                            placeholder="Enter your graduation year"
                                className="register-form-input"
                                max={new Date().getFullYear()}
                            />
                            {formik.touched.graduationYear && formik.errors.graduationYear && (
                                <div className="register-form-error-message">{formik.errors.graduationYear}</div>
                            )}
                        </div>
                    )}

                    <div className={`register-form-control ${formik.touched.department && formik.errors.department ? 'register-form-error' : ''}`}>
                        <label className="register-form-label">Department</label>
                        <input
                            type="text"
                        name="department"
                        value={formik.values.department}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                                                    placeholder="e.g., Computer Science & Engineering"
                            className="register-form-input"
                        />
                        {formik.touched.department && formik.errors.department && (
                            <div className="register-form-error-message">{formik.errors.department}</div>
                        )}
                    </div>

                {formik.values.userType === 'alumni' && (
                        <div className={`register-form-control ${formik.touched.currentJob && formik.errors.currentJob ? 'register-form-error' : ''}`}>
                            <label className="register-form-label">Current Job</label>
                            <input
                                type="text"
                            name="currentJob"
                            value={formik.values.currentJob}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                                                            placeholder="e.g., Software Engineer at Google"
                                className="register-form-input"
                            />
                            {formik.touched.currentJob && formik.errors.currentJob && (
                                <div className="register-form-error-message">{formik.errors.currentJob}</div>
                            )}
                        </div>
                    )}

                    <div className={`register-form-control ${formik.touched.bio && formik.errors.bio ? 'register-form-error' : ''}`}>
                        <label className="register-form-label">Bio</label>
                        <textarea
                        name="bio"
                        value={formik.values.bio}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                                                    placeholder="Tell us about yourself, your interests, and goals (optional)"
                            className="register-form-textarea"
                        rows={4}
                    />
                        {formik.touched.bio && formik.errors.bio && (
                            <div className="register-form-error-message">{formik.errors.bio}</div>
                        )}
                    </div>

                    <div className={`register-form-control ${formik.touched.verificationDocument && formik.errors.verificationDocument ? 'register-form-error' : ''}`}>
                        <label className="register-form-label">College ID</label>
                        <input
                        type="file"
                        name="verificationDocument"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                            className="register-form-file-input"
                        id="verification-document"
                    />
                        <label
                        htmlFor="verification-document"
                            className="register-form-file-upload"
                        >
                            <span className="register-form-file-icon">📎</span>
                        {formik.values.verificationDocument
                            ? formik.values.verificationDocument.name
                            : 'Upload Verification Document'}
                        </label>
                        {formik.touched.verificationDocument && formik.errors.verificationDocument && (
                            <div className="register-form-error-message">{formik.errors.verificationDocument}</div>
                        )}
                    </div>

                    <button
                    type="submit"
                        className="register-form-submit"
                        disabled={formik.isSubmitting || isUploading}
                    >
                        {formik.isSubmitting || isUploading ? 'Registering...' : 'Register'}
                    </button>

                    <div className="register-form-login-link">
                    Already have an account?{' '}
                        <Link to="/login" className="register-form-login-text">
                        Login here
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default RegisterForm; 