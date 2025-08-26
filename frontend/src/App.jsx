import { Box } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';

// Pages
import Home from './pages/user/Home';
import ProfilePage from './pages/user/ProfilePage';
import AlumniDirectoryPage from './pages/user/AlumniDirectoryPage';
import AlumniProfilePage from './pages/user/AlumniProfilePage';
import ChatPage from './pages/user/ChatPage';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { ChatProvider } from './context/chatContext';
import MessagesList from './pages/user/MessagesList';
import PostForm from './components/postForm/PostForm';

const PrivateRoute = ({ children }) => {
    const { user, loading, authChecked } = useAuth();

    if (!authChecked || loading) {
        return <LoadingSpinner />;
    }

    return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
    const { user, loading, authChecked } = useAuth();

    // Show loading spinner only if auth hasn't been checked yet
    if (!authChecked) {
        return <LoadingSpinner />;
    }

    // If user is authenticated, redirect to home
    if (user) {
        return <Navigate to="/" replace />;
    }

    // If not authenticated, show the login/register form
    return children;
};

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <ChatProvider>
                    <Box minH="100vh" display="flex" flexDirection="column">
                        <Navbar />
                        <Box as="main" flex={1} py={8}>
                            <Routes>
                                {/* Auth Routes (only for non-authenticated users) */}
                                <Route
                                    path="/login"
                                    element={
                                        <PublicRoute>
                                            <LoginForm />
                                        </PublicRoute>
                                    }
                                />
                                <Route
                                    path="/register"
                                    element={
                                        <PublicRoute>
                                            <RegisterForm />
                                        </PublicRoute>
                                    }
                                />

                                {/* Protected Routes (only for authenticated users) */}
                                <Route
                                    path="/"
                                    element={
                                        <PrivateRoute>
                                            <Home />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/alumni"
                                    element={
                                        <PrivateRoute>
                                            <AlumniDirectoryPage />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/alumni/:id"
                                    element={
                                        <PrivateRoute>
                                            <AlumniProfilePage />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/profile"
                                    element={
                                        <PrivateRoute>
                                            <ProfilePage />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/messages"
                                    element={
                                        <PrivateRoute>
                                            <MessagesList />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/chat/:chatId"
                                    element={
                                        <PrivateRoute>
                                            <ChatPage />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path='/events/create'
                                    element={
                                        <PrivateRoute>
                                            <PostForm/>
                                        </PrivateRoute>
                                    }
                                />
                                
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Box>
                    </Box>
                </ChatProvider>
            </AuthProvider>
        </Router>
    );
};

export default App;