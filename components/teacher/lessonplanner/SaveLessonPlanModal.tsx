import React, { useState, useEffect } from 'react';
import { XCircleIcon, DownloadIcon, FolderIcon, InformationCircleIcon } from '../../icons/Icons';

export type SaveLessonPlanFormat = 'txt' | 'pdf' | 'docx';

interface SaveLessonPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (format: SaveLessonPlanFormat) => void;
  planTitle: string;
  isSaving?: boolean;
}

const SaveLessonPlanModal: React.FC<SaveLessonPlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  planTitle,
  isSaving = false
}) => {
  const [selectedFormat, setSelectedFormat] = useState<SaveLessonPlanFormat>('pdf');
  const [hasFileSystemAccess, setHasFileSystemAccess] = useState(false);

  useEffect(() => {
    setHasFileSystemAccess('showSaveFilePicker' in window);
  }, []);

  if (!isOpen) return null;

  const formats = [
    {
      value: 'txt' as SaveLessonPlanFormat,
      label: 'Text File (.txt)',
      description: 'Simple text format, compatible with all text editors',
      icon: '📄'
    },
    {
      value: 'pdf' as SaveLessonPlanFormat,
      label: 'PDF Document (.pdf)',
      description: 'Professional format, preserves formatting',
      icon: '📕'
    },
    {
      value: 'docx' as SaveLessonPlanFormat,
      label: 'Word Document (.docx)',
      description: 'Editable format, compatible with Microsoft Word',
      icon: '📘'
    }
  ];

  const handleSave = () => {
    onSave(selectedFormat);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Save Lesson Plan to Local Machine
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isSaving}
            title="Close"
            aria-label="Close save options"
          >
            <XCircleIcon />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose a format to save "<strong>{planTitle}</strong>" to your local machine
          </p>

          <div className="space-y-2">
            {formats.map((format) => (
              <label
                key={format.value}
                className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedFormat === format.value
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="save-format"
                  value={format.value}
                  checked={selectedFormat === format.value}
                  onChange={(e) => setSelectedFormat(e.target.value as SaveLessonPlanFormat)}
                  className="mt-1 mr-3"
                  disabled={isSaving}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{format.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {format.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {format.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {hasFileSystemAccess ? (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-start space-x-2">
                <FolderIcon />
                <div className="flex-1">
                  <p className="text-xs text-green-800 dark:text-green-200">
                    <strong>Folder Selection:</strong> Your browser will prompt you to choose where to save the file on your local machine.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-start space-x-2">
                <InformationCircleIcon />
                <div className="flex-1">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> The file will be downloaded to your default downloads folder. You can move it to your preferred location after download.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    💡 For folder selection, use Chrome, Edge, or Opera browser.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-md transition-colors"
          >
            <DownloadIcon />
            <span>{isSaving ? 'Saving...' : 'Save to Local Machine'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveLessonPlanModal;
