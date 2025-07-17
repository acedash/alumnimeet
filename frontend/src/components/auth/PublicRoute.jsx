import { Box } from '@chakra-ui/react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Box>Loading...</Box>;
    }

    return user ? <Navigate to="/" /> : children;
};

export default PublicRoute; 