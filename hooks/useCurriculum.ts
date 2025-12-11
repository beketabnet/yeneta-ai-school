import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

interface Region {
    id: number;
    name: string;
    code: string;
}

interface GradeLevel {
    id: number;
    name: string;
    order: number;
}

interface Stream {
    id: number;
    name: string;
    description: string;
}

interface Subject {
    id: number;
    name: string;
    code: string;
}

export const useCurriculum = () => {
    const [regions, setRegions] = useState<Region[]>([]);
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [streams, setStreams] = useState<Stream[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const [regionsData, gradesData, streamsData, subjectsData] = await Promise.all([
                    apiService.getRegions(),
                    apiService.getGradeLevels(),
                    apiService.getStreams(),
                    apiService.getSubjects()
                ]);

                setRegions(regionsData);
                setGradeLevels(gradesData);
                setStreams(streamsData);
                setSubjects(subjectsData);
            } catch (err) {
                console.error("Failed to fetch curriculum config:", err);
                setError("Failed to load curriculum configuration");
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const getSubjectsFor = useCallback(async (region?: string, grade?: string, stream?: string, useRAG: boolean = false) => {
        try {
            let curriculumData;

            if (useRAG) {
                curriculumData = await apiService.getCurriculumConfigRAG({ region, grade, stream });
            } else {
                curriculumData = await apiService.getCurriculum({ region, grade, stream });
            }

            // Handle RAG config format { subjects: [...] }
            if (curriculumData && Array.isArray(curriculumData.subjects)) {
                return curriculumData.subjects;
            }

            // Handle generic curriculum format (array of objects)
            if (Array.isArray(curriculumData)) {
                return Array.from(new Set(curriculumData.map((c: any) => c.subject_detail?.name || c.subject)));
            }

            return [];
        } catch (err) {
            console.error("Failed to fetch subjects:", err);
            return [];
        }
    }, []);

    return {
        regions,
        gradeLevels,
        streams,
        subjects,
        loading,
        error,
        getSubjectsFor
    };
};
