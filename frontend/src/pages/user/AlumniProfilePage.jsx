import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { alumniService } from '../../services/api';
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
  FiCalendar
} from 'react-icons/fi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import './AlumniProfilePage.css';

const AlumniProfilePage = () => {
  const { id } = useParams();
  const [alumni, setAlumni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!alumni) return <div className="not-found">Alumni not found</div>;

  return (
    <div className="alumni-profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        {/* <div className="profile-banner"></div> */}
        <div className="avatar-container">
          <img 
            src={alumni.profilePicture || 'https://bit.ly/dan-abramov'} 
            alt={alumni.name}
            className="profile-avatar"
          />
          <h1>{alumni.name}</h1>
        </div>
        <div className="header-info">
    
          <div className="batch-info">
            <span className="batch-year">
              <FiCalendar className="icon" /> Batch of {alumni.graduationYear}
            </span>
            {alumni.isAvailableForMentorship && (
              <span className="mentor-badge">
                <FiUser className="icon" /> Available for Mentorship
              </span>
            )}
          </div>
          {alumni.currentJob && (
            <div className="current-job">
              <FiBriefcase className="icon" /> {alumni.currentJob}
            </div>
          )}
          {alumni.location && (
            <div className="location">
              <FiMapPin className="icon" /> {alumni.location}
            </div>
          )}
        </div>
        <div className="action-buttons">
          <Link to={`/chat/${alumni._id}`} className="btn chat-btn">
            <FiMessageCircle className="icon" /> Message
          </Link>
          <Link to={`/connect/${alumni._id}`} className="btn connect-btn">
            <FiMail className="icon" /> Connect
          </Link>
        </div>
      </div>

      <div className="profile-content">
        <div className="main-section">
          {/* About Section */}
          {alumni.bio && (
            <div className="section-card bio-section">
              <h2>About</h2>
              <p>{alumni.bio}</p>
            </div>
          )}

          {/* Experience Section */}
          {(alumni.experiences?.length > 0) && (
            <div className="section-card experience-section">
              <h2>Experience</h2>
              {alumni.experiences.map((exp, index) => (
                <div key={index} className="experience-item">
                  <h3>{exp.role}</h3>
                  <div className="company">{exp.company}</div>
                  <div className="duration">
                    {exp.startYear} - {exp.endYear || 'Present'}
                  </div>
                  {exp.description && (
                    <p className="description">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education Section */}
          {(alumni.education?.length > 0) && (
            <div className="section-card education-section">
              <h2>Education</h2>
              {alumni.education.map((edu, index) => (
                <div key={index} className="education-item">
                  <h3>{edu.institution}</h3>
                  <div className="degree">
                    {edu.degree} in {edu.fieldOfStudy}
                  </div>
                  <div className="duration">
                    {edu.startYear} - {edu.endYear}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alumni Feed Section */}
          <div className="feed-section">
            <h2>Recent Activity</h2>
            {(alumni.posts?.length > 0 ? alumni.posts : [
              {
                id: '1',
                title: 'Hiring Frontend Developer at TechCorp',
                content: 'My team at TechCorp is looking for a skilled React developer to join us remotely. Competitive salary and great benefits. DM me if interested!',
                date: '2025-06-08',
                type: 'job',
              },
              {
                id: '2',
                title: 'Tech Meetup at NIT Srinagar',
                content: 'I\'ll be speaking at the annual tech meetup this Saturday about "The Future of Web Development". Would love to connect with fellow alumni there!',
                date: '2025-06-05',
                type: 'event',
              },
              {
                id: '3',
                title: 'Just published a new article',
                content: 'Check out my latest article on Medium about state management in large React applications. Would appreciate your thoughts and feedback!',
                date: '2025-05-28',
                type: 'post',
              }
            ]).map((post) => (
              <div key={post.id} className={`feed-card ${post.type}`}>
                <div className="feed-header">
                  <h3>{post.title}</h3>
                  <span className="feed-date">{new Date(post.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <p className="feed-content">{post.content}</p>
                <span className="feed-tag">
                  {post.type === 'job' ? 'Job Opportunity' : 
                   post.type === 'event' ? 'Event' : 'Article'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          {/* Skills Section */}
          {alumni.skills?.length > 0 && (
            <div className="section-card skills-section">
              <h2>Skills & Expertise</h2>
              <div className="skills-list">
                {alumni.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Achievements Section */}
          {alumni.achievements?.length > 0 && (
            <div className="section-card achievements-section">
              <h2>Achievements</h2>
              <ul className="achievements-list">
                {alumni.achievements.map((ach, index) => (
                  <li key={index}>
                    <FiAward className="icon" />
                    <div>
                      <h3>{ach.title}</h3>
                      <div className="year">{ach.year}</div>
                      {ach.description && <p>{ach.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Social Links Section */}
          {(alumni.socialLinks?.linkedin || alumni.socialLinks?.twitter || alumni.socialLinks?.personalWebsite) && (
            <div className="section-card social-section">
              <h2>Connect</h2>
              <div className="social-links">
                {alumni.socialLinks.linkedin && (
                  <a href={alumni.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                    <FiLinkedin className="icon" /> LinkedIn
                  </a>
                )}
                {alumni.socialLinks.twitter && (
                  <a href={alumni.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                    <FiTwitter className="icon" /> Twitter
                  </a>
                )}
                {alumni.socialLinks.personalWebsite && (
                  <a href={alumni.socialLinks.personalWebsite} target="_blank" rel="noopener noreferrer">
                    <FiGlobe className="icon" /> Personal Website
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlumniProfilePage;