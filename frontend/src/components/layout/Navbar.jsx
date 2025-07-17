import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiBell, FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.mobile-menu, .mobile-menu-button')) {
        setMobileMenuOpen(false);
      }
      if (userDropdownOpen && !event.target.closest('.user-menu')) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen, userDropdownOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setUserDropdownOpen(false);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
    setMobileMenuOpen(false);
  };

  // Sample notification count - replace with real data
  useEffect(() => {
    // This would be replaced with actual notification fetching
    if (user) {
      setNotificationCount(3); // Example count
    }
  }, [user]);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-button"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <FiMenu size={24} />
          </button>

          {/* Logo */}
          <h1 className="navbar-logo">
            <RouterLink to="/">Alumni Meet</RouterLink>
          </h1>

          {/* Desktop Navigation */}
          <div className="desktop-nav">
            <RouterLink
              to="/events"
              className={`nav-link ${location.pathname === '/events' ? 'active' : ''}`}
            >
              Events
            </RouterLink>
            <RouterLink
              to="/alumni"
              className={`nav-link ${location.pathname === '/alumni' ? 'active' : ''}`}
            >
              Alumni
            </RouterLink>
            <RouterLink
              to="/messages"
              className={`nav-link ${location.pathname === '/messages' ? 'active' : ''}`}
            >
              Messages
            </RouterLink>
            {user?.role === 'admin' && (
              <RouterLink
                to="/admin"
                className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
              >
                Admin
              </RouterLink>
            )}
          </div>

          <div className="navbar-spacer"></div>

          {/* Right Side Controls */}
          <div className="navbar-controls">
            {user ? (
              <>
                <button className="notification-button" aria-label="Notifications">
                  <div className="notification-badge">
                    <FiBell size={20} />
                    {notificationCount > 0 && (
                      <span className="badge-count">{notificationCount}</span>
                    )}
                  </div>
                </button>

                <div className="user-menu">
                  <button 
                    className="user-button"
                    onClick={toggleUserDropdown}
                    aria-label="User menu"
                    aria-expanded={userDropdownOpen}
                  >
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="user-name">{user.name}</span>
                  </button>
                  {userDropdownOpen && (
                    <div className="user-dropdown">
                      <RouterLink 
                        to="/profile" 
                        className="dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <FiUser className="dropdown-icon" /> My Profile
                      </RouterLink>
                      <RouterLink 
                        to="/settings" 
                        className="dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <FiSettings className="dropdown-icon" /> Settings
                      </RouterLink>
                      <button 
                        onClick={handleLogout} 
                        className="dropdown-item"
                      >
                        <FiLogOut className="dropdown-icon" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <RouterLink to="/login" className="login-button">
                  Login
                </RouterLink>
                <RouterLink to="/register" className="register-button">
                  Register
                </RouterLink>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          {user ? (
            <>
              <div className="mobile-user-info">
                <div className="mobile-user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="mobile-user-name">{user.name}</div>
              </div>
              <RouterLink 
                to="/profile" 
                className="mobile-menu-item"
                onClick={toggleMobileMenu}
              >
                My Profile
              </RouterLink>
              <RouterLink 
                to="/events" 
                className="mobile-menu-item"
                onClick={toggleMobileMenu}
              >
                Events
              </RouterLink>
              <RouterLink 
                to="/alumni" 
                className="mobile-menu-item"
                onClick={toggleMobileMenu}
              >
                Alumni
              </RouterLink>
              <RouterLink 
                to="/messages" 
                className="mobile-menu-item"
                onClick={toggleMobileMenu}
              >
                Messages
              </RouterLink>
              {user.role === 'admin' && (
                <RouterLink 
                  to="/admin" 
                  className="mobile-menu-item"
                  onClick={toggleMobileMenu}
                >
                  Admin Dashboard
                </RouterLink>
              )}
              <button 
                onClick={() => {
                  handleLogout();
                  toggleMobileMenu();
                }} 
                className="mobile-menu-item"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <RouterLink 
                to="/login" 
                className="mobile-menu-item"
                onClick={toggleMobileMenu}
              >
                Login
              </RouterLink>
              <RouterLink 
                to="/register" 
                className="mobile-menu-item"
                onClick={toggleMobileMenu}
              >
                Register
              </RouterLink>
              <RouterLink 
                to="/events" 
                className="mobile-menu-item"
                onClick={toggleMobileMenu}
              >
                Events
              </RouterLink>
              <RouterLink 
                to="/alumni" 
                className="mobile-menu-item"
                onClick={toggleMobileMenu}
              >
                Alumni
              </RouterLink>
            </>
          )}
        </div>
        <div 
          className="mobile-menu-overlay" 
          onClick={toggleMobileMenu}
          role="button"
          aria-label="Close menu"
        ></div>
      </div>
    </>
  );
};

export default Navbar;