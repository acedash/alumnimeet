import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginForm.css'; // Import the CSS file

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
      await loginUser(values);
      alert('Login successful');
      navigate('/'); // First navigate
      window.location.reload(); // Then reload the page
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  },
});


  return (
    <form className="login-form" onSubmit={formik.handleSubmit}>
      <div className="login-form-content">
        <h2 className="login-form-title">Welcome Back</h2>
        <div className="login-form-divider"></div>

        <div className={`form-control ${formik.touched.email && formik.errors.email ? 'error' : ''}`}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter your email"
          />
          {formik.touched.email && formik.errors.email && (
            <div className="error-message">{formik.errors.email}</div>
          )}
        </div>

        <div className={`form-control ${formik.touched.password && formik.errors.password ? 'error' : ''}`}>
          <label htmlFor="password">Password</label>
          <div className="password-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {formik.touched.password && formik.errors.password && (
            <div className="error-message">{formik.errors.password}</div>
          )}
        </div>

        <button
          type="submit"
          className="login-button"
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? 'Logging in...' : 'Login'}
        </button>

        <p className="register-link">
          Don't have an account?{' '}
          <Link to="/register" className="register-link-text">
            Register here
          </Link>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;