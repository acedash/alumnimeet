import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

// Icons (using emoji as fallback - consider using react-icons for better icons)
const SearchIcon = () => <span>🔍</span>;
const CalendarIcon = () => <span>📅</span>;
const BriefcaseIcon = () => <span>💼</span>;

// API service functions
const postService = {
    // Base API URL - adjust according to your backend URL
    baseURL: 'http://localhost:5000/api',
    
    // Get auth token
    getAuthToken: () => {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    },
    
    // Fetch all posts
    async getPosts() {
        try {
            const response = await fetch(`${this.baseURL}/posts`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch posts: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            
            // Handle different response formats
            // Check if response has nested structure
            if (data.data && data.data.posts) {
                return data.data.posts;
            }
            // Check if response has posts property directly
            if (data.posts) {
                return data.posts;
            }
            // If data is already an array
            if (Array.isArray(data)) {
                return data;
            }
            
            // Fallback to empty array
            console.warn('Unexpected API response format:', data);
            return [];
        } catch (error) {
            console.error('Error fetching posts:', error);
            throw error;
        }
    },
    
    // Fetch posts by type (event or job)
    async getPostsByType(type) {
        try {
            const response = await fetch(`${this.baseURL}/posts?type=${type}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch ${type} posts: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            
            // Handle different response formats
            if (data.data && data.data.posts) {
                return data.data.posts;
            }
            if (data.posts) {
                return data.posts;
            }
            if (Array.isArray(data)) {
                return data;
            }
            
            console.warn('Unexpected API response format:', data);
            return [];
        } catch (error) {
            console.error(`Error fetching ${type} posts:`, error);
            throw error;
        }
    },
    
    // Create new post
    async createPost(postData) {
        try {
            const token = this.getAuthToken();
            const response = await fetch(`${this.baseURL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(postData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create post: ${response.status} ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    },
    
    // Get post by ID
    async getPostById(id) {
        try {
            const response = await fetch(`${this.baseURL}/posts/${id}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch post: ${response.status} ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching post:', error);
            throw error;
        }
    },
    
    // Update post
    async updatePost(id, postData) {
        try {
            const token = this.getAuthToken();
            const response = await fetch(`${this.baseURL}/posts/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(postData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update post: ${response.status} ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating post:', error);
            throw error;
        }
    },
    
    // Delete post
    async deletePost(id) {
        try {
            const token = this.getAuthToken();
            const response = await fetch(`${this.baseURL}/posts/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete post: ${response.status} ${errorText}`);
            }
            return true;
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    }
};

const Home = () => {
    const { user } = useAuth();
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [jobOpenings, setJobOpenings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);

    // Fetch posts on component mount
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch all posts
                const allPosts = await postService.getPosts();
                console.log('Fetched posts:', allPosts); // Debug log
                
                // Ensure allPosts is an array
                if (!Array.isArray(allPosts)) {
                    console.error('Posts data is not an array:', allPosts);
                    throw new Error('Invalid posts data format');
                }
                
                // Filter posts by type
                const events = allPosts.filter(post => post.type === 'event');
                const jobs = allPosts.filter(post => post.type === 'job');
                
                console.log('Events:', events); // Debug log
                console.log('Jobs:', jobs); // Debug log
                
                setUpcomingEvents(events);
                setJobOpenings(jobs);
                setFilteredEvents(events);
                setFilteredJobs(jobs);
            } catch (error) {
                console.error('Error fetching posts:', error);
                setError('Failed to load posts. Please try again later.');
                // Fallback to empty arrays if API fails
                setUpcomingEvents([]);
                setJobOpenings([]);
                setFilteredEvents([]);
                setFilteredJobs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    // Handle search functionality
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredEvents(upcomingEvents);
            setFilteredJobs(jobOpenings);
            return;
        }

        const query = searchQuery.toLowerCase();
        
        // Filter events - using schema-correct field names
        const filteredEventsData = upcomingEvents.filter(event =>
            event.eventDetails?.title?.toLowerCase().includes(query) ||
            event.content?.toLowerCase().includes(query) ||
            event.eventDetails?.location?.toLowerCase().includes(query)
        );
        
        // Filter jobs - using schema-correct field names
        const filteredJobsData = jobOpenings.filter(job =>
            job.jobDetails?.position?.toLowerCase().includes(query) ||
            job.content?.toLowerCase().includes(query) ||
            job.jobDetails?.company?.toLowerCase().includes(query)
        );
        
        setFilteredEvents(filteredEventsData);
        setFilteredJobs(filteredJobsData);
    }, [searchQuery, upcomingEvents, jobOpenings]);

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return 'Date TBD';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Date TBD';
        }
    };

    // Format time helper
    const formatTime = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    };

    return (
        <div className="home-container">
            {/* Hero Section */}
            <div className="hero-section">
                <h1 className="hero-title">Alumni Connect Platform</h1>
                <p className="hero-subtitle">
                    Bridging students with alumni for opportunities, mentorship, and networking
                </p>
                
                {!user && (
                    <div className="hero-buttons">
                        <Link to="/register" className="hero-button primary">
                            Join Now
                        </Link>
                        <Link to="/login" className="hero-button secondary">
                            Sign In
                        </Link>
                    </div>
                )}
            </div>

            {/* Search Bar */}
            <div className="search-bar-container">
                <div className="search-bar">
                    <div className="search-icon">
                        <SearchIcon />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search events, opportunities, or alumni..." 
                        className="search-input"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* Main Content */}
            <div className="main-content">
                <div className="primary-content">
                    {/* Events Section */}
                    <div className="section">
                        <div className="section-header">
                            <h2 className="section-title">
                                <CalendarIcon className="section-icon" /> Upcoming Events
                            </h2>
                            {user && (
                                <Link to="/events/create" className="create-button">
                                    Create Event
                                </Link>
                            )}
                        </div>

                        {loading ? (
                            <div className="loading">Loading events...</div>
                        ) : (
                            <div className="events-grid">
                                {filteredEvents.length > 0 ? (
                                    filteredEvents.map(event => (
                                        <div key={event._id} className="card event-card">
                                            <div className="card-header">
                                                <div className="card-title-container">
                                                    <h3 className="card-title">
                                                        {event.eventDetails?.title || 'Untitled Event'}
                                                    </h3>
                                                    <span className="event-tag online">
                                                        Event
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                <p className="event-date">
                                                    {formatDate(event.eventDetails?.date)}
                                                    {event.eventDetails?.date && (
                                                        <span className="event-time">
                                                            {' at ' + formatTime(event.eventDetails.date)}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="event-location">
                                                    📍 {event.eventDetails?.location || 'Location TBD'}
                                                </p>
                                                {event.content && (
                                                    <p className="event-description">
                                                        {event.content.length > 100 
                                                            ? `${event.content.substring(0, 100)}...` 
                                                            : event.content
                                                        }
                                                    </p>
                                                )}
                                                {event.eventDetails?.registrationLink && (
                                                    <p className="registration-link">
                                                        <a 
                                                            href={event.eventDetails.registrationLink} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="link"
                                                        >
                                                            Registration Link
                                                        </a>
                                                    </p>
                                                )}
                                                <div className="event-organizer">
                                                    <img 
                                                        src={event.author?.avatar || event.author?.profilePicture || 'https://bit.ly/dan-abramov'} 
                                                        alt={event.author?.name || 'Anonymous'}
                                                        className="avatar small"
                                                        onError={(e) => {
                                                            e.target.src = 'https://bit.ly/dan-abramov';
                                                        }}
                                                    />
                                                    <span className="organizer-info">
                                                        Posted by {event.author?.name || 'Anonymous'} 
                                                        {event.author?.graduationYear && ` (${event.author.graduationYear})`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="card-footer">
                                                <Link to={`/events/${event._id}`} className="card-button">
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-content">
                                        {searchQuery ? 'No events match your search.' : 'No events available.'}
                                        {!searchQuery && user && (
                                            <p>
                                                <Link to="/events/create" className="create-link">
                                                    Create the first event
                                                </Link>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Opportunities Section */}
                    <div className="section">
                        <div className="section-header">
                            <h2 className="section-title">
                                <BriefcaseIcon className="section-icon" /> Job Openings
                            </h2>
                            {user && (
                                <Link to="/jobs/create" className="create-button">
                                    Post Opportunity
                                </Link>
                            )}
                        </div>

                        {loading ? (
                            <div className="loading">Loading job openings...</div>
                        ) : (
                            <div className="jobs-grid">
                                {filteredJobs.length > 0 ? (
                                    filteredJobs.map(job => (
                                        <div key={job._id} className="card job-card">
                                            <div className="card-header">
                                                <h3 className="card-title">
                                                    {job.jobDetails?.position || 'Untitled Position'}
                                                </h3>
                                                <span className="job-type-badge">
                                                    {job.jobDetails?.jobType || 'Job'}
                                                </span>
                                            </div>
                                            <div className="card-body">
                                                <p className="company-name">
                                                    🏢 {job.jobDetails?.company || 'Company TBD'}
                                                </p>
                                                {job.jobDetails?.salary && (
                                                    <p className="job-salary">
                                                        💰 {job.jobDetails.salary}
                                                    </p>
                                                )}
                                                {job.jobDetails?.applyBy && (
                                                    <p className="apply-deadline">
                                                        ⏰ Apply by: {formatDate(job.jobDetails.applyBy)}
                                                    </p>
                                                )}
                                                {job.content && (
                                                    <p className="job-description">
                                                        {job.content.length > 100 
                                                            ? `${job.content.substring(0, 100)}...` 
                                                            : job.content
                                                        }
                                                    </p>
                                                )}
                                                {job.jobDetails?.applicationLink && (
                                                    <p className="application-link">
                                                        <a 
                                                            href={job.jobDetails.applicationLink} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="link"
                                                        >
                                                            Application Link
                                                        </a>
                                                    </p>
                                                )}
                                                <div className="job-poster">
                                                    <img 
                                                        src={job.author?.avatar || job.author?.profilePicture || 'https://bit.ly/dan-abramov'} 
                                                        alt={job.author?.name || 'Anonymous'}
                                                        className="avatar small"
                                                        onError={(e) => {
                                                            e.target.src = 'https://bit.ly/dan-abramov';
                                                        }}
                                                    />
                                                    <span className="poster-info">
                                                        Posted by {job.author?.name || 'Anonymous'} 
                                                        {job.author?.graduationYear && ` (${job.author.graduationYear})`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="card-footer">
                                                <Link to={`/jobs/${job._id}`} className="card-button apply-button">
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-content">
                                        {searchQuery ? 'No jobs match your search.' : 'No job openings available.'}
                                        {!searchQuery && user && (
                                            <p>
                                                <Link to="/jobs/create" className="create-link">
                                                    Post the first job opportunity
                                                </Link>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="sidebar">
                    {user ? (
                        <div className="user-card">
                            <div className="user-info">
                                <img 
                                    src={user.avatar || user.profilePicture || 'https://bit.ly/dan-abramov'} 
                                    alt={user.name}
                                    className="avatar large"
                                    onError={(e) => {
                                        e.target.src = 'https://bit.ly/dan-abramov';
                                    }}
                                />
                                <div className="user-details">
                                    <p className="user-name">{user.name}</p>
                                    <p className="user-meta">
                                        {user.userType === 'alumni' ? `Batch of ${user.graduationYear}` : `Current Student`}
                                    </p>
                                </div>
                            </div>
                            <Link to="/profile" className="profile-button">
                                My Profile
                            </Link>
                            {user.userType === 'alumni' && (
                                <Link to="/network" className="connect-button">
                                    Connect with Students
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="join-card">
                            <h3 className="join-title">Join Our Network</h3>
                            <p className="join-text">Connect with alumni and students for mentorship and opportunities</p>
                            <Link to="/register" className="join-button">
                                Sign Up Now
                            </Link>
                        </div>
                    )}

                    {/* Quick Links */}
                    <div className="quick-links">
                        <h3 className="links-title">Quick Links</h3>
                        <nav className="links-nav">
                            <Link to="/events" className="nav-link">All Events</Link>
                            <Link to="/jobs" className="nav-link">Job Board</Link>
                            <Link to="/mentors" className="nav-link">Find a Mentor</Link>
                            <Link to="/resources" className="nav-link">Career Resources</Link>
                        </nav>
                    </div>

                    {/* Debug Info (remove in production) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="debug-info">
                            <h4>Debug Info:</h4>
                            <p>Events: {upcomingEvents.length}</p>
                            <p>Jobs: {jobOpenings.length}</p>
                            <p>Loading: {loading.toString()}</p>
                            <p>Error: {error || 'None'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;