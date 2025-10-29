import pdf from 'pdf-parse/lib/pdf-parse';

// Common tech skills database
const TECH_SKILLS = [
  // Programming Languages
  'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust', 'kotlin', 'swift',
  'php', 'ruby', 'scala', 'r', 'matlab', 'perl', 'haskell', 'elixir',
  
  // Frontend
  'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt.js', 'html', 'css', 'sass', 'less',
  'bootstrap', 'tailwind', 'material-ui', 'chakra-ui',
  
  // Backend
  'node.js', 'express', 'django', 'flask', 'fastapi', 'spring', 'laravel', 'ruby on rails',
  'asp.net', 'graphql', 'rest api', 'microservices',
  
  // Databases
  'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'cassandra', 'dynamodb',
  'firebase', 'supabase',
  
  // Cloud & DevOps
  'aws', 'azure', 'google cloud', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins',
  'gitlab', 'github actions', 'ci/cd', 'linux', 'nginx', 'apache',
  
  // Mobile
  'react native', 'flutter', 'android', 'ios', 'swiftui', 'jetpack compose',
  
  // Data Science
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn',
  'data analysis', 'data visualization', 'tableau', 'power bi',
  
  // Tools
  'git', 'jira', 'confluence', 'figma', 'photoshop', 'illustrator', 'sketch',
  
  // Methodologies
  'agile', 'scrum', 'kanban', 'tdd', 'bdd', 'devops', 'ci/cd'
];

export const extractSkillsFromPDF = async (file) => {
  try {
    // Read PDF file
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    // Parse PDF
    const pdfData = await pdf(data);
    const text = pdfData.text.toLowerCase();
    
    // Extract skills
    const foundSkills = TECH_SKILLS.filter(skill => {
      const skillLower = skill.toLowerCase();
      
      // Exact word match (handles word boundaries)
      const regex = new RegExp(`\\b${skillLower}\\b`, 'i');
      return regex.test(text);
    });
    
    // Remove duplicates and return
    return [...new Set(foundSkills)].map(skill => 
      skill.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    );
    
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
};

// Fallback: Extract from filename if PDF parsing fails
export const extractSkillsFromFileName = (filename) => {
  const skillsMap = {
    'frontend': ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript', 'Redux'],
    'backend': ['Python', 'Node.js', 'Java', 'Spring', 'SQL', 'REST API'],
    'fullstack': ['React', 'Node.js', 'Python', 'MongoDB', 'AWS', 'Docker'],
    'devops': ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD', 'Terraform'],
    'data': ['Python', 'SQL', 'Machine Learning', 'Pandas', 'Statistics', 'TensorFlow'],
    'mobile': ['React Native', 'Flutter', 'Android', 'iOS', 'Swift', 'Kotlin']
  };
  
  const filenameLower = filename.toLowerCase();
  let extractedSkills = [];
  
  // Check for keywords in filename
  Object.entries(skillsMap).forEach(([keyword, skills]) => {
    if (filenameLower.includes(keyword)) {
      extractedSkills = [...extractedSkills, ...skills];
    }
  });
  
  // Add some common skills if no specific match
  if (extractedSkills.length === 0) {
    const commonSkills = ['Python', 'JavaScript', 'React', 'Node.js', 'AWS', 'Docker', 'SQL', 'Git'];
    extractedSkills = commonSkills.slice(0, 6);
  }
  
  return [...new Set(extractedSkills)];
};