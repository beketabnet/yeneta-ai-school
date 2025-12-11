import React, { useState, useContext } from 'react';
import { View } from '../../App';
import { UserRole } from '../../types';

// --- MOCK DEPENDENCIES FOR SINGLE-FILE EXECUTION ---
// 
// 1. Mock AuthLayout: Provides the centered card container structure.
const AuthLayout: React.FC<{ title: string; setView: (view: View) => void; children: React.ReactNode }> = ({ title, setView, children }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
                <span className="text-4xl font-extrabold text-primary dark:text-primary-light">YENETA</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
            <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
                {children}
            </div>
        </div>
    </div>
);

// 2. Mock useCurriculum: Provides necessary data lists (regions, grades, streams).
const mockRegions = [{ name: 'Addis Ababa', id: 'AA' }, { name: 'Oromia', id: 'OR' }, { name: 'Tigray', id: 'TI' }];
const mockGradeLevels = Array.from({ length: 12 }, (_, i) => ({ id: `G${i + 1}`, name: `Grade ${i + 1}` }));
const mockStreams = [{ name: 'Natural Science', id: 'NS' }, { name: 'Social Science', id: 'SS' }];
const useCurriculum = () => ({
    regions: mockRegions,
    gradeLevels: mockGradeLevels,
    streams: mockStreams,
});

// 3. Mock AuthContext: Provides required context functions and state.
const mockAuthContext = {
    signup: async (data: any) => { 
        console.log('Mock signup called with:', data); 
        // Simulate a delay for loading state
        return new Promise(resolve => setTimeout(resolve, 1500));
    },
    error: null,
    isLoading: false,
};
const AuthContext = React.createContext(mockAuthContext as any); // Use as 'any' to match expected usage
// ----------------------------------------------------------------


// Basic SVG icons for password visibility (assuming they are not available in this scope)
const EyeIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeSlashIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 1.626 0 3.208.384 4.675 1.137M12 21V3m0 0v18" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L19 18m-2.343-9.343L19 5M3 3l18 18" /></svg>);

// Simple wrappers for role icons used in the new segmented control
const RoleIcon = ({ role }: { role: UserRole }) => {
    switch (role) {
        case 'Teacher':
            // Teacher icon (similar to graduation cap/board)
            return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>;
        case 'Student':
            // Student/Learning icon (similar to book/person)
            return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
        case 'Parent':
            // Parent/Family icon (home or group)
            return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>;
        case 'Admin':
            // Admin/Analytics icon (chart)
            return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
        default:
            return null;
    }
};


interface SignUpPageProps {
  setView: (view: View) => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [gradeLevel, setGradeLevel] = useState('');
  const [region, setRegion] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setConfirmPasswordVisible] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [gradeStreams, setGradeStreams] = useState<Record<string, string>>({});
  const [blockingGrade, setBlockingGrade] = useState<string | null>(null);
  
  // Use MOCKED hook
  const { regions, gradeLevels, streams } = useCurriculum();
  const [studentStream, setStudentStream] = useState<string>('');

  // Use MOCKED context
  const { signup, error: apiError, isLoading: contextIsLoading } = useContext(AuthContext);
  // Separate loading state for form submission delay simulation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = contextIsLoading || isSubmitting;


  const ALL_ROLES: UserRole[] = ['Student', 'Teacher', 'Parent', 'Admin'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    const mobileRegex = /^\+251[0-9]{9}$/;
    if (mobileNumber && !mobileRegex.test(mobileNumber)) {
      setLocalError('Invalid mobile number. Must start with +251 followed by 9 digits.');
      setIsSubmitting(false);
      return;
    }

    let finalGradeLevel = '';
    let finalStream = '';

    if (role === 'Student') {
      if (!gradeLevel) {
        setLocalError('Please select a grade level.');
        setIsSubmitting(false);
        return;
      }
      finalGradeLevel = gradeLevel;

      if ((gradeLevel === 'Grade 11' || gradeLevel === 'Grade 12') && !studentStream) {
        setLocalError('Please select a stream (Natural or Social Science).');
        setIsSubmitting(false);
        return;
      }
      finalStream = studentStream;

    } else if (role === 'Teacher') {
      if (selectedGrades.length === 0) {
        setLocalError('Please select at least one grade level.');
        setIsSubmitting(false);
        return;
      }

      if (blockingGrade) {
        setLocalError(`Please select a stream for ${blockingGrade} before proceeding.`);
        setIsSubmitting(false);
        return;
      }

      finalGradeLevel = selectedGrades.map(g => {
        if ((g === 'Grade 11' || g === 'Grade 12') && gradeStreams[g]) {
          return `${g} (${gradeStreams[g]})`;
        }
        return g;
      }).join(',');

      const streams = Object.values(gradeStreams);
      if (streams.length > 0) {
        let s = streams[0];
        if (s === 'Natural Science') s = 'Natural';
        if (s === 'Social Science') s = 'Social';
        finalStream = s;
      }
    }

    try {
      await signup({
        email,
        username,
        password,
        role,
        gradeLevel: finalGradeLevel,
        firstName,
        lastName,
        region: region || undefined,
        mobileNumber: mobileNumber || undefined,
        // The cast to 'any' is necessary due to the mock context typing.
        stream: (finalStream === 'Natural Science' ? 'Natural' : (finalStream === 'Social Science' ? 'Social' : finalStream)) as any
      });
      // In a real app, successful signup navigates the user.
      // We simulate success by navigating to login after mock call.
      setView('login');
    } catch (err) {
      console.error("Signup failed:", err);
      // Actual API error handled by context, but ensure submission state resets
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleGradeSelection = (grade: string) => {
    if (role === 'Student') {
      setGradeLevel(grade);
      if (grade !== 'Grade 11' && grade !== 'Grade 12') {
        setStudentStream('');
      }
    } else {
      // Teacher Logic
      if (blockingGrade && blockingGrade !== grade) {
        return;
      }

      let newSelectedGrades;
      if (selectedGrades.includes(grade)) {
        newSelectedGrades = selectedGrades.filter(g => g !== grade);

        if (grade === blockingGrade) {
          setBlockingGrade(null);
        }

        const newStreams = { ...gradeStreams };
        delete newStreams[grade];
        setGradeStreams(newStreams);

      } else {
        newSelectedGrades = [...selectedGrades, grade];

        if (grade === 'Grade 11' || grade === 'Grade 12') {
          setBlockingGrade(grade);
        }
      }
      setSelectedGrades(newSelectedGrades);
    }
  };

  const handleStreamChange = (val: string) => {
    if (role === 'Student') {
      setStudentStream(val);
    } else {
      if (blockingGrade) {
        setGradeStreams({ ...gradeStreams, [blockingGrade]: val });
        if (val) {
          setBlockingGrade(null);
        }
      }
    }
  };
  
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setGradeLevel('');
    setSelectedGrades([]);
    setBlockingGrade(null);
    setGradeStreams({});
    setStudentStream('');
  };

  const error = localError || apiError;

  // Custom Input Component for consistent modern styling
  const ModernInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, containerClassName?: string }> = ({ label, id, containerClassName = '', ...props }) => (
    <div className={containerClassName}>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        id={id}
        className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl shadow-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150"
        {...props}
      />
    </div>
  );

  // Custom Select Component for consistent modern styling
  const ModernSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, options: { value: string, label: string }[] }> = ({ label, id, options, ...props }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {/* Increased padding and added appearance-none to better style the select */}
      <select
        id={id}
        className="mt-1 block w-full pl-4 pr-10 py-2.5 border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm rounded-xl shadow-sm bg-white dark:bg-slate-700 dark:text-white appearance-none transition duration-150"
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );


  return (
    // AuthLayout provides the centered container. Updated the internal form structure.
    <AuthLayout title="Create Your Yeneta Account" setView={setView}>
      <form className="space-y-8" onSubmit={handleSubmit}>
        
        {/* Error Message Box */}
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/50 border border-red-500/50 rounded-xl text-sm text-red-700 dark:text-red-300 text-center font-medium shadow-md">
            {error}
          </div>
        )}

        {/* SECTION 1: Role Selection - Visual Segmented Control */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-3">1. Who are you?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ALL_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`
                  p-4 rounded-xl text-center shadow-md transition-all duration-200
                  ${role === r
                    ? 'bg-primary text-white ring-2 ring-offset-2 ring-primary dark:ring-offset-slate-800 transform scale-[1.02]'
                    : 'bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600'
                  }
                `}
              >
                <div className="flex flex-col items-center">
                    <RoleIcon role={r} />
                    <span className="mt-2 text-sm font-medium">{r}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 2: Personal Information */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-3">2. Personal Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ModernInput label="First Name" id="firstName" name="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <ModernInput label="Last Name" id="lastName" name="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>

          <ModernInput label="Username" id="username" name="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} />

          {/* Region Selector (Optional initially) */}
          <ModernSelect
            label="Region (Optional)"
            id="region"
            name="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            options={[
              { value: "", label: "Select Region" },
              ...regions.map(r => ({ value: r.name, label: r.name }))
            ]}
          />
          
          {/* Mobile Number Input */}
          <div>
            <label htmlFor="mobileNumber" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
            <div className="mt-1 flex rounded-xl shadow-sm">
              {/* Country Code Prefix */}
              <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-600 text-gray-500 dark:text-gray-300 sm:text-sm font-medium">
                +251
              </span>
              <input
                type="text"
                name="mobileNumber"
                id="mobileNumber"
                className="flex-1 min-w-0 block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-r-xl focus:ring-primary focus:border-primary sm:text-sm dark:bg-slate-700 dark:text-white"
                placeholder="911223344"
                value={mobileNumber ? mobileNumber.replace('+251', '') : ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setMobileNumber(`+251${val}`);
                }}
                maxLength={9}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter 9 digits starting with 9 (e.g., 911223344)</p>
          </div>
        </div>

        {/* SECTION 3: Credentials */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-3">3. Credentials</h2>
          <ModernInput label="Email address" id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div className="mt-1 relative rounded-xl shadow-sm">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150" />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
            <div className="mt-1 relative rounded-xl shadow-sm">
              <input id="confirm-password" name="confirm-password" type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150" />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                onClick={() => setConfirmPasswordVisible(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
        </div>


        {/* SECTION 4: Educational Context (Conditional) */}
        {(role === 'Student' || role === 'Teacher') && (
          <div className="space-y-4 pt-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-3">4. Educational Context</h2>
            
            {/* Grade Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {role === 'Student' ? 'Select your Grade Level' : 'Select Grade Levels you Teach'}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/50 custom-scrollbar shadow-inner">
                {gradeLevels.map(grade => {
                    const isSelected = role === 'Student' ? gradeLevel === grade.name : selectedGrades.includes(grade.name);
                    const isBlocking = role === 'Teacher' && blockingGrade && blockingGrade !== grade.name;

                    return (
                        <button
                            key={grade.id}
                            type="button"
                            onClick={() => handleGradeSelection(grade.name)}
                            disabled={isBlocking}
                            className={`
                                cursor-pointer px-2 py-1.5 text-xs font-medium rounded-lg text-center transition-all duration-150 whitespace-nowrap
                                ${isSelected
                                    ? 'bg-primary text-white shadow-md ring-2 ring-primary/50'
                                    : (isBlocking
                                        ? 'opacity-60 cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-slate-700/80 dark:text-gray-400'
                                        : 'bg-white text-gray-700 dark:bg-slate-700 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 hover:border-primary')
                                }
                            `}
                        >
                            {grade.name}
                        </button>
                    );
                })}
              </div>
              {role === 'Teacher' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select all that apply. {blockingGrade && <span className="text-red-500 font-medium">Stream selection required for {blockingGrade}.</span>}</p>
              )}
            </div>

            {/* Stream Selection */}
            {((role === 'Student' && (gradeLevel === 'Grade 11' || gradeLevel === 'Grade 12')) ||
              (role === 'Teacher' && blockingGrade)) && (
                <ModernSelect
                    label={`Stream ${role === 'Teacher' ? `for ${blockingGrade}` : ''}`}
                    id="stream"
                    name="stream"
                    value={role === 'Student' ? studentStream : (blockingGrade ? gradeStreams[blockingGrade] || '' : '')}
                    onChange={(e) => handleStreamChange(e.target.value)}
                    options={[
                      { value: "", label: "Select Stream" },
                      ...streams.map(s => ({ value: s.name, label: s.name }))
                    ]}
                />
              )}
          </div>
        )}
        
        {role === 'Teacher' && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic pt-2">Note: You can upload your CV/Certificates later in your personalized dashboard.</p>
        )}

        {/* Submit Button */}
        <div className="pt-6">
          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-full shadow-lg text-lg font-bold text-white bg-primary hover:bg-primary-dark transition-all duration-300 disabled:bg-gray-400 disabled:shadow-none transform hover:-translate-y-0.5"
          >
            {isLoading ? (
              // Loading spinner
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Create Account'}
          </button>
        </div>
      </form>
      
      {/* Footer link */}
      <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <button onClick={() => setView('login')} className="font-semibold text-primary hover:text-primary-dark dark:text-primary-light transition-colors">
          Log in here
        </button>
      </p>
    </AuthLayout>
  );
};

export default SignUpPage;