// services/postService.js
const API_BASE_URL =  'http://localhost:5000/api';

class PostService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Get auth token from localStorage or sessionStorage
    getAuthToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    }

    // Create request headers
    getHeaders(includeAuth = false) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const token = this.getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    // Handle API responses
    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    // Fetch all posts
    async getPosts() {
        try {
            const response = await fetch(`${this.baseURL}/posts`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching posts:', error);
            throw error;
        }
    }

    // Fetch posts by type (event or job)
    async getPostsByType(type) {
        try {
            const response = await fetch(`${this.baseURL}/posts/type/${type}`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error(`Error fetching ${type} posts:`, error);
            throw error;
        }
    }

    // Get post by ID
    async getPostById(id) {
        try {
            const response = await fetch(`${this.baseURL}/posts/${id}`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching post:', error);
            throw error;
        }
    }

    // Get posts by user ID
    async getUserPosts(userId) {
        try {
            const response = await fetch(`${this.baseURL}/posts/user/${userId}`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching user posts:', error);
            throw error;
        }
    }

    // Create new post
    async createPost(postData) {
        try {
            const response = await fetch(`${this.baseURL}/posts`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify(postData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    }

    // Update post
    async updatePost(id, postData) {
        try {
            const response = await fetch(`${this.baseURL}/posts/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(true),
                body: JSON.stringify(postData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error updating post:', error);
            throw error;
        }
    }

    // Delete post
    async deletePost(id) {
        try {
            const response = await fetch(`${this.baseURL}/posts/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders(true)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    }

    // Search posts
    async searchPosts(query, type = null) {
        try {
            let url = `${this.baseURL}/posts`;
            if (type) {
                url = `${this.baseURL}/posts/type/${type}`;
            }
            
            const response = await fetch(url, {
                headers: this.getHeaders()
            });
            const posts = await this.handleResponse(response);
            
            // Client-side filtering for search
            if (query) {
                const searchTerm = query.toLowerCase();
                return posts.filter(post => 
                    post.title?.toLowerCase().includes(searchTerm) ||
                    post.description?.toLowerCase().includes(searchTerm) ||
                    post.location?.toLowerCase().includes(searchTerm) ||
                    post.company?.toLowerCase().includes(searchTerm)
                );
            }
            
            return posts;
        } catch (error) {
            console.error('Error searching posts:', error);
            throw error;
        }
    }
}

export default new PostService();