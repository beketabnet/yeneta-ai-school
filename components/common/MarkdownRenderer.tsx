import React from 'react';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * Simple markdown renderer for AI Tutor responses
 * Converts markdown syntax to HTML elements
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    const renderMarkdown = (text: string): React.ReactElement[] => {
        const lines = text.split('\n');
        const elements: React.ReactElement[] = [];
        let listItems: string[] = [];
        let inList = false;
        let codeBlock = '';
        let inCodeBlock = false;

        const flushList = (index: number) => {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`list-${index}`} className="list-disc list-inside ml-4 mb-3 space-y-1">
                        {listItems.map((item, i) => (
                            <li key={i} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item) }} />
                        ))}
                    </ul>
                );
                listItems = [];
                inList = false;
            }
        };

        const flushCodeBlock = (index: number) => {
            if (codeBlock) {
                elements.push(
                    <pre key={`code-${index}`} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md mb-3 overflow-x-auto">
                        <code className="text-sm">{codeBlock}</code>
                    </pre>
                );
                codeBlock = '';
                inCodeBlock = false;
            }
        };

        lines.forEach((line, index) => {
            // Handle code blocks
            if (line.trim().startsWith('```')) {
                if (inCodeBlock) {
                    flushCodeBlock(index);
                } else {
                    flushList(index);
                    inCodeBlock = true;
                }
                return;
            }

            if (inCodeBlock) {
                codeBlock += line + '\n';
                return;
            }

            // Handle headings
            if (line.startsWith('### ')) {
                flushList(index);
                elements.push(
                    <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100">
                        {line.substring(4)}
                    </h3>
                );
            } else if (line.startsWith('## ')) {
                flushList(index);
                elements.push(
                    <h2 key={index} className="text-xl font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100">
                        {line.substring(3)}
                    </h2>
                );
            } else if (line.startsWith('# ')) {
                flushList(index);
                elements.push(
                    <h1 key={index} className="text-2xl font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100">
                        {line.substring(2)}
                    </h1>
                );
            }
            // Handle unordered lists
            else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                inList = true;
                listItems.push(line.trim().substring(2));
            }
            // Handle ordered lists
            else if (/^\d+\.\s/.test(line.trim())) {
                if (!inList) {
                    flushList(index);
                }
                inList = true;
                listItems.push(line.trim().replace(/^\d+\.\s/, ''));
            }
            // Handle empty lines
            else if (line.trim() === '') {
                flushList(index);
                elements.push(<div key={index} className="h-2" />);
            }
            // Handle regular paragraphs
            else {
                flushList(index);
                if (line.trim()) {
                    elements.push(
                        <p
                            key={index}
                            className="mb-2 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(line) }}
                        />
                    );
                }
            }
        });

        // Flush any remaining list or code block
        flushList(lines.length);
        flushCodeBlock(lines.length);

        return elements;
    };

    const parseInlineMarkdown = (text: string): string => {
        // Process in order: code, links, bold, italic (to avoid conflicts)
        
        // Inline code: `code` (do this first to protect code content)
        text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>');
        
        // Links: [text](url)
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
        
        // Bold: **text** or __text__ (do before italic to avoid conflicts)
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>');
        text = text.replace(/__([^_]+)__/g, '<strong class="font-bold">$1</strong>');
        
        // Italic: *text* or _text_ (single asterisk/underscore, not at word boundaries)
        text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>');
        text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em class="italic">$1</em>');
        
        return text;
    };

    return (
        <div className={`markdown-content ${className}`}>
            {renderMarkdown(content)}
        </div>
    );
};

export default MarkdownRenderer;
