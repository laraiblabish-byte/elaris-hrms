// ==============================================================================
// ELARIS SOLUTIONS - PREDEFINED DEPARTMENTS & RELEVANT DESIGNATIONS
// ==============================================================================

export const PREDEFINED_DEPARTMENTS = [
  { name: 'HR', description: 'Human resources management, talent acquisition, and personnel operations' },
  { name: 'Software Development', description: 'Core software engineering, architecture, and backend systems' },
  { name: 'Web Development', description: 'Full-stack web application development and cloud interfaces' },
  { name: 'Mobile App Development', description: 'Native iOS, Android, and cross-platform mobile solutions' },
  { name: 'AI & Machine Learning', description: 'Artificial intelligence, LLM systems, computer vision, and predictive models' },
  { name: 'UI/UX Design', description: 'User interface, user experience, product design, and prototyping' },
  { name: 'Quality Assurance', description: 'Software testing, automation testing, and quality engineering' },
  { name: 'Finance & Accounts', description: 'Financial accounting, payroll administration, budgeting, and audits' },
  { name: 'Marketing', description: 'Digital marketing, SEO, content strategy, brand growth, and communications' },
  { name: 'Sales', description: 'Business development, client relationships, and enterprise sales' },
  { name: 'IT Support', description: 'Internal infrastructure, network security, and technical helpdesk' },
  { name: 'Administration', description: 'Office operations, facility management, and executive coordination' },
  { name: 'Customer Support', description: 'Client success, technical customer support, and issue resolution' },
  { name: 'Project Management', description: 'Agile project delivery, scrum leadership, and sprint coordination' },
];

export const DEPARTMENT_DESIGNATIONS = {
  'HR': [
    'HR Manager',
    'HR Officer',
    'Talent Acquisition Specialist',
    'HR Generalist',
    'HR Coordinator',
    'People & Culture Lead',
  ],
  'Software Development': [
    'Lead Software Architect',
    'Principal Software Engineer',
    'Senior Software Engineer',
    'Software Engineer',
    'Junior Software Engineer',
    'Backend Developer',
    'DevOps Engineer',
    'Cloud Systems Engineer',
  ],
  'Web Development': [
    'Lead Full Stack Developer',
    'Senior Full Stack Developer',
    'Full Stack Developer',
    'Senior Frontend Developer',
    'Frontend Developer',
    'Senior Backend Developer',
    'Backend Developer',
    'Web Application Specialist',
  ],
  'Mobile App Development': [
    'Lead Mobile Developer',
    'Senior iOS Developer',
    'iOS Developer',
    'Senior Android Developer',
    'Android Developer',
    'React Native Developer',
    'Flutter Developer',
  ],
  'AI & Machine Learning': [
    'Lead AI Engineer',
    'AI Engineer',
    'Machine Learning Engineer',
    'Senior Data Scientist',
    'Data Scientist',
    'Computer Vision Engineer',
    'NLP Specialist',
    'Prompt & Model Engineer',
  ],
  'UI/UX Design': [
    'Lead Product Designer',
    'Senior UI/UX Designer',
    'UI/UX Designer',
    'Product Designer',
    'Visual Designer',
    'Interaction Designer',
    'Design System Lead',
  ],
  'Quality Assurance': [
    'QA Lead',
    'Senior QA Automation Engineer',
    'QA Automation Engineer',
    'Senior QA Engineer',
    'QA Engineer',
    'Manual QA Tester',
    'Security QA Specialist',
  ],
  'Finance & Accounts': [
    'Finance Manager',
    'Senior Accountant',
    'Accountant',
    'Payroll Specialist',
    'Accounts Officer',
    'Financial Analyst',
    'Audit Associate',
  ],
  'Marketing': [
    'Marketing Director',
    'Digital Marketer',
    'Senior SEO Specialist',
    'Content Marketing Lead',
    'Social Media Manager',
    'Growth Marketer',
    'Email Marketing Specialist',
  ],
  'Sales': [
    'Sales Director',
    'Business Development Manager',
    'Senior Sales Executive',
    'Sales Executive',
    'Account Executive',
    'Technical Sales Representative',
  ],
  'IT Support': [
    'IT Support Manager',
    'Senior Systems Administrator',
    'Network Engineer',
    'IT Support Specialist',
    'Cybersecurity Analyst',
    'Desktop Support Technician',
  ],
  'Administration': [
    'Operations Director',
    'Administrative Officer',
    'Office Administrator',
    'Operations Coordinator',
    'Executive Assistant',
  ],
  'Customer Support': [
    'Customer Support Lead',
    'Customer Success Manager',
    'Senior Support Representative',
    'Customer Support Representative',
    'Technical Support Specialist',
  ],
  'Project Management': [
    'Director of Project Management',
    'Technical Project Manager',
    'Senior Scrum Master',
    'Scrum Master',
    'Product Owner',
    'Project Coordinator',
    'Agile Delivery Manager',
  ],
};

// Flattened list of all designations for search / general fallback
export const ALL_DESIGNATIONS = Array.from(
  new Set(Object.values(DEPARTMENT_DESIGNATIONS).flat())
);

// Helper to get designations dynamically for any department
export const getDesignationsForDepartment = (deptName) => {
  if (!deptName) return ALL_DESIGNATIONS;

  const foundKey = Object.keys(DEPARTMENT_DESIGNATIONS).find(
    (k) => k.toLowerCase() === deptName.trim().toLowerCase()
  );
  if (foundKey) return DEPARTMENT_DESIGNATIONS[foundKey];

  // Try partial match
  const partialKey = Object.keys(DEPARTMENT_DESIGNATIONS).find(
    (k) =>
      deptName.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(deptName.toLowerCase())
  );
  if (partialKey) return DEPARTMENT_DESIGNATIONS[partialKey];

  return ALL_DESIGNATIONS;
};

