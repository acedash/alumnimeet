import { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

const AlumniFilters = ({ currentFilters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(currentFilters);
  
  // Update local filters when parent filters change
  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange(localFilters);
  };
  
  const resetFilters = () => {
    const resetFilters = {
      ...localFilters,
      search: '',
      graduationYear: '',
      department: '',
      skills: [],
      isAvailableForMentorship: false,
      page: 1
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <form onSubmit={handleSubmit} className="alumni-filters">
      <div className="search-bar">
        <div className="search-input">
          <FiSearch className="search-icon" />
          <input
            type="text"
            name="search"
            placeholder="Search by name, job, or skills..."
            value={localFilters.search}
            onChange={handleInputChange}
          />
          {localFilters.search && (
            <button 
              type="button" 
              className="clear-search"
              onClick={() => setLocalFilters(prev => ({ ...prev, search: '' }))}
            >
              <FiX />
            </button>
          )}
        </div>
        <button type="submit" className="search-button">
          Search
        </button>
      </div>
      
      <div className="filter-grid">
        <div className="filter-group">
          <label>Graduation Year</label>
          <select
            name="graduationYear"
            value={localFilters.graduationYear}
            onChange={handleInputChange}
          >
            <option value="">All Years</option>
            {Array.from({length: 20}, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Department</label>
          <select
            name="department"
            value={localFilters.department}
            onChange={handleInputChange}
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
            {/* Add more departments as needed */}
          </select>
        </div>
        
        <div className="filter-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isAvailableForMentorship"
              checked={localFilters.isAvailableForMentorship}
              onChange={handleCheckboxChange}
            />
            Available for Mentorship
          </label>
        </div>
        
        <button 
          type="button" 
          className="reset-filters"
          onClick={resetFilters}
        >
          Reset Filters
        </button>
      </div>
    </form>
  );
};

export default AlumniFilters;