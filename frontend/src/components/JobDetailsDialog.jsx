import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const JobDetailsDialog = ({ job, isOpen, onClose, onApplyClick, isApplied }) => {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
                  <p className="text-lg text-gray-600 mt-1">{job.company} • {job.location}</p>
                </div>
                {isApplied && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    ✓ Applied
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {job.employment_type}
                </span>
                {job.salary_range && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {job.salary_range}
                  </span>
                )}
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl ml-4"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Job Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>
          </div>

          {/* Required Skills */}
          {job.required_skills && job.required_skills.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Company Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">About {job.company}</h3>
            <p className="text-gray-600">
              We are looking for talented individuals to join our team and help us build amazing products.
              This position offers great opportunities for growth and learning in a dynamic environment.
            </p>
          </div>

          {/* Application Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">50+</div>
              <div className="text-sm text-blue-700">Applicants</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">3</div>
              <div className="text-sm text-green-700">Days Left</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">85%</div>
              <div className="text-sm text-purple-700">Match Score</div>
            </div>
          </div>
        </div>

        {/* Footer with Apply Button */}
        <div className="border-t px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            
            {!isApplied ? (
              <button
                onClick={() => onApplyClick(job)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold"
              >
                Apply Now
              </button>
            ) : (
              <div className="flex items-center text-green-600 font-semibold">
                <span className="text-2xl mr-2">✓</span>
                Already Applied
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsDialog;