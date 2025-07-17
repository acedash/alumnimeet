import AlumniCard from "./AlumniCard";
const AlumniList = ({ 
  alumni, 
  filters, 
  filterOptions,
  onFilterChange,
  totalAlumni 
}) => {
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    onFilterChange(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkillsChange = (selectedSkills) => {
    onFilterChange(prev => ({
      ...prev,
      skills: selectedSkills
    }));
  };

  const resetFilters = () => {
    onFilterChange({
      search: '',
      graduationYear: '',
      department: '',
      skills: [],
      isAvailableForMentorship: false
    });
  };

  return (
    <div className="alumni-list-container">
      <div className="filters-section">
        {/* Search input */}
        <div className="search-filter">
          <input
            type="text"
            name="search"
            placeholder="Search by name, job, or skills..."
            value={filters.search}
            onChange={handleInputChange}
          />
        </div>

        {/* Dropdown filters */}
        <div className="dropdown-filters">
          <select
            name="graduationYear"
            value={filters.graduationYear}
            onChange={handleInputChange}
          >
            <option value="">All Graduation Years</option>
            {filterOptions.graduationYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            name="department"
            value={filters.department}
            onChange={handleInputChange}
          >
            <option value="">All Departments</option>
            {filterOptions.departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Checkbox filter */}
        <div className="checkbox-filter">
          <label>
            <input
              type="checkbox"
              name="isAvailableForMentorship"
              checked={filters.isAvailableForMentorship}
              onChange={handleInputChange}
            />
            Available for Mentorship Only
          </label>
        </div>

        {/* Results count and reset */}
        <div className="filter-controls">
          <span className="results-count">
            Showing {alumni.length} of {totalAlumni} alumni
          </span>
          <button 
            onClick={resetFilters} 
            className="reset-button"
            disabled={!filters.search && 
                     !filters.graduationYear && 
                     !filters.department && 
                     !filters.skills.length && 
                     !filters.isAvailableForMentorship}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Alumni grid */}
      <div className="alumni-grid">
        {alumni.length > 0 ? (
          alumni.map(alumnus => (
            <AlumniCard key={alumnus._id} alumnus={alumnus} />
          ))
        ) : (
          <div className="no-results">
            <p>No alumni match your current filters</p>
            <button onClick={resetFilters} className="reset-button">
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default AlumniList