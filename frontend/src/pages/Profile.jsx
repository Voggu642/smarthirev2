import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useResumes } from '../contexts/ResumeContext';

const Profile = () => {
  const { user } = useAuth();
  const { resumes, primaryResume, userSkills, loading, setAsPrimary, deleteResume, addResume, refreshResumes } = useResumes();
  const [uploading, setUploading] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.id || "temp_user_id");

      const response = await fetch('http://localhost:8000/api/resumes/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      const newResume = {
        id: result.resume.id,
        filename: file.name,
        extracted_skills: result.resume.extracted_skills,
        uploaded_at: result.resume.uploaded_at,
        file_size: `${(file.size / 1024).toFixed(0)} KB`
      };
      
      addResume(newResume);
      alert(`✅ Resume uploaded successfully! Found ${result.skills_found} skills.`);
      
    } catch (error) {
      console.error('UPLOAD ERROR:', error);
      alert(`❌ Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const addSkill = async (skill) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !userSkills.includes(trimmedSkill)) {
      try {
        const response = await fetch(`/api/user/profile/${user.id}/skills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skill: trimmedSkill })
        });

        if (response.ok) {
          // Refresh to get updated skills
          refreshResumes();
        }
      } catch (error) {
        console.error('Error adding skill:', error);
      }
    }
  };

  const removeSkill = async (skillToRemove) => {
    try {
      const response = await fetch(`/api/user/profile/${user.id}/skills`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: skillToRemove })
      });

      if (response.ok) {
        // Refresh to get updated skills
        refreshResumes();
      }
    } catch (error) {
      console.error('Error removing skill:', error);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    const success = await deleteResume(resumeId);
    if (success) {
      alert('Resume deleted successfully');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
            <p className="text-gray-600">Manage your resumes, skills, and job matching preferences</p>
          </div>

          {/* Profile Overview */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
  <div className="bg-white rounded-xl shadow-sm border p-6">
    <div className="text-2xl font-bold text-blue-600 mb-2">{resumes.length}</div>
    <div className="text-sm text-gray-600">Resumes</div>
  </div>
  <div className="bg-white rounded-xl shadow-sm border p-6">
    <div className="text-2xl font-bold text-green-600 mb-2">{userSkills.length}</div>
    <div className="text-sm text-gray-600">Skills</div>
  </div>
  <div className="bg-white rounded-xl shadow-sm border p-6">
    <div className="text-2xl font-bold text-purple-600 mb-2">
      {resumes.length > 0 ? 'Ready' : 'None'}
    </div>
    <div className="text-sm text-gray-600">Job Matching</div>
  </div>
</div>

          {/* Upload New Resume */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload New Resume</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="resume-upload"
                disabled={uploading}
              />
              <label
                htmlFor="resume-upload"
                className={`cursor-pointer block ${uploading ? 'opacity-50' : ''}`}
              >
                <div className="text-4xl mb-4">📄</div>
                <p className="text-lg text-gray-600 mb-2">
                  {uploading ? 'Uploading and extracting skills...' : 'Click to upload your resume'}
                </p>
                <p className="text-sm text-gray-500 mb-4">PDF files only • Max 5MB</p>
                <div className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block hover:bg-blue-700 transition-colors">
                  {uploading ? 'Processing...' : 'Choose File'}
                </div>
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              💡 We'll automatically extract skills from your resume using AI-powered analysis.
            </p>
          </div>

          {/* Your Skills */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Skills</h2>
            <p className="text-gray-600 mb-4">
              Skills are automatically extracted from your primary resume. You can add or remove skills manually.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {userSkills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm flex items-center space-x-2"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSkill(skill)}
                    className="text-blue-600 hover:text-blue-800 text-lg"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add a skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addSkill(newSkill);
                    setNewSkill('');
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  addSkill(newSkill);
                  setNewSkill('');
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Add
              </button>
            </div>
          </div>
<div className="bg-white rounded-xl shadow-sm border p-6">
  <h2 className="text-xl font-semibold mb-4">Your Resumes</h2>
  
  {resumes.length === 0 ? (
    <div className="text-center py-8">
      <div className="text-4xl mb-2">📝</div>
      <p className="text-gray-600 mb-4">No resumes uploaded yet</p>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        Upload your first resume to start getting personalized job matches based on your skills.
      </p>
    </div>
  ) : (
    <div className="space-y-4">
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className="border-2 border-gray-200 rounded-xl p-5 bg-white"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">📄</span>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{resume.filename}</h3>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <span>Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{resume.file_size}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {resume.extracted_skills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2 ml-4">
              {resumes.length > 1 && (
                <button
                  onClick={() => handleDeleteResume(resume.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          
          {/* REMOVED: Primary resume indicator */}
        </div>
      ))}
    </div>
  )}
</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;