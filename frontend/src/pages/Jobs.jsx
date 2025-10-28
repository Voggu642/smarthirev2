import React, { useState, useEffect } from 'react';
import { jobsAPI, applicationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, user } = useAuth();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [employmentType, setEmploymentType] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    // Apply filters whenever jobs, search term, or filters change
    applyFilters();
  }, [jobs, searchTerm, employmentType, locationFilter, skillFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getJobs();
      setJobs(response.data);
    } catch (err) {
      setError('Failed to load jobs');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = jobs;

    // Search filter (title, company, description)
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Employment type filter
    if (employmentType !== 'all') {
      filtered = filtered.filter(job => 
        job.employment_type === employmentType
      );
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Skills filter
    if (skillFilter) {
      filtered = filtered.filter(job =>
        job.required_skills.some(skill =>
          skill.toLowerCase().includes(skillFilter.toLowerCase())
        )
      );
    }

    setFilteredJobs(filtered);
  };

  const handleApply = async (jobId, jobTitle) => {
    if (!isAuthenticated) {
      alert('Please login to apply for jobs');
      return;
    }

    try {
      const applicationData = {
        job_id: jobId,
        cover_letter: `I'm very interested in the ${jobTitle} position at your company. I believe my skills and experience make me a great fit for this role.`
      };
      
      await applicationsAPI.apply(applicationData);
      alert('🎉 Application submitted successfully!');
      
    } catch (err) {
      if (err.response?.status === 400) {
        alert('You have already applied to this job!');
      } else {
        console.error('Error applying:', err);
        alert('Failed to apply for job. Please try again.');
      }
    }
  };

  // Get unique values for filters
  const employmentTypes = ['all', ...new Set(jobs.map(job => job.employment_type))];
  const locations = ['all', ...new Set(jobs.map(job => job.location))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading jobs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Search */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Job Listings</h1>
            <div className="text-sm text-gray-600">
              {filteredJobs.length} of {jobs.length} job{filteredJobs.length !== 1 ? 's' : ''} shown
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Jobs
                </label>
                <input
                  type="text"
                  placeholder="Job title, company, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Employment Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {employmentTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {locations.map(location => (
                    <option key={location} value={location}>
                      {location === 'all' ? 'All Locations' : location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skills Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills
                </label>
                <input
                  type="text"
                  placeholder="Filter by skills..."
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(searchTerm || employmentType !== 'all' || locationFilter !== 'all' || skillFilter) && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setEmploymentType('all');
                    setLocationFilter('all');
                    setSkillFilter('');
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Job Listings */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-lg text-gray-600 mb-4">No jobs found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setEmploymentType('all');
                setLocationFilter('all');
                setSkillFilter('');
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                  <p className="text-gray-600 mb-4">{job.company} • {job.location}</p>
                  
                  <div className="mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                      {job.employment_type}
                    </span>
                    {job.salary_range && (
                      <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full ml-2">
                        {job.salary_range}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>

                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Required Skills:</h4>
                      <div className="flex flex-wrap gap-1">
                        {job.required_skills.map((skill, index) => (
                          <span 
                            key={index}
                            className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-6">
                    <span className="text-sm text-gray-500">
                      Posted {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleApply(job.id, job.title)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {isAuthenticated ? 'Apply Now' : 'Login to Apply'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;