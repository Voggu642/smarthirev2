import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { applicationsAPI } from '../services/api';

const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isCandidate } = useAuth();

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (user && isCandidate) {
      fetchApplications();
    }
  }, [user, isCandidate]);

  useEffect(() => {
    applyFilters();
  }, [applications, statusFilter, companyFilter, searchTerm, sortBy]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationsAPI.getCandidateApplications("temp_candidate_id");
      setApplications(response.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

const applyFilters = () => {
  let filtered = applications;

  // Apply filters
  if (statusFilter !== 'all') {
    filtered = filtered.filter(app => app.status === statusFilter);
  }

  if (companyFilter !== 'all') {
    filtered = filtered.filter(app => 
      app.company.toLowerCase().includes(companyFilter.toLowerCase())
    );
  }

  if (searchTerm) {
    filtered = filtered.filter(app =>
      app.job_title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (sortBy === 'newest') {
    filtered = [...filtered].reverse();
  }

  setFilteredApplications(filtered);
};

  // Get unique values for filters
  const statuses = ['all', 'pending', 'accepted', 'rejected'];
  const companies = ['all', ...new Set(applications.map(app => app.company))];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading your applications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome back, {user?.full_name}!</p>
        
        {isCandidate ? (
          // Candidate Dashboard - My Applications
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">My Applications</h2>
              <span className="text-sm text-gray-600">
                {filteredApplications.length} of {applications.length} application{filteredApplications.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Jobs
                  </label>
                  <input
                    type="text"
                    placeholder="Job title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {companies.map(company => (
                      <option key={company} value={company}>
                        {company === 'all' ? 'All Companies' : company}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(statusFilter !== 'all' || companyFilter !== 'all' || searchTerm) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setCompanyFilter('all');
                      setSearchTerm('');
                      setSortBy('newest');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
            
            {filteredApplications.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-gray-600 mb-4">
                  {applications.length === 0 
                    ? "You haven't applied to any jobs yet." 
                    : "No applications found matching your filters."}
                </p>
                {applications.length === 0 ? (
                  <a 
                    href="/jobs" 
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredApplications.map((app) => (
                  <div key={app.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{app.job_title}</h3>
                        <p className="text-gray-600">{app.company} • {app.location}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Applied:</span>{' '}
                        {new Date(app.applied_at).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Job ID:</span> {app.job_id}
                      </div>
                      {app.match_score && (
                        <div>
                          <span className="font-medium">Match Score:</span>{' '}
                          <span className="text-green-600 font-medium">
                            {(app.match_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {app.cover_letter && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Cover Letter:</h4>
                        <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                          {app.cover_letter}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Employer view remains the same
          <div>
            <h2 className="text-2xl font-semibold mb-6">My Job Postings</h2>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600 mb-4">You haven't posted any jobs yet.</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Post Your First Job
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;