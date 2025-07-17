import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for protected endpoints
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    
    const unprotectedEndpoints = [
        '/users/login',
        '/users/register/student', 
        '/users/register/alumni'
    ];
    
    if (token && !unprotectedEndpoints.some(endpoint => config.url?.includes(endpoint))) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            return Promise.reject(new Error('Session expired. Please login again.'));
        }
        return Promise.reject(error);
    }
);

// Auth-related endpoints
export const authService = {
    uploadVerificationDocument: async (file) => {
        const formData = new FormData();
        formData.append('document', file);
        
        const response = await api.post('/upload/verification', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    registerStudent: async (formData) => {
        const response = await api.post('/users/register/student', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    registerAlumni: async (formData) => {
        const response = await api.post('/users/register/alumni', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    loginUser: async (credentials) => {
        const response = await api.post('/users/login', credentials);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },
};

// Profile-related endpoints
export const profileService = {
    getProfile: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },

    updateProfile: async (profileData) => {
        const response = await api.put('/users/profile', profileData);
        return response.data;
    },

    updateProfilePicture: async (file) => {
        const formData = new FormData();
        formData.append('profilePicture', file);
        
        const response = await api.put('/users/profile/picture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

// Alumni-related endpoints
export const alumniService = {
    getAllAlumni: async (filters = {}) => {
        const response = await api.get('/alumni', { params: filters });
        return response.data;
    },

    getAlumniFilters: async () => {
        const response = await api.get('/alumni/filters');
        return response.data;
    },

    getAlumniById: async (id) => {
        const response = await api.get(`/alumni/${id}`);
        return response.data;
    },

    searchAlumni: async (query) => {
        const response = await api.get('/alumni/search', { params: { q: query } });
        return response.data;
    },
};

// Connection-related endpoints
// export const connectionService = {
//     sendConnectionRequest: async (alumniId) => {
//         const response = await api.post(`/connections/request/${alumniId}`);
//         return response.data;
//     },

//     acceptConnection: async (requestId) => {
//         const response = await api.put(`/connections/accept/${requestId}`);
//         return response.data;
//     },

//     rejectConnection: async (requestId) => {
//         const response = await api.put(`/connections/reject/${requestId}`);
//         return response.data;
//     },

//     getConnections: async () => {
//         const response = await api.get('/connections');
//         return response.data;
//     },

//     getPendingRequests: async () => {
//         const response = await api.get('/connections/pending');
//         return response.data;
//     },
// };

// Chat-related endpoints
// export const chatService = {
//     getConversations: async () => {
//         const response = await api.get('/chats');
//         return response.data;
//     },

//     getMessages: async (chatId) => {
//         const response = await api.get(`/chats/${chatId}/messages`);
//         return response.data;
//     },

//     sendMessage: async (chatId, message) => {
//         const response = await api.post(`/chats/${chatId}/messages`, { content: message });
//         return response.data;
//     },

//     startNewChat: async (userId) => {
//         const response = await api.post('/chats/start', { participantId: userId });
//         return response.data;
//     },
// };

export default api;