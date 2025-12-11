import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { UserGroupIcon } from '../icons/Icons';

interface Family {
  id: number;
  name: string;
  member_count: number;
  members: Array<{
    id: number;
    user_detail: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
    };
    role: string;
  }>;
}

interface FamilySelectorProps {
  onFamilySelected: (familyId: number) => void;
  selectedFamilyId?: number | null;
  required?: boolean;
}

const FamilySelector: React.FC<FamilySelectorProps> = ({
  onFamilySelected,
  selectedFamilyId = null,
  required = false
}) => {
  const [allFamilies, setAllFamilies] = useState<Family[]>([]);
  const [filteredFamilies, setFilteredFamilies] = useState<Family[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFamilies();
  }, []);

  // Real-time search as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFamilies(allFamilies);
    } else {
      // Use search API for real-time search
      searchFamilies(searchQuery);
    }
  }, [searchQuery]);

  const loadFamilies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.get('/users/student-families/');
      const families = Array.isArray(response) ? response : [];
      setAllFamilies(families);
      setFilteredFamilies(families);
    } catch (err) {
      console.error('Error loading families:', err);
      setError('Failed to load families');
      setAllFamilies([]);
      setFilteredFamilies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchFamilies = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const families = await apiService.searchFamilies(query);
      setFilteredFamilies(Array.isArray(families) ? families : []);
    } catch (err) {
      console.error('Error searching families:', err);
      setError(err instanceof Error ? err.message : 'Failed to search families');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredFamilies(allFamilies);
  };

  const getSelectedFamilyName = () => {
    const selected = allFamilies.find(f => f.id === selectedFamilyId);
    return selected ? selected.name : 'Select a family';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <UserGroupIcon className="h-5 w-5 text-blue-600" />
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Family {required && <span className="text-red-500">*</span>}
        </label>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type family name to search (e.g., 'A', 'Ab', 'Abc')..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Clear search"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Found {filteredFamilies.length} family{filteredFamilies.length !== 1 ? 'ies' : ''}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading families...</p>
        </div>
      )}

      {!isLoading && (!filteredFamilies || filteredFamilies.length === 0) ? (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-md">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {searchQuery ? `No families match "${searchQuery}". Try a different search.` : 'No families found. Please contact your family administrator.'}
          </p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md">
          {filteredFamilies && filteredFamilies.map(family => (
            <div
              key={family.id}
              onClick={() => onFamilySelected(family.id)}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer transition-all ${selectedFamilyId === family.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {family.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {family.member_count} member{family.member_count !== 1 ? 's' : ''}
                  </p>
                </div>
                {selectedFamilyId === family.id && (
                  <div className="text-blue-600 dark:text-blue-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Parents/Guardians: {family.members.filter(m => m.role === 'Parent/Guardian').map(m => m.user_detail.username).join(', ') || 'None'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FamilySelector;
