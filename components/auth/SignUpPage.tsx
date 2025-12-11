import React, { useState, useContext } from 'react';
import { View } from '../../App';
import { UserRole } from '../../types';
import AuthLayout from './AuthLayout';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, TeacherIcon, StudentIcon, AdminIcon } from '../icons/Icons';
import { AuthContext } from '../../contexts/AuthContext';
import { useCurriculum } from '../../hooks/useCurriculum';

interface SignUpPageProps {
  setView: (view: View) => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ setView }) => {
  // --- State ---
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [gradeLevel, setGradeLevel] = useState(''); // Student Grade
  const [region, setRegion] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]); // Teacher Grades
  const [gradeStreams, setGradeStreams] = useState<Record<string, string>>({});
  const [blockingGrade, setBlockingGrade] = useState<string | null>(null);
  // Fetch dynamic data
  const { regions, gradeLevels, streams, loading: curriculumLoading } = useCurriculum();
  const [studentStream, setStudentStream] = useState<string>('');

  // New Demographics State
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [age, setAge] = useState<string>(''); // string input for Age

  const { signup, error: apiError, isLoading } = useContext(AuthContext);

  // --- Handlers ---

  const handleNext = () => {
    setLocalError(null);
    if (!validateStep(step)) return;
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
        setLocalError('Please fill in all fields.');
        return false;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return false;
      }
    }
    if (currentStep === 2) {
      const mobileRegex = /^\+251[0-9]{9}$/;
      if (mobileNumber && !mobileRegex.test(mobileNumber)) {
        setLocalError('Invalid mobile number. Format: 911223344');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Final Validation (Academic Step)
    // Final Validation (Academic Step)
    if (!gender) {
      setLocalError('Please select your gender.');
      return;
    }
    if (!age || parseInt(age) < 5 || parseInt(age) > 100) {
      setLocalError('Please enter a valid age (5-100).');
      return;
    }

    let finalGradeLevel = '';
    let finalStream = '';

    if (role === 'Student') {
      if (!gradeLevel) {
        setLocalError('Please select a grade level.');
        return;
      }
      finalGradeLevel = gradeLevel;

      if ((gradeLevel === 'Grade 11' || gradeLevel === 'Grade 12') && !studentStream) {
        setLocalError('Please select a stream (Natural or Social Science).');
        return;
      }
      finalStream = studentStream;

    } else if (role === 'Teacher') {
      if (selectedGrades.length === 0) {
        setLocalError('Please select at least one grade level.');
        return;
      }
      if (blockingGrade) {
        setLocalError(`Please select a stream for ${blockingGrade}.`);
        return;
      }

      finalGradeLevel = selectedGrades.map(g => {
        if ((g === 'Grade 11' || g === 'Grade 12') && gradeStreams[g]) {
          return `${g} (${gradeStreams[g]})`;
        }
        return g;
      }).join(',');

      // Naive stream logic (Take first stream found)
      const sValues = Object.values(gradeStreams);
      if (sValues.length > 0) {
        let s = sValues[0];
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
        stream: (finalStream === 'Natural Science' ? 'Natural' : (finalStream === 'Social Science' ? 'Social' : finalStream)) as any,
        gender,
        age: parseInt(age)
      });
    } catch (err) {
      console.error("Signup failed:", err);
    }
  };

  // Reused Logic
  const handleGradeSelection = (grade: string) => {
    if (role === 'Student') {
      setGradeLevel(grade);
      if (grade !== 'Grade 11' && grade !== 'Grade 12') {
        setStudentStream('');
      }
    } else {
      if (blockingGrade && blockingGrade !== grade) return;

      let newSelectedGrades;
      if (selectedGrades.includes(grade)) {
        newSelectedGrades = selectedGrades.filter(g => g !== grade);
        if (grade === blockingGrade) setBlockingGrade(null);
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
        if (val) setBlockingGrade(null);
      }
    }
  };


  const error = localError || apiError;

  return (
    <AuthLayout
      title="Create Account"
      subtitle={`Step ${step} of ${totalSteps}: ${step === 1 ? 'Basic Info' : step === 2 ? 'Profile Details' : 'Academic Info'}`}
      setView={setView}
    >
      <div className="w-full">
        {/* Stepper Progress */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full -z-10"></div>
          <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary rounded-full -z-10 transition-all duration-500`} style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}></div>

          {[1, 2, 3].map(s => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${s <= step ? 'bg-primary text-white shadow-lg scale-110' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
              {s < step ? <CheckCircleIcon className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 min-h-[300px]">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 text-center animate-pulse">
              {error}
            </div>
          )}

          {/* --- STEP 1: Basic Info --- */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
                  <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary dark:text-white" placeholder="First Name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                  <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary dark:text-white" placeholder="Last Name" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary dark:text-white" placeholder="username" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary dark:text-white" placeholder="email@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary dark:text-white" placeholder="••••••" />
                  <button type="button" className="absolute bottom-3 right-3 text-gray-500" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm</label>
                  <input type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary dark:text-white" placeholder="••••••" />
                  <button type="button" className="absolute bottom-3 right-3 text-gray-500" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- STEP 2: Profile Details --- */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">I am a...</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['Student', 'Teacher', 'Parent', 'Admin'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r);
                        setGradeLevel('');
                        setSelectedGrades([]);
                        setBlockingGrade(null);
                        setGradeStreams({});
                        setStudentStream('');
                      }}
                      className={`
                                        p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                                        ${role === r
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-500 hover:border-gray-300'
                        }
                                    `}
                    >
                      {/* Icon Placeholder */}
                      <div className={`p-2 rounded-full ${role === r ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                        {r === 'Student' && <StudentIcon className="w-6 h-6" />}
                        {r === 'Teacher' && <TeacherIcon className="w-6 h-6" />}
                        {r === 'Parent' && <AdminIcon className="w-6 h-6" />}
                        {r === 'Admin' && <AdminIcon className="w-6 h-6" />}
                      </div>
                      <span className="font-bold text-sm">{r}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Region</label>
                  <select disabled={curriculumLoading} value={region} onChange={e => setRegion(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary dark:text-white disabled:opacity-50">
                    <option value="">{curriculumLoading ? 'Loading Regions...' : 'Select Region'}</option>
                    {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mobile Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 text-gray-500 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300 font-mono">+251</span>
                    <input
                      type="text"
                      placeholder="911223344"
                      value={mobileNumber ? mobileNumber.replace('+251', '') : ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setMobileNumber(`+251${val}`);
                      }}
                      maxLength={9}
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-r-xl focus:ring-2 focus:ring-primary dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- STEP 3: Academic Details --- */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Role Specific Title */}
              <h3 className="text-xl font-bold text-gray-800 dark:text-white text-center">
                {role === 'Student' ? 'Select Your Grade' : (role === 'Teacher' ? 'Select Grades Taught' : 'Complete Setup')}
              </h3>

              {/* Gender and Age Inputs */}
              <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender <span className="text-red-500">*</span></label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary dark:text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Age <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary dark:text-white"
                    placeholder="Age"
                  />
                </div>
              </div>

              {(role === 'Student' || role === 'Teacher') ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  {/* Grade Grid - Optimized for distribution */}
                  {curriculumLoading ? (
                    <div className="text-center py-6 text-gray-500">Loading grade levels...</div>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-3">
                      {gradeLevels.map((grade) => {
                        const isSelected = role === 'Student' ? gradeLevel === grade.name : selectedGrades.includes(grade.name);
                        const isBlocked = role === 'Teacher' && blockingGrade && blockingGrade !== grade.name && !isSelected;

                        return (
                          <div
                            key={grade.id}
                            onClick={() => !isBlocked && handleGradeSelection(grade.name)}
                            className={`
                                                    relative px-2 py-3 rounded-lg text-sm font-bold text-center cursor-pointer transition-all duration-200 border-2 w-[30%] flex-grow-0
                                                    ${isSelected
                                ? 'bg-primary text-white border-primary shadow-md transform scale-105 z-10'
                                : (isBlocked
                                  ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed opacity-50'
                                  : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-transparent hover:border-gray-300 hover:shadow-sm')
                              }
                                                `}
                          >
                            {grade.name}
                            {isSelected && <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-0.5"><CheckCircleIcon className="w-3 h-3 text-white" /></div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {gradeLevels.length === 0 && !curriculumLoading && <div className="text-center text-gray-500">No grades found.</div>}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="w-10 h-10 text-green-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">You are all set as a <span className="font-bold text-primary">{role}</span>!</p>
                  <p className="text-sm text-gray-500 mt-2">Click below to create your account.</p>
                </div>
              )}

              {/* Stream Selector Conditional */}
              {((role === 'Student' && (gradeLevel === 'Grade 11' || gradeLevel === 'Grade 12')) || (role === 'Teacher' && blockingGrade)) && (
                <div className="animate-fade-in-up p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                  <label className="block text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                    Select Stream {role === 'Teacher' ? `for ${blockingGrade}` : ''} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    {streams.map(s => (
                      <label key={s.id} className="flex-1 cursor-pointer">
                        <input
                          type="radio"
                          name="stream"
                          value={s.name}
                          checked={role === 'Student' ? studentStream === s.name : (blockingGrade ? gradeStreams[blockingGrade] === s.name : false)}
                          onChange={() => handleStreamChange(s.name)}
                          className="peer sr-only"
                        />
                        <div className="text-center p-3 rounded-lg border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary bg-white dark:bg-slate-800 font-medium transition-all shadow-sm">
                          {s.name}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- Navigation Buttons --- */}
          <div className="pt-6 flex gap-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Back
              </button>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg transition-transform active:scale-95"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-violet-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Finish & Sign Up'}
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button onClick={() => setView('login')} className="font-bold text-primary hover:text-primary-dark dark:text-primary-light transition-colors">
              Log in here
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SignUpPage;