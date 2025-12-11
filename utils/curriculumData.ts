export const GRADE_LEVELS = [
  'KG',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

export const STREAMS = ['Natural Science', 'Social Science'];

export const SUBJECTS_DATA: Record<string, string[]> = {
  // Kindergarten
  'KG': [
    'Developing Literacy',
    'Developing Numeracy',
    'My Environment',
    'Relating with Others',
    'Taking Care of Myself',
  ],

  // Grades 1-4
  'Grade 1': ['Amharic', 'Mother Tongue', 'English', 'Mathematics', 'Environmental Science', 'Arts and Physical Education'],
  'Grade 2': ['Amharic', 'Mother Tongue', 'English', 'Mathematics', 'Environmental Science', 'Arts and Physical Education'],
  'Grade 3': ['Amharic', 'Mother Tongue', 'English', 'Mathematics', 'Environmental Science', 'Arts and Physical Education'],
  'Grade 4': ['Amharic', 'Mother Tongue', 'English', 'Mathematics', 'Environmental Science', 'Arts and Physical Education'],

  // Grades 5-6
  'Grade 5': [
    'Amharic',
    'Mother Tongue',
    'English',
    'Mathematics',
    'Integrated Science',
    'Civics and Ethical Education',
    'Visual Arts and Music',
    'Physical Education',
  ],
  'Grade 6': [
    'Amharic',
    'Mother Tongue',
    'English',
    'Mathematics',
    'Integrated Science',
    'Civics and Ethical Education',
    'Visual Arts and Music',
    'Physical Education',
  ],

  // Grades 7-8
  'Grade 7': [
    'Amharic',
    'Mother Tongue',
    'English',
    'Mathematics',
    'Biology',
    'Chemistry',
    'Physics',
    'Social Studies',
    'Civics and Ethical Education',
    'Visual Arts and Music',
    'Physical Education',
  ],
  'Grade 8': [
    'Amharic',
    'Mother Tongue',
    'English',
    'Mathematics',
    'Biology',
    'Chemistry',
    'Physics',
    'Social Studies',
    'Civics and Ethical Education',
    'Visual Arts and Music',
    'Physical Education',
  ],

  // Grades 9-10
  'Grade 9': [
    'Amharic',
    'English',
    'Mathematics',
    'Information Technology',
    'Biology',
    'Chemistry',
    'Physics',
    'Geography',
    'History',
    'Civics and Ethical Education',
    'Physical Education',
  ],
  'Grade 10': [
    'Amharic',
    'English',
    'Mathematics',
    'Information Technology',
    'Biology',
    'Chemistry',
    'Physics',
    'Geography',
    'History',
    'Civics and Ethical Education',
    'Physical Education',
  ],
};

// Stream-specific subjects for Grades 11-12
export const STREAM_SUBJECTS: Record<string, Record<string, string[]>> = {
  'Natural Science': {
    'Grade 11': [
      'English',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Technical Drawing',
      'Information Technology',
      'Civics and Ethical Education',
      'Physical Education',
      'National Language/Mother Tongue',
    ],
    'Grade 12': [
      'English',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Technical Drawing',
      'Information Technology',
      'Civics and Ethical Education',
      'Physical Education',
      'National Language/Mother Tongue',
    ],
  },
  'Social Science': {
    'Grade 11': [
      'English',
      'Mathematics',
      'Geography',
      'History',
      'Economics',
      'General Business',
      'Information Technology',
      'Civics and Ethical Education',
      'Physical Education',
      'National Language/Mother Tongue',
    ],
    'Grade 12': [
      'English',
      'Mathematics',
      'Geography',
      'History',
      'Economics',
      'General Business',
      'Information Technology',
      'Civics and Ethical Education',
      'Physical Education',
      'National Language/Mother Tongue',
    ],
  },
};

/**
 * Helper function to get subjects for a specific grade and stream.
 * @param gradeLevel - The grade level (e.g., "Grade 9", "KG")
 * @param stream - The stream (optional, required for Grade 11-12)
 * @returns Array of subject names
 */
export const getSubjectsForGrade = (gradeLevel: string, stream?: string): string[] => {
  if (!gradeLevel) return [];

  // Handle Grades 11-12 which require a stream
  if (gradeLevel === 'Grade 11' || gradeLevel === 'Grade 12') {
    if (!stream || !STREAM_SUBJECTS[stream]) {
      return []; // Return empty if stream is missing or invalid for these grades
    }
    return STREAM_SUBJECTS[stream][gradeLevel] || [];
  }

  // Handle other grades
  return SUBJECTS_DATA[gradeLevel] || [];
};

export const isNonEnglishSubject = (subject: string): boolean => {
  const NON_ENGLISH_SUBJECTS = [
    'Amharic',
    'Afan Oromo',
    'Tigrinya',
    'Somali',
    'Sidama',
    'Wolaytta',
    'Hadiya',
    'Gamo',
    'Gedeo',
    'Kafa',
    'Bench',
    'Sheko',
    'Dawro',
    'Basketo',
    'Kontta',
    'Melo',
    'Gofa',
    'Burji',
    'Konso',
    'Dirashe',
    'Amarigna',
    'Oromigna',
    'Tigrigna',
    'Somaligna',
  ];
  return NON_ENGLISH_SUBJECTS.some(lang =>
    subject.toLowerCase().includes(lang.toLowerCase()) ||
    subject.startsWith('Barnoota') ||
    subject.startsWith('Herrega') ||
    subject.startsWith('Saayinsii') ||
    subject.startsWith('Afaan')
  );
};


