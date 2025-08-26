import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { alumniService, postsService } from '../../services/api';
import { 
  FiBriefcase, 
  FiUser, 
  FiMapPin, 
  FiMessageCircle,
  FiMail,
  FiAward,
  FiGlobe,
  FiLinkedin,
  FiTwitter,
  FiCalendar,
  FiEdit,
  FiExternalLink
} from 'react-icons/fi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ChatModal from '../../components/chat/ChatModal';
import './AlumniProfilePage.css';

const AlumniProfilePage = () => {
  const { id } = useParams();
  const [alumni, setAlumni] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postsError, setPostsError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchAlumniProfile = async () => {
      try {
        setLoading(true);
        const response = await alumniService.getAlumniById(id);
        setAlumni(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlumniProfile();
  }, [id]);

  // Fetch posts for this alumni
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!id) return;
      
      try {
        setPostsLoading(true);
        setPostsError(null);
        const response = await postsService.getUserPosts(id, { limit: 10 });
        setPosts(response.data.posts || []);
      } catch (err) {
        console.error('Error fetching user posts:', err);
        setPostsError(err.message);
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchUserPosts();
  }, [id]);

  // Get current user info for chat
  useEffect(() => {
    const getCurrentUser = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return {
            _id: payload.id || payload.userId,
            name: payload.name,
            email: payload.email
          };
        } catch (e) {
          return null;
        }
      }
      return null;
    };

    setCurrentUser(getCurrentUser());
  }, []);

  const handleOpenChat = () => {
    if (!currentUser) {
      // Handle case where user is not logged in
      alert('Please log in to start a conversation');
      return;
    }
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  // Helper function to format post data for display
  const formatPostForDisplay = (post) => {
    const basePost = {
      id: post._id,
      title: post.type === 'event' ? post.eventDetails?.title : 
             post.type === 'job' ? `${post.jobDetails?.position} at ${post.jobDetails?.company}` :
             'Post',
      content: post.content,
      date: post.createdAt,
      type: post.type
    };

    if (post.type === 'event') {
      return {
        ...basePost,
        title: post.eventDetails?.title || 'Event',
        eventDate: post.eventDetails?.date,
        location: post.eventDetails?.location,
        registrationLink: post.eventDetails?.registrationLink
      };
    }

    if (post.type === 'job') {
      return {
        ...basePost,
        title: `${post.jobDetails?.position} at ${post.jobDetails?.company}`,
        company: post.jobDetails?.company,
        position: post.jobDetails?.position,
        applyBy: post.jobDetails?.applyBy,
        applicationLink: post.jobDetails?.applicationLink,
        salary: post.jobDetails?.salary,
        jobType: post.jobDetails?.jobType
      };
    }

    return basePost;
  };

  // Helper function to get post type label
  const getPostTypeLabel = (type) => {
    switch (type) {
      case 'job': return 'Job Opportunity';
      case 'event': return 'Event';
      default: return 'Post';
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!alumni) return <div className="not-found">Alumni not found</div>;

  return (
    <div className="alumni-profile-container">
      {/* Profile Header */}
      <div className="alumni-profile-header">
        <div className="alumni-avatar-wrapper">
          <img 
            src={alumni.profilePicture || 'https://bit.ly/dan-abramov'} 
            alt={alumni.name}
            className="alumni-profile-avatar"
          />
          <div className="alumni-avatar-overlay">
            <FiEdit className="alumni-edit-icon" />
          </div>
        </div>
        
        <div className="alumni-profile-info">
          <h1 className="alumni-profile-name">{alumni.name}</h1>
          <div className="alumni-profile-badge">
            <span className="alumni-batch-year">
              <FiCalendar className="alumni-icon" /> Batch of {alumni.graduationYear}
            </span>
            {alumni.isAvailableForMentorship && (
              <span className="alumni-mentor-badge">
                <FiUser className="alumni-icon" /> Available for Mentorship
              </span>
            )}
          </div>
          
          <div className="alumni-profile-details">
            {alumni.currentJob && (
              <div className="alumni-detail-item">
                <FiBriefcase className="alumni-icon" /> 
                <span>{alumni.currentJob}</span>
              </div>
            )}
            {alumni.location && (
              <div className="alumni-detail-item">
                <FiMapPin className="alumni-icon" /> 
                <span>{alumni.location}</span>
              </div>
            )}
            {alumni.department && (
              <div className="alumni-detail-item">
                <FiUser className="alumni-icon" /> 
                <span>{alumni.department}</span>
              </div>
            )}
          </div>
        </div>

        <div className="alumni-action-buttons">
          <button 
            className="alumni-btn alumni-btn-primary"
            onClick={handleOpenChat}
          >
            <FiMessageCircle className="alumni-icon" /> 
            Start Conversation
          </button>
          
          {alumni.socialLinks?.linkedin && (
            <a 
              href={alumni.socialLinks.linkedin} 
              target="_blank" rel="noopener noreferrer"
              className="alumni-btn alumni-btn-secondary"
            >
              <FiLinkedin className="alumni-icon" /> 
              Connect on LinkedIn
            </a>
          )}
        </div>
      </div>

      <div className="alumni-profile-content">
        <div className="alumni-main-section">
          {/* About Section */}
          {alumni.bio && (
            <div className="alumni-section-card">
              <h2 className="alumni-section-title">About</h2>
              <p className="alumni-bio-text">{alumni.bio}</p>
            </div>
          )}

          {/* Experience Section */}
          {(alumni.experiences?.length > 0) && (
            <div className="alumni-section-card">
              <h2 className="alumni-section-title">Professional Experience</h2>
              <div className="alumni-experience-grid">
                {alumni.experiences.map((exp, index) => (
                  <div key={index} className="alumni-experience-item">
                    <div className="alumni-experience-header">
                      <h3 className="alumni-experience-role">{exp.role}</h3>
                      <span className="alumni-experience-company">{exp.company}</span>
                    </div>
                    <div className="alumni-experience-duration">
                      {exp.startYear} - {exp.endYear || 'Present'}
                    </div>
                    {exp.description && (
                      <p className="alumni-experience-description">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Section */}
          {(alumni.education?.length > 0) && (
            <div className="alumni-section-card">
              <h2 className="alumni-section-title">Education</h2>
              <div className="alumni-education-grid">
                {alumni.education.map((edu, index) => (
                  <div key={index} className="alumni-education-item">
                    <h3 className="alumni-education-institution">{edu.institution}</h3>
                    <div className="alumni-education-degree">
                      {edu.degree} in {edu.fieldOfStudy}
                    </div>
                    <div className="alumni-education-duration">
                      {edu.startYear} - {edu.endYear}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity Section */}
          <div className="alumni-section-card">
            <h2 className="alumni-section-title">Recent Activity</h2>
            <div className="alumni-activity-grid">
              {postsLoading ? (
                <div className="alumni-loading-posts">
                  <p>Loading posts...</p>
                </div>
              ) : postsError ? (
                <div className="alumni-posts-error">
                  <p>Error loading posts: {postsError}</p>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => {
                  const formattedPost = formatPostForDisplay(post);
                  return (
                    <div key={formattedPost.id} className={`alumni-activity-card ${formattedPost.type}`}>
                      <div className="alumni-activity-header">
                        <h3 className="alumni-activity-title">{formattedPost.title}</h3>
                        <span className="alumni-activity-date">
                          {new Date(formattedPost.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <p className="alumni-activity-content">{formattedPost.content}</p>
                      
                      {/* Additional details based on post type */}
                      {formattedPost.type === 'event' && formattedPost.eventDate && (
                        <div className="alumni-event-details">
                          <p><strong>Event Date:</strong> {new Date(formattedPost.eventDate).toLocaleDateString()}</p>
                          {formattedPost.location && <p><strong>Location:</strong> {formattedPost.location}</p>}
                          {formattedPost.registrationLink && (
                            <a 
                              href={formattedPost.registrationLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="alumni-post-link"
                            >
                              <FiExternalLink className="alumni-icon" />
                              Register for Event
                            </a>
                          )}
                        </div>
                      )}
                      
                      {formattedPost.type === 'job' && (
                        <div className="alumni-job-details">
                          {formattedPost.salary && <p><strong>Salary:</strong> {formattedPost.salary}</p>}
                          {formattedPost.jobType && <p><strong>Type:</strong> {formattedPost.jobType}</p>}
                          {formattedPost.applyBy && <p><strong>Apply By:</strong> {new Date(formattedPost.applyBy).toLocaleDateString()}</p>}
                          {formattedPost.applicationLink && (
                            <a 
                              href={formattedPost.applicationLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="alumni-post-link"
                            >
                              <FiExternalLink className="alumni-icon" />
                              Apply Now
                            </a>
                          )}
                        </div>
                      )}
                      
                      <span className="alumni-activity-tag">
                        {getPostTypeLabel(formattedPost.type)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="alumni-no-posts">
                  <p>No posts yet. Check back later for updates!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="alumni-sidebar-section">
          {/* Skills Section */}
          {alumni.skills?.length > 0 && (
            <div className="alumni-section-card">
              <h2 className="alumni-section-title">Skills & Expertise</h2>
              <div className="alumni-skills-grid">
                {alumni.skills.map((skill, index) => (
                  <span key={index} className="alumni-skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Achievements Section */}
          {alumni.achievements?.length > 0 && (
            <div className="alumni-section-card">
              <h2 className="alumni-section-title">Achievements & Awards</h2>
              <div className="alumni-achievements-list">
                {alumni.achievements.map((ach, index) => (
                  <div key={index} className="alumni-achievement-item">
                    <FiAward className="alumni-achievement-icon" />
                    <div className="alumni-achievement-content">
                      <h3 className="alumni-achievement-title">{ach.title}</h3>
                      <div className="alumni-achievement-year">{ach.year}</div>
                      {ach.description && <p className="alumni-achievement-description">{ach.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Links Section */}
          {(alumni.socialLinks?.linkedin || alumni.socialLinks?.twitter || alumni.socialLinks?.personalWebsite) && (
            <div className="alumni-section-card">
              <h2 className="alumni-section-title">Connect & Follow</h2>
              <div className="alumni-social-links">
                {alumni.socialLinks.linkedin && (
                  <a href={alumni.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="alumni-social-link">
                    <FiLinkedin className="alumni-icon" /> LinkedIn
                  </a>
                )}
                {alumni.socialLinks.twitter && (
                  <a href={alumni.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="alumni-social-link">
                    <FiTwitter className="alumni-icon" /> Twitter
                  </a>
                )}
                {alumni.socialLinks.personalWebsite && (
                  <a href={alumni.socialLinks.personalWebsite} target="_blank" rel="noopener noreferrer" className="alumni-social-link">
                    <FiGlobe className="alumni-icon" /> Personal Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Contact Section */}
          <div className="alumni-section-card">
            <h2 className="alumni-section-title">Get in Touch</h2>
            <div className="alumni-contact-options">
              <button 
                className="alumni-contact-btn alumni-contact-btn-primary"
                onClick={handleOpenChat}
              >
                <FiMessageCircle className="alumni-icon" />
                Send Message
              </button>
              
              {alumni.email && (
                <a 
                  href={`mailto:${alumni.email}`}
                  className="alumni-contact-btn alumni-contact-btn-secondary"
                >
                  <FiMail className="alumni-icon" />
                  Send Email
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal 
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        user={alumni}
      />
    </div>
  );
};

export default AlumniProfilePage;