import React, { useState, useEffect } from 'react';
import { applicationsAPI } from '../services/api';

const ApplicationDialog = ({ job, isOpen, onClose, onApplicationSubmit }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCoverLetter('');
      setResumeFile(null);
      // Clear the file input
      const fileInput = document.getElementById('resume-upload');
      if (fileInput) fileInput.value = '';
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverLetter.trim()) {
      alert('Please write a cover letter');
      return;
    }

    setLoading(true);
    try {
      const applicationData = {
        job_id: job.id,
        cover_letter: coverLetter,
        resume_attached: !!resumeFile
      };
      
      await applicationsAPI.apply(applicationData);
      onApplicationSubmit();
      onClose();
      alert('🎉 Application submitted successfully!');
    } catch (err) {
      if (err.response?.status === 400) {
        alert('You have already applied to this job!');
      } else {
        console.error('Error applying:', err);
        alert('Failed to apply for job. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert('File size should be less than 5MB');
          e.target.value = '';
          return;
        }
        setResumeFile(file);
      } else {
        alert('Please upload a PDF file only');
        e.target.value = '';
      }
    }
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    // Clear the file input
    const fileInput = document.getElementById('resume-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleClose = () => {
    // Reset form when closing
    setCoverLetter('');
    setResumeFile(null);
    const fileInput = document.getElementById('resume-upload');
    if (fileInput) fileInput.value = '';
    onClose();
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Apply for {job.title}</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-1">{job.company} • {job.location}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Resume (PDF) - Optional
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-colors hover:border-blue-400">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="resume-upload"
              />
              
              {resumeFile ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded">
                      <span className="text-green-600 text-lg">📄</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">{resumeFile.name}</p>
                      <p className="text-xs text-green-600">
                        {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveResume}
                    className="text-red-600 hover:text-red-800 text-sm font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer flex flex-col items-center justify-center py-4 text-center"
                >
                  <div className="text-3xl mb-2 text-gray-400">📄</div>
                  <p className="text-sm text-gray-600 mb-1">
                    Click to upload your resume
                  </p>
                  <p className="text-xs text-gray-500">PDF files only • Max 5MB</p>
                  <span className="text-xs text-blue-600 mt-2 font-medium">
                    Choose file
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Letter *
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Why are you interested in this position? What makes you a good fit? Mention your relevant skills and experience..."
              rows="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              required
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Tell them why you're the right candidate</span>
              <span className={coverLetter.length > 1000 ? 'text-red-500' : ''}>
                {coverLetter.length}/1000 characters
              </span>
            </div>
          </div>

          {/* Skills Match (Mock AI) */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2 flex items-center">
              <span className="text-lg mr-2">🎯</span>
              Skills Match Analysis
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800">
                  Based on common skills, you might be a good fit for this role
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Matching areas: {job.required_skills.slice(0, 3).join(', ')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">85%</div>
                <div className="text-xs text-blue-700">Match Score</div>
              </div>
            </div>
          </div>

          {/* Application Tips */}
          <div className="bg-gray-50 p-3 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <span className="text-lg mr-2">💡</span>
              Application Tips
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Customize your cover letter for this specific role</li>
              <li>• Highlight relevant experience and skills</li>
              <li>• Keep it professional and concise</li>
              <li>• Proofread before submitting</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !coverLetter.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationDialog;