import { useState, useEffect } from 'react';
import { 
  FiEdit, FiMail, FiBriefcase, FiCalendar, FiMapPin, 
  FiGlobe, FiLinkedin, FiTwitter, FiAward, FiBook, FiUser 
} from 'react-icons/fi';
import './ProfilePage.css';

const ProfilePage = ({ userType }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch profile data from API


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5000/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(`Invalid response: ${text.substring(0, 100)}`);
        }

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch profile');
        }
        
        setProfile(data);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Invalid response: ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setIsEditing(false);
      // Optionally show success message
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    setProfile(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field, defaultValue = '') => {
    setProfile(prev => ({
      ...prev,
      [field]: [...prev[field], defaultValue]
    }));
  };

  const removeArrayItem = (field, index) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!profile) return <div className="error">No profile data found</div>;

  return (
    <div className="profile-container">
      <div className="profile-layout">
        {/* Profile Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-header">
            <div className="avatar-container">
              <img 
                src={profile.profilePicture || 'https://bit.ly/dan-abramov'} 
                alt={profile.name}
                className="profile-avatar"
              />
              {isEditing && (
                <button className="avatar-edit-button">
                  Change Photo
                </button>
              )}
            </div>
            <h2 className="profile-name">{profile.name}</h2>
            <div className={`profile-badge ${profile.userType.toLowerCase()}`}>
              {profile.userType === 'alumni' 
                ? `Alumni • Batch of ${profile.graduationYear}`
                : `Student • ${profile.currentYear} Year`}
              
              {profile.verificationStatus === 'verified' && (
                <span className="verified-badge">Verified</span>
              )}
            </div>
            
            {!isEditing && (
              <button 
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                <FiEdit className="button-icon" />
                Edit Profile
              </button>
            )}
          </div>

          <div className="divider"></div>

          <div className="profile-details">
            {profile.currentJob && (
              <div className="detail-item">
                <FiBriefcase className="detail-icon" />
                <span>{profile.currentJob}</span>
              </div>
            )}
            
            {profile.location && (
              <div className="detail-item">
                <FiMapPin className="detail-icon" />
                <span>{profile.location}</span>
              </div>
            )}
            
            <div className="detail-item">
              <FiMail className="detail-icon" />
              <span>{profile.email}</span>
            </div>
            
            {profile.department && (
              <div className="detail-item">
                <FiBook className="detail-icon" />
                <span>{profile.department}</span>
              </div>
            )}
            
            {profile.userType === 'alumni' && profile.isAvailableForMentorship && (
              <div className="mentorship-badge">
                <FiUser className="detail-icon" />
                <span>Available for Mentorship</span>
              </div>
            )}
          </div>

          {profile.socialLinks && (
            <>
              <div className="divider"></div>
              <div className="social-links">
                {profile.socialLinks.linkedin && (
                  <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                    <FiLinkedin className="social-icon" />
                  </a>
                )}
                {profile.socialLinks.twitter && (
                  <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                    <FiTwitter className="social-icon" />
                  </a>
                )}
                {profile.socialLinks.personalWebsite && (
                  <a href={profile.socialLinks.personalWebsite} target="_blank" rel="noopener noreferrer">
                    <FiGlobe className="social-icon" />
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {/* Main Profile Content */}
        <div className="profile-content">
          {isEditing ? (
            <div className="edit-profile-form">
              <h2 className="content-title">Edit Profile</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={profile.name} 
                    onChange={handleInputChange}
                  />
                </div>
                
                {profile.userType === 'alumni' && (
                  <>
                    <div className="form-group">
                      <label>Current Job</label>
                      <input 
                        type="text" 
                        name="currentJob"
                        value={profile.currentJob || ''} 
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Graduation Year</label>
                      <select 
                        name="graduationYear"
                        value={profile.graduationYear} 
                        onChange={handleInputChange}
                      >
                        {Array.from({length: 20}, (_, i) => new Date().getFullYear() - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                
                {profile.userType === 'student' && (
                  <div className="form-group">
                    <label>Current Year</label>
                    <select 
                      name="currentYear"
                      value={profile.currentYear} 
                      onChange={handleInputChange}
                    >
                      {[1, 2, 3, 4, 5].map(year => (
                        <option key={year} value={year}>Year {year}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="form-group">
                  <label>Location</label>
                  <input 
                    type="text" 
                    name="location"
                    value={profile.location || ''} 
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Bio</label>
                  <textarea 
                    name="bio"
                    value={profile.bio || ''} 
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Tell others about yourself..."
                  ></textarea>
                </div>
                
                <div className="form-group full-width">
                  <label>Skills</label>
                  <div className="array-input-container">
                    {profile.skills.map((skill, index) => (
                      <div key={index} className="array-input-item">
                        <input
                          type="text"
                          value={skill}
                          onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                        />
                        <button 
                          className="remove-item-button"
                          onClick={() => removeArrayItem('skills', index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button 
                      className="add-item-button"
                      onClick={() => addArrayItem('skills', '')}
                    >
                      + Add Skill
                    </button>
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <label>Interests</label>
                  <div className="array-input-container">
                    {profile.interests.map((interest, index) => (
                      <div key={index} className="array-input-item">
                        <input
                          type="text"
                          value={interest}
                          onChange={(e) => handleArrayChange('interests', index, e.target.value)}
                        />
                        <button 
                          className="remove-item-button"
                          onClick={() => removeArrayItem('interests', index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button 
                      className="add-item-button"
                      onClick={() => addArrayItem('interests', '')}
                    >
                      + Add Interest
                    </button>
                  </div>
                </div>
                
                {profile.userType === 'alumni' && (
                  <>
                    <div className="form-group full-width">
                      <label>Social Links</label>
                      <div className="social-links-input">
                        <div className="social-link-input">
                          <FiLinkedin className="social-icon" />
                          <input
                            type="url"
                            placeholder="LinkedIn URL"
                            value={profile.socialLinks?.linkedin || ''}
                            onChange={(e) => setProfile(prev => ({
                              ...prev,
                              socialLinks: {
                                ...prev.socialLinks,
                                linkedin: e.target.value
                              }
                            }))}
                          />
                        </div>
                        <div className="social-link-input">
                          <FiTwitter className="social-icon" />
                          <input
                            type="url"
                            placeholder="Twitter URL"
                            value={profile.socialLinks?.twitter || ''}
                            onChange={(e) => setProfile(prev => ({
                              ...prev,
                              socialLinks: {
                                ...prev.socialLinks,
                                twitter: e.target.value
                              }
                            }))}
                          />
                        </div>
                        <div className="social-link-input">
                          <FiGlobe className="social-icon" />
                          <input
                            type="url"
                            placeholder="Personal Website"
                            value={profile.socialLinks?.personalWebsite || ''}
                            onChange={(e) => setProfile(prev => ({
                              ...prev,
                              socialLinks: {
                                ...prev.socialLinks,
                                personalWebsite: e.target.value
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={profile.isAvailableForMentorship}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            isAvailableForMentorship: e.target.checked
                          }))}
                        />
                        Available for Mentorship
                      </label>
                    </div>
                  </>
                )}
              </div>
              
              <div className="form-actions">
                <button className="cancel-button" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button className="save-button" onClick={handleSave}>
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-section">
                <h2 className="content-title">About</h2>
                <p className="profile-bio">{profile.bio || 'No bio added yet.'}</p>
                
                <div className="divider"></div>

                <h3 className="section-title">Skills</h3>
                {profile.skills?.length > 0 ? (
                  <div className="skills-list">
                    {profile.skills.map(skill => (
                      <span key={skill} className="skill-badge">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">No skills added yet.</p>
                )}

                <div className="divider"></div>

                <h3 className="section-title">Interests</h3>
                {profile.interests?.length > 0 ? (
                  <div className="interests-list">
                    {profile.interests.map(interest => (
                      <span key={interest} className="interest-badge">
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">No interests added yet.</p>
                )}
              </div>
              
              {profile.userType === 'alumni' && profile.experiences?.length > 0 && (
                <>
                  <div className="divider"></div>
                  <div className="profile-section">
                    <h3 className="section-title">Experience</h3>
                    <div className="experience-list">
                      {profile.experiences.map((exp, index) => (
                        <div key={index} className="experience-item">
                          <h4>{exp.role}</h4>
                          <div className="experience-company">{exp.company}</div>
                          <div className="experience-duration">
                            {exp.startYear} - {exp.endYear || 'Present'}
                          </div>
                          {exp.description && (
                            <p className="experience-description">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {profile.achievements?.length > 0 && (
                <>
                  <div className="divider"></div>
                  <div className="profile-section">
                    <h3 className="section-title">Achievements</h3>
                    <div className="achievements-list">
                      {profile.achievements.map((ach, index) => (
                        <div key={index} className="achievement-item">
                          <FiAward className="achievement-icon" />
                          <div>
                            <h4>{ach.title}</h4>
                            <div className="achievement-year">{ach.year}</div>
                            {ach.description && (
                              <p className="achievement-description">{ach.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;