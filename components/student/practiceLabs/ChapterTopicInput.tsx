import React, { useState, useEffect } from 'react';

interface ChapterTopicInputProps {
    value: string;
    onChange: (value: string, isChapter: boolean) => void;
    subject: string;
    placeholder?: string;
    disabled?: boolean;
    availableTopics?: string[];
}

/**
 * Smart input component that detects chapter/unit/lesson references
 * and provides helpful feedback to users
 */
const ChapterTopicInput: React.FC<ChapterTopicInputProps> = ({
    value,
    onChange,
    subject,
    placeholder = "Enter topic or chapter (e.g., 'Algebra' or 'Chapter 3')",
    disabled = false
}) => {
    const [isChapterDetected, setIsChapterDetected] = useState(false);
    const [detectedChapterInfo, setDetectedChapterInfo] = useState<string>('');

    // Helper function to detect chapter input
    const detectChapterMode = (inputValue: string): { isChapter: boolean; info: string } => {
        if (!inputValue) {
            return { isChapter: false, info: '' };
        }

        const valueLower = inputValue.toLowerCase().trim();

        // Chapter/Unit/Lesson keywords
        const chapterKeywords = ['chapter', 'unit', 'lesson', 'module', 'section'];
        const hasKeyword = chapterKeywords.some(keyword => valueLower.includes(keyword));

        // Check for abbreviated forms (Ch. 3, U 5, etc.)
        const hasAbbreviation = /^(ch|u|l|m)\.?\s*\d+/i.test(valueLower);

        // Check if it's just a number (could be chapter number)
        const isJustNumber = /^\d+$/.test(valueLower);

        const isChapter = hasKeyword || hasAbbreviation || isJustNumber;

        let info = '';
        if (isChapter) {
            if (hasKeyword) {
                info = `Chapter-based mode: Will search curriculum for "${inputValue}"`;
            } else if (hasAbbreviation) {
                info = `Chapter-based mode: Will search curriculum for this chapter`;
            } else if (isJustNumber) {
                info = `Chapter-based mode: Will search for Chapter/Unit ${inputValue}`;
            }
        }

        return { isChapter, info };
    };

    // Update detection state when value changes
    useEffect(() => {
        const detection = detectChapterMode(value);
        setIsChapterDetected(detection.isChapter);
        setDetectedChapterInfo(detection.info);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const detection = detectChapterMode(newValue);
        onChange(newValue, detection.isChapter);
    };

    return (
        <div className="space-y-2">
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${isChapterDetected
                            ? 'border-blue-500 dark:border-blue-400'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                />
                {isChapterDetected && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="text-blue-500 dark:text-blue-400 text-sm font-medium">
                            📚 Chapter Mode
                        </span>
                    </div>
                )}
            </div>

            {/* Helper text */}
            <div className="text-xs space-y-1">
                {isChapterDetected ? (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">
                            ✓ {detectedChapterInfo}
                        </p>
                        <p className="text-blue-600 dark:text-blue-400">
                            Questions will cover all topics from this chapter using curriculum content.
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                        Enter a specific topic (e.g., "Photosynthesis") or a chapter reference (e.g., "Chapter 3", "Unit One", "Lesson 5")
                    </p>
                )}
            </div>

            {/* Examples */}
            {!value && (
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p className="font-medium">Examples:</p>
                    <div className="grid grid-cols-2 gap-1">
                        <div>
                            <span className="text-gray-600 dark:text-gray-300">Topic:</span> Algebra, Photosynthesis
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-300">Chapter:</span> Chapter 3, Unit One, Lesson 5
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChapterTopicInput;
