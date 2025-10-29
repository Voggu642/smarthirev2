import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useResumes } from '../contexts/ResumeContext';
import { applicationsAPI } from '../services/api';

const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isCandidate } = useAuth();
  const { resumes, primaryResume } = useResumes();

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Store which resume was used for each application
  const [applicationResumes, setApplicationResumes] = useState({});

  useEffect(() => {
    if (user && isCandidate) {
      fetchApplications();
    }
  }, [user, isCandidate]);

  useEffect(() => {
    applyFilters();
  }, [applications, statusFilter, companyFilter, searchTerm]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationsAPI.getCandidateApplications("temp_candidate_id");
      const apps = response.data;
      setApplications(apps);
      
      // Load application resumes from localStorage
      loadApplicationResumes(apps);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicationResumes = (apps) => {
    const savedResumes = localStorage.getItem('smarthire_application_resumes');
    if (savedResumes) {
      const resumesMap = JSON.parse(savedResumes);
      setApplicationResumes(resumesMap);
    } else {
      // If no saved data, assume primary resume was used for all applications
      const defaultResumes = {};
      apps.forEach(app => {
        if (primaryResume) {
          defaultResumes[app.id] = primaryResume.filename;
        }
      });
      setApplicationResumes(defaultResumes);
      localStorage.setItem('smarthire_application_resumes', JSON.stringify(defaultResumes));
    }
  };

  const getResumeForApplication = (applicationId) => {
    const resumeName = applicationResumes[applicationId];
    if (resumeName) {
      return resumeName;
    }
    // Fallback to primary resume if not found
    return primaryResume ? primaryResume.filename : 'Unknown Resume';
  };

  const applyFilters = () => {
    let filtered = applications;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Company filter
    if (companyFilter !== 'all') {
      filtered = filtered.filter(app => 
        app.company.toLowerCase().includes(companyFilter.toLowerCase())
      );
    }

    // Search filter (job title, company, or resume name)
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getResumeForApplication(app.id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by newest first
    filtered = [...filtered].reverse();

    setFilteredApplications(filtered);
  };

  // Get unique values for filters
  const statuses = ['all', 'pending', 'accepted', 'rejected'];
  const companies = ['all', ...new Set(applications.map(app => app.company))];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      default: return '📝';
    }
  };

  const getResumeIcon = (resumeName) => {
    if (resumeName.includes('resume') || resumeName.includes('cv')) return '📄';
    if (resumeName.includes('developer')) return '💻';
    if (resumeName.includes('engineer')) return '⚙️';
    return '📝';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">Loading your applications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.full_name}!</p>
        </div>
        
        {isCandidate ? (
          // Candidate Dashboard - My Applications
          <div>
            {/* Header Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">My Applications</h2>
                  <p className="text-gray-600 mt-1">
                    Track your job applications and their status
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                    <div className="text-sm text-blue-700">Total Applications</div>
                  </div>
                  <div className="bg-green-50 px-4 py-2 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{resumes.length}</div>
                    <div className="text-sm text-green-700">Available Resumes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Primary Resume */}
            {primaryResume && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">Current Primary Resume</h3>
                    <p className="text-sm text-blue-700">
                      {primaryResume.filename}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {primaryResume.extracted_skills.slice(0, 4).map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {primaryResume.extracted_skills.length > 4 && (
                        <span className="text-blue-500 text-xs">+{primaryResume.extracted_skills.length - 4} more</span>
                      )}
                    </div>
                  </div>
                  <a 
                    href="/profile" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Manage Resumes
                  </a>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Applications
                  </label>
                  <input
                    type="text"
                    placeholder="Job title, company, or resume..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {companies.map(company => (
                      <option key={company} value={company}>
                        {company === 'all' ? 'All Companies' : company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(statusFilter !== 'all' || companyFilter !== 'all' || searchTerm) && (
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Showing {filteredApplications.length} of {applications.length} applications
                  </span>
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setCompanyFilter('all');
                      setSearchTerm('');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
            
            {/* Applications List */}
            {filteredApplications.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {applications.length === 0 ? 'No applications yet' : 'No applications found'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {applications.length === 0 
                    ? "You haven't applied to any jobs yet. Start your job search and apply to positions that match your skills." 
                    : "Try adjusting your filters to see more applications."}
                </p>
                {applications.length === 0 ? (
                  <a 
                    href="/jobs" 
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Browse Jobs
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setCompanyFilter('all');
                      setSearchTerm('');
                    }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredApplications.map((app) => (
                  <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Job Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {app.job_title}
                            </h3>
                            <p className="text-gray-600 mb-2">{app.company} • {app.location}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getStatusIcon(app.status)}</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(app.status)}`}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        {/* Application Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Applied:</span>
                            <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                          </div>
                          
                          {/* Resume Used */}
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Resume Used:</span>
                            <span className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs">
                              <span>{getResumeIcon(getResumeForApplication(app.id))}</span>
                              <span className="max-w-32 truncate" title={getResumeForApplication(app.id)}>
                                {getResumeForApplication(app.id)}
                              </span>
                            </span>
                          </div>

                          {app.match_score && (
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Match Score:</span>
                              <span className={`font-semibold ${
                                app.match_score >= 0.8 ? 'text-green-600' :
                                app.match_score >= 0.6 ? 'text-yellow-600' :
                                'text-orange-600'
                              }`}>
                                {(app.match_score * 100).toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Skills Match (if available) */}
                        {app.match_score && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Skills Match</span>
                              <span className="text-xs text-gray-500">
                                {Math.round(app.match_score * 100)}% compatible
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  app.match_score >= 0.8 ? 'bg-green-500' :
                                  app.match_score >= 0.6 ? 'bg-yellow-500' :
                                  'bg-orange-500'
                                }`}
                                style={{ width: `${app.match_score * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Employer view
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="text-6xl mb-4">💼</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Employer Dashboard</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Post jobs and manage applications from qualified candidates.
            </p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Post Your First Job
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;