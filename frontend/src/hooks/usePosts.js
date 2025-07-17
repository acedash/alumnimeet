// hooks/usePosts.js
import { useState, useEffect, useCallback } from 'react';
import postService from '../services/postService';

export const usePosts = (type = null, userId = null) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch posts based on type and userId
    const fetchPosts = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            let data;
            
            if (userId) {
                data = await postService.getUserPosts(userId);
            } else if (type) {
                data = await postService.getPostsByType(type);
            } else {
                data = await postService.getPosts();
            }
            
            setPosts(data);
        } catch (err) {
            setError(err.message);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    }, [type, userId, refreshTrigger]);

    // Refresh posts
    const refreshPosts = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    // Create new post
    const createPost = useCallback(async (postData) => {
        try {
            const newPost = await postService.createPost(postData);
            setPosts(prev => [newPost, ...prev]);
            return newPost;
        } catch (err) {
            throw err;
        }
    }, []);

    // Update existing post
    const updatePost = useCallback(async (id, postData) => {
        try {
            const updatedPost = await postService.updatePost(id, postData);
            setPosts(prev => prev.map(post => 
                post._id === id ? updatedPost : post
            ));
            return updatedPost;
        } catch (err) {
            throw err;
        }
    }, []);

    // Delete post
    const deletePost = useCallback(async (id) => {
        try {
            await postService.deletePost(id);
            setPosts(prev => prev.filter(post => post._id !== id));
            return true;
        } catch (err) {
            throw err;
        }
    }, []);

    // Search posts
    const searchPosts = useCallback(async (query) => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await postService.searchPosts(query, type);
            setPosts(data);
        } catch (err) {
            setError(err.message);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    }, [type]);

    // Effect to fetch posts on mount and when dependencies change
    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    return {
        posts,
        loading,
        error,
        refreshPosts,
        createPost,
        updatePost,
        deletePost,
        searchPosts,
        fetchPosts
    };
};

// Hook specifically for events
export const useEvents = (userId = null) => {
    return usePosts('event', userId);
};

// Hook specifically for jobs
export const useJobs = (userId = null) => {
    return usePosts('job', userId);
};

// Hook for a single post
export const usePost = (id) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPost = useCallback(async () => {
        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const data = await postService.getPostById(id);
            setPost(data);
        } catch (err) {
            setError(err.message);
            setPost(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const updatePost = useCallback(async (postData) => {
        try {
            const updatedPost = await postService.updatePost(id, postData);
            setPost(updatedPost);
            return updatedPost;
        } catch (err) {
            throw err;
        }
    }, [id]);

    const deletePost = useCallback(async () => {
        try {
            await postService.deletePost(id);
            setPost(null);
            return true;
        } catch (err) {
            throw err;
        }
    }, [id]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    return {
        post,
        loading,
        error,
        updatePost,
        deletePost,
        refetch: fetchPost
    };
};