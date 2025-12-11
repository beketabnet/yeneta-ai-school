import React, { useState } from 'react';
import { XCircleIcon, DownloadIcon } from '../../icons/Icons';

export type ExportFormat = 'txt' | 'pdf' | 'docx';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  rubricTitle: string;
  isExporting?: boolean;
}

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  isOpen,
  onClose,
  onExport,
  rubricTitle,
  isExporting = false
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('txt');

  if (!isOpen) return null;

  const formats = [
    {
      value: 'txt' as ExportFormat,
      label: 'Export as Text (.txt)',
      description: 'Simple text format, compatible with all text editors',
      icon: '📄'
    },
    {
      value: 'pdf' as ExportFormat,
      label: 'Export as PDF (.pdf)',
      description: 'Professional format, preserves formatting',
      icon: '📕'
    },
    {
      value: 'docx' as ExportFormat,
      label: 'Export as Word (.docx)',
      description: 'Editable format, compatible with Microsoft Word',
      icon: '📘'
    }
  ];

  const handleExport = () => {
    onExport(selectedFormat);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Export Rubric
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isExporting}
            title="Close"
            aria-label="Close export options"
          >
            <XCircleIcon />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose a format to export "<strong>{rubricTitle}</strong>"
          </p>

          {/* Format Options */}
          <div className="space-y-2">
            {formats.map((format) => (
              <label
                key={format.value}
                className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedFormat === format.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="export-format"
                  value={format.value}
                  checked={selectedFormat === format.value}
                  onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                  className="mt-1 mr-3"
                  disabled={isExporting}
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

          {/* Info Note */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> The file will be downloaded to your default downloads folder. 
              You can move it to your preferred location after download.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors"
          >
            <DownloadIcon />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportOptionsModal;
