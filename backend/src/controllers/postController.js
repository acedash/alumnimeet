import Post from '../models/Post.js';
import User from '../models/User.js';

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { type, content, eventDetails, jobDetails, attachments } = req.body;
    const authorId = req.user.id;

    // Validate required fields based on post type
    if (type === 'event') {
      if (!eventDetails?.title || !eventDetails?.date || !eventDetails?.location) {
        return res.status(400).json({
          success: false,
          message: 'Event posts require title, date, and location'
        });
      }
    }

    if (type === 'job') {
      if (!jobDetails?.company || !jobDetails?.position) {
        return res.status(400).json({
          success: false,
          message: 'Job posts require company and position'
        });
      }
    }

    const postData = {
      author: authorId,
      type,
      content,
      attachments: attachments || []
    };

    if (type === 'event') {
      postData.eventDetails = eventDetails;
    }

    if (type === 'job') {
      postData.jobDetails = jobDetails;
    }

    const post = new Post(postData);
    await post.save();

    // Populate author information
    await post.populate('author', 'name email department userType profilePicture');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all posts with pagination and filtering
export const getPosts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      authorId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (type) {
      filter.type = type;
    }
    
    if (authorId) {
      filter.author = authorId;
    }

    if (search) {
      filter.$or = [
        { content: { $regex: search, $options: 'i' } },
        { 'eventDetails.title': { $regex: search, $options: 'i' } },
        { 'jobDetails.company': { $regex: search, $options: 'i' } },
        { 'jobDetails.position': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const posts = await Post.find(filter)
      .populate('author', 'name email department userType profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPosts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get a single post by ID
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate('author', 'name email department userType profilePicture');

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update a post
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, content, eventDetails, jobDetails, attachments } = req.body;
    const userId = req.user.id;

    const post = await Post.findById(id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the author
    if (post.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own posts'
      });
    }

    // Validate required fields based on post type
    if (type === 'event') {
      if (!eventDetails?.title || !eventDetails?.date || !eventDetails?.location) {
        return res.status(400).json({
          success: false,
          message: 'Event posts require title, date, and location'
        });
      }
    }

    if (type === 'job') {
      if (!jobDetails?.company || !jobDetails?.position) {
        return res.status(400).json({
          success: false,
          message: 'Job posts require company and position'
        });
      }
    }

    // Update fields
    post.type = type || post.type;
    post.content = content || post.content;
    post.attachments = attachments || post.attachments;

    if (type === 'event') {
      post.eventDetails = eventDetails;
    } else {
      post.eventDetails = undefined;
    }

    if (type === 'job') {
      post.jobDetails = jobDetails;
    } else {
      post.jobDetails = undefined;
    }

    await post.save();
    await post.populate('author', 'name email department userType profilePicture');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: post
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete a post (soft delete)
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the author
    if (post.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get posts by specific user
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, type } = req.query;

    const skip = (page - 1) * limit;
    
    const filter = { 
      author: userId, 
      isActive: true 
    };
    
    if (type) {
      filter.type = type;
    }

    const posts = await Post.find(filter)
      .populate('author', 'name email department userType profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPosts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get posts by type with additional filtering
export const getPostsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10, upcoming, company, jobType } = req.query;

    const skip = (page - 1) * limit;
    
    const filter = { 
      type,
      isActive: true 
    };

    // Additional filters for event posts
    if (type === 'event' && upcoming === 'true') {
      filter['eventDetails.date'] = { $gte: new Date() };
    }

    // Additional filters for job posts
    if (type === 'job') {
      if (company) {
        filter['jobDetails.company'] = { $regex: company, $options: 'i' };
      }
      if (jobType) {
        filter['jobDetails.jobType'] = jobType;
      }
    }

    const posts = await Post.find(filter)
      .populate('author', 'name email department userType profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPosts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching posts by type:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};