import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authService, profileService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const navigate = useNavigate();

    // Load user on initial render
    const loadUser = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                setAuthChecked(true);
                return;
            }

            const userData = await profileService.getProfile();
            setUser(userData);
        } catch (error) {
            console.error('Failed to load user:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
            }
        } finally {
            setLoading(false);
            setAuthChecked(true);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    // Register student with file upload
    const registerStudentUser = async (userData) => {
        try {
            setError(null);
            setLoading(true);
            const response = await authService.registerStudent(userData);
            
            if (response.success && response.token && response.user) {
                localStorage.setItem('token', response.token);
                setUser(response.user);
                setError(null);
                return response;
            } else {
                throw new Error('Invalid registration response structure');
            }
        } catch (error) {
            handleAuthError(error, 'Registration failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Register alumni
    const registerAlumniUser = async (userData) => {
        try {
            setError(null);
            setLoading(true);
            const response = await authService.registerAlumni(userData);
            
            if (response.success && response.token && response.user) {
                localStorage.setItem('token', response.token);
                setUser(response.user);
                setError(null);
                return response;
            } else {
                throw new Error('Invalid registration response structure');
            }
        } catch (error) {
            handleAuthError(error, 'Registration failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Login user
    const loginUserFunction = async (credentials) => {
        try {
            setError(null);
            setLoading(true);
            const response = await authService.loginUser(credentials);
            
            if (response.success && response.token && response.user) {
                localStorage.setItem('token', response.token);
                setUser(response.user);
                setError(null);
                return response;
            } else {
                throw new Error('Invalid login response structure');
            }
        } catch (error) {
            console.error('Login error:', error);
            handleAuthError(error, 'Login failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Logout user
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    }, [navigate]);

    // Common error handler
    const handleAuthError = (error, defaultMessage) => {
        let errorMessage = defaultMessage;
        
        // Handle validation errors
        if (error.response?.data?.errors) {
            errorMessage = error.response.data.errors
                .map(err => err.message)
                .join(', ');
        }
        // Handle specific HTTP status codes
        else if (error.response?.status === 400) {
            errorMessage = error.response.data?.message || 'Invalid request. Please check your input.';
        }
        else if (error.response?.status === 401) {
            if (error.config?.url?.includes('/users/login')) {
                errorMessage = 'Invalid email or password. Please check your credentials.';
            } else {
                errorMessage = 'Session expired. Please login again.';
                localStorage.removeItem('token');
                setUser(null);
            }
        }
        else if (error.response?.status === 403) {
            errorMessage = error.response.data?.message || 'Access denied. Your account may need verification.';
        }
        else if (error.response?.status === 404) {
            errorMessage = 'User not found. Please check your information.';
        }
        else if (error.response?.status === 500) {
            errorMessage = 'Server error. Please try again later.';
        }
        else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }
        else if (error.message) {
            errorMessage = error.message;
        }
        
        setError(errorMessage);
        console.error('Auth error:', error);
    };

    // Check if user is authenticated
    const isAuthenticated = useCallback(() => {
        return !!user && !!localStorage.getItem('token');
    }, [user]);

    // Check if user has specific role
    const hasRole = useCallback((role) => {
        return user?.role === role;
    }, [user]);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                authChecked,
                isAuthenticated,
                hasRole,
                registerStudentUser,
                registerAlumniUser,
                loginUser: loginUserFunction,
                logout,
                loadUser, // Expose loadUser for manual refreshes
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};