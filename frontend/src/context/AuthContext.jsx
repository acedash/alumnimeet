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
    const registerStudentUser = async (userData, file) => {
        try {
            setError(null);
            setLoading(true);
            const data = await authService.registerStudent(userData, file);
            localStorage.setItem('token', data.token);
            setUser(data.user);
            navigate('/dashboard'); // Redirect after successful registration
            return data;
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
            const data = await authService.registerAlumni(userData);
            localStorage.setItem('token', data.token);
            setUser(data.user);
            navigate('/dashboard');
            return data;
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
            const data = await authService.loginUser(credentials);
            localStorage.setItem('token', data.token);
            setUser(data.user);
            navigate('/dashboard');
            return data;
        } catch (error) {
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
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            defaultMessage;
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