import { useState, useEffect, useMemo, useCallback } from 'react';
import { alumniService } from '../../services/api';
import AlumniList from '../../components/alumni/AlumniList';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import './AlumniDirectoryPage.css';

const AlumniDirectoryPage = () => {
  const [allAlumni, setAllAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    graduationYear: '',
    department: '',
    skills: [],
    isAvailableForMentorship: false
  });

  // Memoized filter function
  const filterAlumni = useCallback((alumni, filters) => {
    const { search, graduationYear, department, skills, isAvailableForMentorship } = filters;
    const searchTerm = search.toLowerCase();

    return alumni.filter(alumnus => {
      // Search filter
      if (search && !(
        alumnus.name.toLowerCase().includes(searchTerm) ||
        alumnus.currentJob?.toLowerCase().includes(searchTerm) ||
        alumnus.department?.toLowerCase().includes(searchTerm) ||
        alumnus.bio?.toLowerCase().includes(searchTerm) ||
        alumnus.skills?.some(skill => skill.toLowerCase().includes(searchTerm))
      )) {
        return false;
      }

      // Graduation year filter
      if (graduationYear && alumnus.graduationYear !== parseInt(graduationYear)) {
        return false;
      }

      // Department filter
      if (department && alumnus.department !== department) {
        return false;
      }

      // Skills filter
      if (skills.length > 0 && !(
        alumnus.skills && 
        skills.every(skill => alumnus.skills.includes(skill))
      )) {
        return false;
      }

      // Mentorship availability filter
      if (isAvailableForMentorship && !alumnus.isAvailableForMentorship) {
        return false;
      }

      return true;
    });
  }, []);

  // Memoized filtered alumni
  const filteredAlumni = useMemo(() => {
    return filterAlumni(allAlumni, filters);
  }, [allAlumni, filters, filterAlumni]);

  // Memoized filter options
  const filterOptions = useMemo(() => {
    const graduationYears = [...new Set(allAlumni.map(a => a.graduationYear))]
      .filter(Boolean)
      .sort((a, b) => b - a);

    const departments = [...new Set(allAlumni.map(a => a.department))]
      .filter(Boolean)
      .sort();

    const allSkills = allAlumni.flatMap(alumnus => alumnus.skills || [])
      .filter(Boolean);
    const skills = [...new Set(allSkills)].sort();

    return { graduationYears, departments, skills };
  }, [allAlumni]);

  // Fetch all alumni on component mount
  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        setLoading(true);
        const response = await alumniService.getAllAlumni();
        setAllAlumni(response.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch alumni data');
      } finally {
        setLoading(false);
      }
    };

    fetchAlumni();
  }, []);

  if (loading) return <LoadingSpinner size="large" />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="alumni-directory-page">
      <header className="page-header">
        <h1>Alumni Directory</h1>
        <p className="subtitle">Connect with graduates from your institution</p>
      </header>
      
      <AlumniList 
        alumni={filteredAlumni}
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={setFilters}
        totalAlumni={allAlumni.length}
      />
    </div>
  );
};

export default AlumniDirectoryPage;