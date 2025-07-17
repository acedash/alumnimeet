import React, { useState } from 'react';
import { FiBriefcase, FiUser, FiMapPin, FiMessageCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import ChatModal from '../chat/ChatModal';
import './AlumniCard.css';

const AlumniCard = ({ alumnus }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleChatClick = (e) => {
    e.preventDefault();
    setIsChatOpen(true);
  };

  return (
    <>
      <div className="alumni-card">
        <div className="card-header">
          <img 
            src={alumnus.profilePicture || 'https://bit.ly/dan-abramov'} 
            alt={alumnus.name}
            className="avatar"
          />
          <div className="header-info">
            <h3>
              <Link to={`/alumni/${alumnus._id}`}>{alumnus.name}</Link>
            </h3>
            <div className="batch-year">Batch of {alumnus.graduationYear}</div>
          </div>
        </div>
        
        <div className="card-details">
          {alumnus.currentJob && (
            <div className="detail-item">
              <FiBriefcase className="icon" />
              <span>{alumnus.currentJob}</span>
            </div>
          )}

          {alumnus.department && (
            <div className="detail-item">
              <FiUser className="icon" />
              <span>{alumnus.department}</span>
            </div>
          )}

          {alumnus.location && (
            <div className="detail-item">
              <FiMapPin className="icon" />
              <span>{alumnus.location}</span>
            </div>
          )}
        </div>

        <div className="button-group">
          <Link to={`/alumni/${alumnus._id}`} className="btn view-btn">
            View Profile
          </Link>
          <button onClick={handleChatClick} className="btn chat-btn">
            <FiMessageCircle className="icon" /> Chat
          </button>
        </div>
      </div>

      <ChatModal 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={alumnus}
      />
    </>
  );
};

export default AlumniCard;