import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/apiService';
import eventService, { EVENTS } from '../services/eventService';

export interface CourseGrade {
    id: string;
    title: string;
    subject: string;
    grade_level: string;
    stream?: string;
    student_name: string;
    student_id: number;
    family_id: number;
    family_name: string;
    overall_grade: number | null;
    assignment_average: number | null;
    exam_average: number | null;
}

export interface UseStudentCoursesAndGradesReturn {
    courses: CourseGrade[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    getCoursesForFamily: (familyId: number) => CourseGrade[];
    getAllFamilies: () => Array<{ id: number; name: string }>;
}

export const useStudentCoursesAndGrades = (): UseStudentCoursesAndGradesReturn => {
    const [courses, setCourses] = useState<CourseGrade[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCoursesAndGrades = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Fetching student courses and grades...');
            const response = await apiService.getStudentFamilyGrades();

            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response structure from server');
            }

            const coursesData = response.courses || [];

            if (!Array.isArray(coursesData)) {
                throw new Error('Courses data is not an array');
            }

            // Deduplicate courses using unique key: subject_grade_level_stream_student_id_family_id
            const deduplicatedMap = new Map<string, CourseGrade>();

            coursesData.forEach((course: any) => {
                // Create unique key to prevent duplicates
                const uniqueKey = `${course.subject}_${course.grade_level}_${course.stream || 'no-stream'}_${course.student_id}_${course.family_id}`;

                // Only add if not already in map (prevents duplicates)
                if (!deduplicatedMap.has(uniqueKey)) {
                    deduplicatedMap.set(uniqueKey, {
                        id: uniqueKey,
                        title: course.title || `${course.subject} - ${course.grade_level}`,
                        subject: course.subject,
                        grade_level: course.grade_level,
                        stream: course.stream,
                        student_name: course.student_name || 'Unknown Student',
                        student_id: course.student_id,
                        family_id: course.family_id,
                        family_name: course.family_name || 'Unknown Family',
                        overall_grade: course.overall_grade,
                        assignment_average: course.assignment_average,
                        exam_average: course.exam_average
                    });
                }
            });

            const dedupedCourses = Array.from(deduplicatedMap.values());
            console.log(`Fetched ${coursesData.length} courses, deduplicated to ${dedupedCourses.length}`);

            setCourses(dedupedCourses);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load courses and grades';
            console.error('Error fetching courses and grades:', err);
            setError(errorMessage);
            setCourses([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Listen for grade updates
    useEffect(() => {
        const handleGradeEvent = () => {
            console.log('Grade event received, refreshing courses...');
            fetchCoursesAndGrades();
        };

        const unsubscribeCreated = eventService.subscribe(EVENTS.GRADE_CREATED, handleGradeEvent);
        const unsubscribeUpdated = eventService.subscribe(EVENTS.GRADE_UPDATED, handleGradeEvent);
        const unsubscribeDeleted = eventService.subscribe(EVENTS.GRADE_DELETED, handleGradeEvent);

        return () => {
            unsubscribeCreated();
            unsubscribeUpdated();
            unsubscribeDeleted();
        };
    }, [fetchCoursesAndGrades]);

    useEffect(() => {
        fetchCoursesAndGrades();
    }, [fetchCoursesAndGrades]);

    const getCoursesForFamily = useCallback(
        (familyId: number) => {
            return courses.filter(course => course.family_id === familyId);
        },
        [courses]
    );

    const getAllFamilies = useMemo(() => {
        return () => {
            const familyMap = new Map<number, string>();
            courses.forEach(course => {
                if (!familyMap.has(course.family_id)) {
                    familyMap.set(course.family_id, course.family_name);
                }
            });
            return Array.from(familyMap.entries()).map(([id, name]) => ({ id, name }));
        };
    }, [courses]);

    return {
        courses,
        isLoading,
        error,
        refetch: fetchCoursesAndGrades,
        getCoursesForFamily,
        getAllFamilies
    };
};
