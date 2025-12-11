import React, { useState, useEffect } from 'react';
import { XMarkIcon, SearchIcon, DocumentTextIcon } from '../../icons/Icons';
import { apiService } from '../../../services/apiService';

interface SavedRubric {
  id: number;
  title: string;
  content?: string;
  document_type?: string;
  grade_level?: string;
  subject?: string;
  created_at: string;
  is_public?: boolean;
}

interface RubricLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRubric: (rubric: string) => void;
}

const RubricLibraryModal: React.FC<RubricLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectRubric,
}) => {
  const [rubrics, setRubrics] = useState<SavedRubric[]>([]);
  const [filteredRubrics, setFilteredRubrics] = useState<SavedRubric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRubric, setSelectedRubric] = useState<SavedRubric | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRubrics();
    }
  }, [isOpen]);

  useEffect(() => {
    // Filter rubrics based on search term
    if (searchTerm.trim() === '') {
      setFilteredRubrics(rubrics);
    } else {
      const filtered = rubrics.filter(
        (rubric) =>
          rubric.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rubric.document_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rubric.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rubric.grade_level?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRubrics(filtered);
    }
  }, [searchTerm, rubrics]);

  const fetchRubrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch saved rubrics from API
      const response = await apiService.getSavedRubrics({
        my_rubrics: true,
      });
      
      // Handle both paginated and non-paginated responses
      const rubricData = Array.isArray(response) ? response : (response.results || []);
      setRubrics(rubricData);
      setFilteredRubrics(rubricData);
    } catch (err: any) {
      setError(err.message || 'Failed to load rubrics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (selectedRubric && selectedRubric.content) {
      onSelectRubric(selectedRubric.content);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            📚 Rubric Library
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rubrics by title, subject, grade level..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Rubric List */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">Loading rubrics...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : filteredRubrics.length === 0 ? (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center">
                  <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm ? 'No rubrics found' : 'No saved rubrics yet'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {searchTerm ? 'Try a different search term' : 'Create rubrics in Rubric Generator'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredRubrics.map((rubric) => (
                  <button
                    key={rubric.id}
                    onClick={() => setSelectedRubric(rubric)}
                    className={`w-full text-left p-3 rounded-md transition ${
                      selectedRubric?.id === rubric.id
                        ? 'bg-primary-light dark:bg-primary-dark/50 border-2 border-primary'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                    }`}
                  >
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                      {rubric.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {rubric.document_type && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          {rubric.document_type.replace('_', ' ')}
                        </span>
                      )}
                      {rubric.grade_level && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                          {rubric.grade_level}
                        </span>
                      )}
                      {rubric.subject && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                          {rubric.subject}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(rubric.created_at).toLocaleDateString()}
                      {rubric.is_public && ' • Public'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rubric Preview */}
          <div className="w-1/2 overflow-y-auto p-4">
            {selectedRubric ? (
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {selectedRubric.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedRubric.document_type && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                      {selectedRubric.document_type.replace('_', ' ')}
                    </span>
                  )}
                  {selectedRubric.grade_level && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                      {selectedRubric.grade_level}
                    </span>
                  )}
                  {selectedRubric.subject && (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                      {selectedRubric.subject}
                    </span>
                  )}
                </div>
                {selectedRubric.content ? (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                      {selectedRubric.content}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-md p-4 border border-yellow-200 dark:border-yellow-700">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      ⚠️ This rubric has no content and cannot be imported.
                    </p>
                  </div>
                )}
                {selectedRubric.content && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {selectedRubric.content.length} characters, ~
                    {Math.ceil(selectedRubric.content.split(/\s+/).filter((w) => w.length > 0).length)} words
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">
                  Select a rubric to preview
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredRubrics.length} rubric{filteredRubrics.length !== 1 ? 's' : ''} available
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedRubric || !selectedRubric.content}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition ${
                selectedRubric && selectedRubric.content
                  ? 'bg-primary hover:bg-primary-dark'
                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              Import Selected Rubric
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RubricLibraryModal;
