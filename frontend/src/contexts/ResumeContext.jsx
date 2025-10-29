import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ResumeContext = createContext();

export const useResumes = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResumes must be used within a ResumeProvider');
  }
  return context;
};

export const ResumeProvider = ({ children }) => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load resumes from backend
  const loadUserResumes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const resumesResponse = await fetch(`/api/resumes/user/${user.id}`);
      if (resumesResponse.ok) {
        const userResumes = await resumesResponse.json();
        setResumes(userResumes);
        
        // Just use skills from the first resume or combine all
        if (userResumes.length > 0) {
          const allSkills = [...new Set(userResumes.flatMap(r => r.extracted_skills || []))];
          setUserSkills(allSkills);
        } else {
          setUserSkills([]);
        }
      }
    } catch (error) {
      console.error('Failed to load resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete resume
  const deleteResume = async (resumeId) => {
    if (resumes.length <= 1) {
      alert('You need to keep at least one resume');
      return false;
    }
    
    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadUserResumes();
        return true;
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      setResumes(prevResumes => prevResumes.filter(r => r.id !== resumeId));
      return true;
    }
    return false;
  };

  // Add a new resume
  const addResume = (newResume) => {
    setResumes(prev => [newResume, ...prev]);
    // Update skills with new resume's skills
    setUserSkills(prev => [...new Set([...prev, ...newResume.extracted_skills])]);
  };

  // Load resumes when user changes
  useEffect(() => {
    if (user) {
      loadUserResumes();
    } else {
      setResumes([]);
      setUserSkills([]);
    }
  }, [user]);

  const value = {
    resumes,
    userSkills,
    loading,
    deleteResume,
    addResume,
    refreshResumes: loadUserResumes
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
};