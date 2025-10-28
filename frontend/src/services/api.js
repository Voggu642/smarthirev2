import axios from 'axios';

// Base URL for backend API - adjust port if needed
const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

// Jobs API calls
export const jobsAPI = {
  getJobs: () => api.get('/jobs/'),
  getJob: (id) => api.get(`/jobs/${id}`),
  createJob: (jobData) => api.post('/jobs/', jobData),
  getEmployerJobs: (employerId) => api.get(`/jobs/employer/${employerId}`),
};

// Applications API calls
export const applicationsAPI = {
  apply: (applicationData) => api.post('/applications/', applicationData),
  getCandidateApplications: (candidateId) => api.get(`/applications/candidate/${candidateId}`),
  getJobApplications: (jobId) => api.get(`/applications/job/${jobId}`),
};

export default api;