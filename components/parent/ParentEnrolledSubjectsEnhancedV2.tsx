import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import VerticalSlider from '../common/VerticalSlider';
import { useParentEnrolledSubjectsAnalytics, FilterOptions } from '../../hooks/useParentEnrolledSubjectsAnalytics';
import { useNotification } from '../../contexts/NotificationContext';
import {
  UserGroupIcon,
  AcademicCapIcon,
  UserCircleIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  FunnelIcon,
  Bars3Icon,
  Squares2X2Icon,
  ListBulletIcon,
  SearchIcon,
  XMarkIcon
} from '../icons/Icons';

interface ParentEnrolledSubjectsEnhancedV2Props {
  selectedChildId?: number | null;
}

const ParentEnrolledSubjectsEnhancedV2: React.FC<ParentEnrolledSubjectsEnhancedV2Props> = ({ selectedChildId }) => {
  const { addNotification } = useNotification();
  const { families, summary, isLoading, error, refetch, applyFilters, getSortedSubjects } = useParentEnrolledSubjectsAnalytics();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'grade' | 'date' | 'trend'>('name');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [performanceLevel, setPerformanceLevel] = useState<string>('');

  // Sync with selectedChildId from dashboard
  useEffect(() => {
    if (families.length > 0) {
      if (selectedChildId) {
        for (const family of families) {
          const student = family.students.find(s => s.student_id === selectedChildId);
          if (student) {
            setSelectedFamily(family.family_id);
            setSelectedStudent(selectedChildId);
            return;
          }
        }
      } else {
        if (selectedFamily === null || selectedStudent === null) {
          setSelectedFamily(families[0].family_id);
          if (families[0].students.length > 0) {
            setSelectedStudent(families[0].students[0].student_id);
          }
        }
      }
    }
  }, [selectedChildId, families]);

  useEffect(() => {
    if (selectedChildId) {
      setSelectedStudent(selectedChildId);
    } else {
      setSelectedStudent(null);
    }
  }, [selectedChildId]);


  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      addNotification('Enrolled subjects refreshed', 'success');
    } catch (err) {
      addNotification('Failed to refresh', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApplyFilters = useCallback(async () => {
    const filters: FilterOptions = {};
    if (gradeLevel) filters.grade_level = gradeLevel;
    if (subject) filters.subject = subject;
    if (status) filters.status = status;
    if (performanceLevel) filters.performance_level = performanceLevel;
    await applyFilters(filters);
    addNotification('Filters applied', 'success');
  }, [gradeLevel, subject, status, performanceLevel, applyFilters, addNotification]);

  const handleClearFilters = useCallback(async () => {
    setGradeLevel('');
    setSubject('');
    setStatus('');
    setPerformanceLevel('');
    await applyFilters({});
    addNotification('Filters cleared', 'info');
  }, [applyFilters, addNotification]);

  const selectedFamilyData = useMemo(() => {
    return families.find(f => f.family_id === selectedFamily) || null;
  }, [families, selectedFamily]);

  const selectedStudentData = useMemo(() => {
    if (!selectedFamilyData) return null;
    return selectedFamilyData.students.find(s => s.student_id === selectedStudent) || null;
  }, [selectedFamilyData, selectedStudent]);

  const sortedSubjects = useMemo(() => {
    return getSortedSubjects(selectedStudent || null, sortBy);
  }, [selectedStudent, sortBy, getSortedSubjects]);

  const getGradeColor = (grade: number | undefined) => {
    if (grade === undefined) return 'text-gray-500';
    if (grade >= 90) return 'text-green-600 dark:text-green-400';
    if (grade >= 80) return 'text-blue-600 dark:text-blue-400';
    if (grade >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeBadgeColor = (grade: number | undefined) => {
    if (grade === undefined) return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-gray-200 dark:ring-gray-600';
    if (grade >= 90) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-green-200 dark:ring-green-900';
    if (grade >= 80) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-blue-200 dark:ring-blue-900';
    if (grade >= 70) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 ring-yellow-200 dark:ring-yellow-900';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-red-200 dark:ring-red-900';
  };

  const getTrendIcon = (trend: string | undefined) => {
    switch (trend) {
      case 'improving':
        return <TrendingUpIcon className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDownIcon className="h-4 w-4 text-red-600" />;
      default:
        return <MinusIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-700 ring-green-600/20',
      pending: 'bg-yellow-100 text-yellow-700 ring-yellow-600/20',
      under_review: 'bg-orange-100 text-orange-700 ring-orange-600/20',
      declined: 'bg-red-100 text-red-700 ring-red-600/20'
    };
    const labels = {
      approved: 'Active',
      pending: 'Pending',
      under_review: 'Reviewing',
      declined: 'Declined'
    };

    const key = status as keyof typeof styles;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1 ring-inset ${styles[key] || 'bg-gray-100 text-gray-700 ring-gray-600/20'}`}>
        {labels[key] || status}
      </span>
    );
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl p-6">
        <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Error Loading Data</h3>
        <p className="text-red-600 dark:text-red-300 text-sm mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <BookOpenIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Enrolled Subjects</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Manage and track subject enrollments</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Sort Dropdown */}
            <div className="relative group">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <option value="name">Sort by Name</option>
                <option value="grade">Sort by Grade</option>
                <option value="date">Sort by Date</option>
                <option value="trend">Sort by Trend</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            {/* View Toggle */}
            <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${showFilters ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
            >
              <FunnelIcon className="w-4 h-4" />
              Filters
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Grade Level</label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Subject Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Search subjects..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  />
                  <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                  <option value="">All Statuses</option>
                  <option value="approved">Active</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Performance</label>
                <select value={performanceLevel} onChange={(e) => setPerformanceLevel(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                  <option value="">All Levels</option>
                  <option value="excellent">Excellent (90+)</option>
                  <option value="good">Good (80-89)</option>
                  <option value="average">Average (70-79)</option>
                  <option value="below_average">Below Avg (&lt;70)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all hover:translate-y-px"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[['Total Subjects', sortedSubjects.length, 'bg-blue-500'],
        ['Active Subjects', sortedSubjects.length, 'bg-green-500'], // Needs real active count
        ['Avg Performance', sortedSubjects.length > 0 ? (sortedSubjects.reduce((acc, curr) => acc + (curr.overall_grade || 0), 0) / sortedSubjects.length).toFixed(1) + '%' : 'N/A', 'bg-indigo-500'],
        ['Families', families.length, 'bg-purple-500']].map(([label, value, color], idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
            </div>
            <div className={`w-2 h-12 rounded-full ${color} opacity-20`}></div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900/30 rounded-full animate-spin border-t-blue-600"></div>
          </div>
        </div>
      ) : families.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-full mb-4">
            <BookOpenIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">No enrolled subjects found</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Enroll in subjects to see them listed here.</p>
        </div>
      ) : (
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Sidebar Selection - Only showing if no specific child selected globally */}
          {!selectedChildId && (
            <div className="w-full lg:w-80 shrink-0 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-gray-400" />
                  Select Family
                </h3>
                <VerticalSlider
                  items={families.map(f => ({ id: f.family_id, label: `${f.family_name} (${f.total_students})` }))}
                  selectedId={selectedFamily}
                  onSelect={(item) => {
                    setSelectedFamily(item.id as number);
                    const family = families.find(f => f.family_id === item.id);
                    setSelectedStudent(family?.students[0]?.student_id || null);
                  }}
                  maxVisibleItems={4}
                  className="w-full"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                  Select Student
                </h3>
                {selectedFamilyData && selectedFamilyData.students.length > 0 ? (
                  <div className="space-y-2">
                    {selectedFamilyData.students.map(student => (
                      <button
                        key={student.student_id}
                        onClick={() => setSelectedStudent(student.student_id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${selectedStudent === student.student_id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-sm'
                          : 'bg-gray-50 dark:bg-gray-700/30 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedStudent === student.student_id ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                            }`}>
                            {student.student_name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <p className={`text-sm font-semibold ${selectedStudent === student.student_id ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>{student.student_name}</p>
                            <p className={`text-xs ${selectedStudent === student.student_id ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500'}`}>{student.subjects.length} Subjects</p>
                          </div>
                        </div>
                        {selectedStudent === student.student_id && <CheckCircleIcon className="w-5 h-5 text-blue-500" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">No students in family</div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1">
            {selectedStudentData && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {selectedStudentData.student_name}'s Subjects
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                    {sortedSubjects.length} Total
                  </span>
                </h2>
              </div>
            )}

            {sortedSubjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 font-medium">No subjects match the current filters</p>
                <button onClick={handleClearFilters} className="mt-2 text-blue-600 hover:underline text-sm font-semibold">Clear Filters</button>
              </div>
            ) : (
              <ScrollableListContainer
                maxHeight="max-h-[calc(100vh-250px)]"
                className={`pr-2 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'flex flex-col gap-4'}`}
              >
                {sortedSubjects.map((subject, idx) => (
                  <div
                    key={`${subject.id}-${idx}`}
                    className={`group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 overflow-hidden relative ${viewMode === 'list' ? 'flex flex-row items-center p-4 gap-6' : 'p-5 flex flex-col'}`}
                  >
                    {/* Decorative gradient blob */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full -mr-6 -mt-6 transition-all group-hover:scale-150 group-hover:opacity-70"></div>

                    <div className={`flex justify-between items-start ${viewMode === 'list' ? 'w-1/3' : 'mb-4'}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {subject.subject}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          Grade {subject.grade_level} {subject.stream && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded ml-1">{subject.stream}</span>}
                        </p>
                      </div>
                      {viewMode === 'grid' && (
                        <div className={`flex flex-col items-end`}>
                          <span className={`text-xl font-black ${getGradeColor(subject.overall_grade)}`}>
                            {subject.overall_grade ? subject.overall_grade.toFixed(0) : '-'}%
                          </span>
                        </div>
                      )}
                    </div>

                    {viewMode === 'list' && (
                      <div className="flex-1 flex justify-center">
                        <div className="flex items-center gap-3">
                          <UserCircleIcon className="w-8 h-8 text-gray-300" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Teacher</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{subject.teacher.full_name || `${subject.teacher.first_name} ${subject.teacher.last_name}`}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={`${viewMode === 'grid' ? 'space-y-3' : 'flex items-center gap-8'}`}>
                      {viewMode === 'grid' && (
                        <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <UserCircleIcon className="w-5 h-5" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">In Charge</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{subject.teacher.full_name || `${subject.teacher.first_name} ${subject.teacher.last_name}`}</p>
                          </div>
                        </div>
                      )}

                      <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 gap-2 text-sm' : 'flex gap-6'}`}>
                        <div className={`${viewMode === 'grid' ? 'bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg' : ''}`}>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Assignment Avg</p>
                          <p className={`font-bold ${getGradeColor(subject.assignment_average)}`}>{subject.assignment_average?.toFixed(1) || 'N/A'}</p>
                        </div>
                        <div className={`${viewMode === 'grid' ? 'bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg' : ''}`}>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Exam Avg</p>
                          <p className={`font-bold ${getGradeColor(subject.exam_average)}`}>{subject.exam_average?.toFixed(1) || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between ${viewMode === 'list' ? 'w-1/4 justify-end gap-4' : ''}`}>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(subject.trend)}
                        <span className="text-xs font-semibold text-gray-500 capitalize">{subject.trend || 'Stable'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{formatDate(subject.enrolled_date)}</span>
                      </div>
                    </div>

                    {viewMode === 'list' && (
                      <div className="ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
                        <div className={`text-xl font-black ${getGradeColor(subject.overall_grade)}`}>
                          {subject.overall_grade ? subject.overall_grade.toFixed(1) : '-'}%
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </ScrollableListContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentEnrolledSubjectsEnhancedV2;
