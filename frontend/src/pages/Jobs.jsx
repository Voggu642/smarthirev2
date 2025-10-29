import React, { useState, useEffect, useCallback } from 'react';
import { jobsAPI, applicationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useResumes } from '../contexts/ResumeContext';
import ApplicationDialog from '../components/ApplicationDialog';
import JobDetailsDialog from '../components/JobDetailsDialog';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, user } = useAuth();
  const { resumes, primaryResume, loading: resumesLoading } = useResumes();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [employmentType, setEmploymentType] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('');
  
  // Applied jobs with localStorage persistence
  const [appliedJobIds, setAppliedJobIds] = useState(() => {
    const saved = localStorage.getItem('smarthire_applied_jobs');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Dialog states
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [showResumeSelector, setShowResumeSelector] = useState(false);

  // FIXED: Proper job matching resume state with null as default
  const [jobMatchingResume, setJobMatchingResume] = useState(null);

  // FIXED: Clean initialization - only set from primaryResume if user is authenticated and has resumes
  useEffect(() => {
    if (isAuthenticated && primaryResume && !jobMatchingResume) {
      setJobMatchingResume(primaryResume);
    } else if (!isAuthenticated) {
      // Clear any resume data if user is not authenticated
      setJobMatchingResume(null);
      localStorage.removeItem('smarthire_job_matching_resume');
    }
  }, [isAuthenticated, primaryResume, jobMatchingResume]);

  // FIXED: Load job matching resume ONLY for authenticated users with valid data
  useEffect(() => {
    if (!isAuthenticated) {
      setJobMatchingResume(null);
      localStorage.removeItem('smarthire_job_matching_resume');
      return;
    }

    const savedJobMatchingResume = localStorage.getItem('smarthire_job_matching_resume');
    if (savedJobMatchingResume) {
      try {
        const resumeData = JSON.parse(savedJobMatchingResume);
        // Validate that the saved resume actually exists in current user's resumes
        const isValidResume = resumes.some(resume => resume.id === resumeData.id);
        if (isValidResume) {
          setJobMatchingResume(resumeData);
        } else {
          // Saved resume is invalid, fallback to primary resume
          setJobMatchingResume(primaryResume || null);
          localStorage.removeItem('smarthire_job_matching_resume');
        }
      } catch (error) {
        console.error('Error loading job matching resume:', error);
        setJobMatchingResume(primaryResume || null);
        localStorage.removeItem('smarthire_job_matching_resume');
      }
    } else if (primaryResume) {
      // If no saved resume, use primary resume
      setJobMatchingResume(primaryResume);
    } else {
      // No resumes at all
      setJobMatchingResume(null);
    }
  }, [isAuthenticated, primaryResume, resumes]);

  // FIXED: Save job matching resume only when it exists and user is authenticated
  useEffect(() => {
    if (isAuthenticated && jobMatchingResume) {
      localStorage.setItem('smarthire_job_matching_resume', JSON.stringify(jobMatchingResume));
    } else if (!isAuthenticated) {
      // Clear resume data when user logs out
      localStorage.removeItem('smarthire_job_matching_resume');
    }
  }, [jobMatchingResume, isAuthenticated]);

  // FIXED: Clear job matching resume when all resumes are deleted
  useEffect(() => {
    if (isAuthenticated && resumes.length === 0 && jobMatchingResume) {
      setJobMatchingResume(null);
      localStorage.removeItem('smarthire_job_matching_resume');
    }
  }, [resumes.length, isAuthenticated, jobMatchingResume]);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, searchTerm, employmentType, locationFilter, skillFilter, appliedJobIds, isAuthenticated, jobMatchingResume]);

  // Save applied jobs to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('smarthire_applied_jobs', JSON.stringify([...appliedJobIds]));
  }, [appliedJobIds]);

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

// FIXED: calculateJobMatch function - make it use current jobMatchingResume
const calculateJobMatch = useCallback((job) => {
  // FIXED: Return -1 (no matching) if no resume is selected
  if (!jobMatchingResume) {
    console.log("DEBUG: No jobMatchingResume selected");
    return -1;
  }
  
  console.log("DEBUG: Calculating match for job:", job.title);
  console.log("DEBUG: Using resume:", jobMatchingResume.filename);
  console.log("DEBUG: Resume skills:", jobMatchingResume.extracted_skills);
  console.log("DEBUG: Job skills:", job.required_skills);
  
  if (!job || !Array.isArray(job.required_skills) || job.required_skills.length === 0) {
    console.log("DEBUG: No job skills to match");
    return -1;
  }
  
  if (!Array.isArray(jobMatchingResume.extracted_skills) || jobMatchingResume.extracted_skills.length === 0) {
    console.log("DEBUG: No resume skills to match");
    return 0; // No skills in resume to match with
  }
  
  try {
    const resumeSkills = jobMatchingResume.extracted_skills.map(skill => skill.toLowerCase());
    const jobSkills = job.required_skills.map(skill => skill.toLowerCase());
    
    const matchingSkills = jobSkills.filter(skill => 
      resumeSkills.some(resumeSkill => 
        resumeSkill.includes(skill) || skill.includes(resumeSkill)
      )
    );
    
    console.log("DEBUG: Matching skills:", matchingSkills);
    const matchScore = Math.round((matchingSkills.length / jobSkills.length) * 100);
    console.log("DEBUG: Match score:", matchScore);
    
    if (matchingSkills.length === 0) {
      return 0;
    }
    
    return matchScore;
  } catch (error) {
    console.error('Error calculating job match:', error);
    return -1;
  }
}, [jobMatchingResume]);

// FIXED: applyFilters function - ensure it always uses latest jobs state
const applyFilters = useCallback(() => {
  console.log("DEBUG: applyFilters called with jobs:", jobs.length);
  console.log("DEBUG: jobMatchingResume:", jobMatchingResume?.filename);
  
  let filtered = jobs.filter(job => job && job.id);

  if (searchTerm) {
    filtered = filtered.filter(job =>
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (employmentType !== 'all') {
    filtered = filtered.filter(job => 
      job.employment_type === employmentType
    );
  }

  if (locationFilter !== 'all') {
    filtered = filtered.filter(job =>
      job.location?.toLowerCase().includes(locationFilter.toLowerCase())
    );
  }

  if (skillFilter) {
    filtered = filtered.filter(job =>
      job.required_skills?.some(skill =>
        skill?.toLowerCase().includes(skillFilter.toLowerCase())
      )
    );
  }

  // FIXED: Only calculate and sort by match score if a resume is selected
  if (jobMatchingResume) {
    console.log("DEBUG: Calculating match scores with resume:", jobMatchingResume.filename);
    filtered = filtered.map(job => ({
      ...job,
      matchScore: calculateJobMatch(job)
    })).sort((a, b) => {
      // Sort by match score, but put jobs with no matching (-1) at the end
      if (a.matchScore === -1) return 1;
      if (b.matchScore === -1) return -1;
      return b.matchScore - a.matchScore;
    });
  } else {
    // No resume selected - show all jobs without match scores
    console.log("DEBUG: No resume selected, showing all jobs");
    filtered = filtered.map(job => ({
      ...job,
      matchScore: -1 // Indicate no matching was done
    }));
  }

  console.log("DEBUG: Final filtered jobs count:", filtered.length);
  setFilteredJobs(filtered);
}, [jobs, searchTerm, employmentType, locationFilter, skillFilter, jobMatchingResume, calculateJobMatch]);

// Update the useEffect to use the memoized applyFilters
useEffect(() => {
  applyFilters();
}, [applyFilters]);

  const handleViewJob = (job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleApplyFromDetails = (job) => {
    setShowJobDetails(false);
    setShowApplicationDialog(true);
  };

  const handleApplicationSubmit = async (appliedJobId) => {
    console.log('Application submitted for job:', appliedJobId);
    
    setAppliedJobIds(prev => new Set([...prev, appliedJobId]));
    
    try {
      await fetchJobs();
    } catch (err) {
      console.error('Error refreshing jobs:', err);
    }
  };
  // FIXED: Resume Selector Component - updated text
const ResumeSelector = () => (
  <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-gray-900">Job Matching Resume</h3>
        <p className="text-sm text-gray-600">
          {jobMatchingResume 
            ? `Matching jobs with: ${jobMatchingResume.filename}`
            : 'Select a resume to enable skill-based job matching'
          }
        </p>
        {jobMatchingResume ? (
          <div className="flex flex-wrap gap-1 mt-2">
            {jobMatchingResume.extracted_skills.slice(0, 5).map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                {skill}
              </span>
            ))}
            {jobMatchingResume.extracted_skills.length > 5 && (
              <span className="text-gray-500 text-xs">+{jobMatchingResume.extracted_skills.length - 5} more</span>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-2">
            Upload a resume to see personalized job matches based on your skills
          </p>
        )}
      </div>
      <button
        onClick={() => setShowResumeSelector(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        {jobMatchingResume ? 'Change Resume' : 'Select Resume'}
      </button>
    </div>
  </div>
);


// FIXED: Resume Selector Modal with proper state update
const ResumeSelectorModal = () => {
  console.log("=== DEBUG ResumeSelectorModal ===");
  console.log("All resumes:", resumes);
  console.log("Primary resume:", primaryResume);
  console.log("Job matching resume:", jobMatchingResume);

  const handleResumeSelect = (resume) => {
    console.log("SELECTING RESUME:", resume.id, resume.filename);
    setJobMatchingResume(resume);
    setShowResumeSelector(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold">Select Resume for Job Matching</h2>
          <p className="text-sm text-gray-600 mt-1">
            This only affects job matching on this page - your primary resume remains unchanged
          </p>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">Choose which resume to use for job matching:</p>
          
          <div className="space-y-3">
            {resumes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No resumes uploaded yet</p>
            ) : (
              resumes.map(resume => {
                const isSelected = jobMatchingResume && jobMatchingResume.id === resume.id;
                
                console.log(`Resume ${resume.id}: isSelected=${isSelected}`);
                
                return (
                  <button
                    key={resume.id}
                    onClick={() => handleResumeSelect(resume)}
                    className={`w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{resume.filename}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {resume.extracted_skills.slice(0, 3).map((skill, index) => (
                            <span key={`${resume.id}-${skill}-${index}`} className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1 ml-2">
                        {isSelected && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div className="border-t px-6 py-4">
          <button
            onClick={() => setShowResumeSelector(false)}
            className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
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

          {/* Resume Selector - Only show for authenticated users */}
          {isAuthenticated && <ResumeSelector />}

          {/* Rest of your JSX remains the same */}
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
  <div key={`job-${job.id}`} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow relative">
    {/* Header with badges */}
    <div className="flex justify-between items-start p-6 pb-2">
      {/* Match Score Badge - ONLY show when jobMatchingResume exists AND matchScore is valid */}
      {jobMatchingResume && job.matchScore !== undefined && job.matchScore !== -1 && (
        (() => {
          const matchScore = job.matchScore;
          
          if (matchScore === 0) {
            return (
              <div className="mb-2">
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                  🤔 No Match
                </span>
              </div>
            );
          } else if (matchScore > 0) {
            return (
              <div className="mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  matchScore >= 80 ? 'bg-green-100 text-green-800' :
                  matchScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {matchScore}% Match
                </span>
              </div>
            );
          }
          
          return null;
        })()
      )}
      
      {/* Applied Badge */}
      {appliedJobIds.has(job.id) && (
        <div className="mb-2">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            ✓ Applied
          </span>
        </div>
      )}
    </div>

    <div className="p-6 pt-2">
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
          onClick={() => handleViewJob(job)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          View Job
        </button>
      </div>
    </div>
  </div>
))}
          </div>
        )}
      </div>

      {/* Resume Selector Modal */}
      {showResumeSelector && <ResumeSelectorModal />}

      {/* Job Details Dialog */}
      <JobDetailsDialog
        job={selectedJob}
        isOpen={showJobDetails}
        onClose={() => setShowJobDetails(false)}
        onApplyClick={handleApplyFromDetails}
        isApplied={selectedJob ? appliedJobIds.has(selectedJob.id) : false}
        matchScore={jobMatchingResume && selectedJob ? calculateJobMatch(selectedJob) : -1}
      />

      {/* Application Dialog */}
      <ApplicationDialog
        job={selectedJob}
        isOpen={showApplicationDialog}
        onClose={() => setShowApplicationDialog(false)}
        onApplicationSubmit={() => handleApplicationSubmit(selectedJob?.id)}
        selectedResume={jobMatchingResume}
      />
    </div>
  );
};

export default Jobs;