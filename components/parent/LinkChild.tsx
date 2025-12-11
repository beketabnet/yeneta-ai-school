import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../Card';

interface LinkChildProps {
    onChildLinked: () => void;
}

const LinkChild: React.FC<LinkChildProps> = ({ onChildLinked }) => {
    const [unlinkedStudents, setUnlinkedStudents] = useState<User[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLinking, setIsLinking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUnlinkedStudents = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const students = await apiService.getUnlinkedStudents();
                setUnlinkedStudents(students);
                if (students.length > 0) {
                    setSelectedStudentId(students[0].id.toString());
                }
            } catch (err) {
                setError("Could not load list of students. Please try again later.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUnlinkedStudents();
    }, []);

    const handleLinkChild = async () => {
        if (!selectedStudentId) return;
        setIsLinking(true);
        setError(null);
        try {
            await apiService.linkChild(parseInt(selectedStudentId, 10));
            onChildLinked(); // Refresh the parent dashboard
        } catch (err: any) {
            setError(err.message || "An error occurred while linking the child.");
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <Card title="Link Your Child's Account">
            <div className="max-w-md mx-auto text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    To view your child's progress and communicate with their teachers, please select them from the list below and link their account.
                </p>
                {isLoading && <p>Loading students...</p>}
                {error && <p className="text-danger mb-4">{error}</p>}
                {!isLoading && unlinkedStudents.length > 0 && (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="student-select" className="sr-only">Select Student</label>
                            <select
                                id="student-select"
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {unlinkedStudents.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.username} - {student.grade}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleLinkChild}
                            disabled={isLinking || !selectedStudentId}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:bg-gray-400"
                        >
                            {isLinking ? 'Linking...' : "Link Child's Account"}
                        </button>
                    </div>
                )}
                 {!isLoading && unlinkedStudents.length === 0 && (
                    <p className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                        There are currently no unlinked student accounts available to connect.
                    </p>
                )}
            </div>
        </Card>
    );
};

export default LinkChild;