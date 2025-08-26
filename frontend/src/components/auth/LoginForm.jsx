import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginForm.css';

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoginError(''); // Clear any previous errors
        const result = await loginUser(values);
        
        if (result.success) {
          // Login successful - navigate to home
          navigate('/', { replace: true });
        }
      } catch (error) {
        // Handle different types of login errors
        let errorMessage = 'Login failed. Please try again.';
        
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
        else if (error.response?.status === 401) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        }
        else if (error.response?.status === 403) {
          errorMessage = 'Access denied. Your account may need verification.';
        }
        else if (error.response?.status === 404) {
          errorMessage = 'User not found. Please check your email address.';
        }
        else if (error.message) {
          errorMessage = error.message;
        }
        
        setLoginError(errorMessage);
      }
    },
  });

  return (
    <div className="login-form-container">
      <form className="login-form" onSubmit={formik.handleSubmit}>
        <div className="login-form-content">
          <h1 className="login-form-title">Welcome Back</h1>
          <div className="login-form-divider"></div>

          {loginError && (
            <div className="login-form-error-alert">
              <span className="login-form-error-icon">⚠️</span>
              {loginError}
            </div>
          )}

          <div className={`login-form-control ${formik.touched.email && formik.errors.email ? 'login-form-error' : ''}`}>
            <label htmlFor="email" className="login-form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter your email"
              className="login-form-input"
            />
            {formik.touched.email && formik.errors.email && (
              <div className="login-form-error-message">{formik.errors.email}</div>
            )}
          </div>

          <div className={`login-form-control ${formik.touched.password && formik.errors.password ? 'login-form-error' : ''}`}>
            <label htmlFor="password" className="login-form-label">Password</label>
            <div className="login-form-password-group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter your password"
                className="login-form-input"
              />
              <button
                type="button"
                className="login-form-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <div className="login-form-error-message">{formik.errors.password}</div>
            )}
          </div>

          <button
            type="submit"
            className="login-form-submit"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? 'Logging in...' : 'Login'}
          </button>

          <div className="login-form-register-link">
            Don't have an account?{' '}
            <Link to="/register" className="login-form-register-text">
              Register here
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;