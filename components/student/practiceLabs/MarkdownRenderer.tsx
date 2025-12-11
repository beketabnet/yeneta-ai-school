import React from 'react';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * MarkdownRenderer - Renders markdown-formatted text with proper HTML formatting
 * Supports: **bold**, numbered lists, bullet points, line breaks, formulas
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    const renderMarkdown = (text: string): React.ReactNode[] => {
        const elements: React.ReactNode[] = [];
        
        // Split by numbered lists (1., 2., etc.) or bullet points (-, *)
        const lines = text.split(/(?=\d+\.\s|\n-\s|\n\*\s)/);
        
        let listItems: string[] = [];
        let listType: 'ordered' | 'unordered' | null = null;
        let listKey = 0;
        
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            
            // Check for numbered list item
            const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/);
            if (numberedMatch) {
                if (listType !== 'ordered') {
                    // Flush previous list if different type
                    if (listItems.length > 0) {
                        elements.push(renderList(listItems, listType!, listKey++));
                        listItems = [];
                    }
                    listType = 'ordered';
                }
                listItems.push(numberedMatch[2]);
                return;
            }
            
            // Check for bullet point
            const bulletMatch = trimmedLine.match(/^[-*]\s+(.+)/);
            if (bulletMatch) {
                if (listType !== 'unordered') {
                    // Flush previous list if different type
                    if (listItems.length > 0) {
                        elements.push(renderList(listItems, listType!, listKey++));
                        listItems = [];
                    }
                    listType = 'unordered';
                }
                listItems.push(bulletMatch[1]);
                return;
            }
            
            // Not a list item - flush any pending list
            if (listItems.length > 0) {
                elements.push(renderList(listItems, listType!, listKey++));
                listItems = [];
                listType = null;
            }
            
            // Render regular paragraph with inline formatting
            if (trimmedLine) {
                elements.push(
                    <p key={`p-${index}`} className="mb-3 last:mb-0">
                        {renderInlineFormatting(trimmedLine)}
                    </p>
                );
            }
        });
        
        // Flush any remaining list items
        if (listItems.length > 0) {
            elements.push(renderList(listItems, listType!, listKey++));
        }
        
        return elements;
    };
    
    const renderList = (items: string[], type: 'ordered' | 'unordered', key: number): React.ReactNode => {
        const ListTag = type === 'ordered' ? 'ol' : 'ul';
        const listClass = type === 'ordered' 
            ? 'list-decimal list-inside space-y-2 mb-3 ml-4' 
            : 'list-disc list-inside space-y-2 mb-3 ml-4';
        
        return (
            <ListTag key={`list-${key}`} className={listClass}>
                {items.map((item, idx) => (
                    <li key={`item-${key}-${idx}`} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {renderInlineFormatting(item)}
                    </li>
                ))}
            </ListTag>
        );
    };
    
    const renderInlineFormatting = (text: string): (string | React.ReactNode)[] => {
        const parts: (string | React.ReactNode)[] = [];
        let currentIndex = 0;
        let partKey = 0;
        
        // Regex to match **bold**, formulas, and special characters
        const boldRegex = /\*\*(.+?)\*\*/g;
        const formulaRegex = /\^(\d+)/g; // Superscript like ^2
        
        let match;
        const matches: Array<{ start: number; end: number; type: 'bold' | 'formula'; content: string }> = [];
        
        // Find all bold matches
        while ((match = boldRegex.exec(text)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                type: 'bold',
                content: match[1]
            });
        }
        
        // Sort matches by start position
        matches.sort((a, b) => a.start - b.start);
        
        // Build the result with formatted parts
        matches.forEach((match) => {
            // Add text before the match
            if (currentIndex < match.start) {
                const beforeText = text.substring(currentIndex, match.start);
                parts.push(beforeText);
            }
            
            // Add the formatted match
            if (match.type === 'bold') {
                parts.push(
                    <strong key={`bold-${partKey++}`} className="font-bold text-gray-900 dark:text-white">
                        {match.content}
                    </strong>
                );
            }
            
            currentIndex = match.end;
        });
        
        // Add remaining text
        if (currentIndex < text.length) {
            let remainingText = text.substring(currentIndex);
            
            // Handle superscripts in remaining text
            remainingText = remainingText.replace(formulaRegex, (_, num) => {
                return `<sup>${num}</sup>`;
            });
            
            // Handle mathematical symbols
            remainingText = remainingText
                .replace(/\*/g, '×')  // Multiplication
                .replace(/\^/g, '');   // Remove remaining carets
            
            if (remainingText.includes('<sup>')) {
                // Parse HTML for superscripts
                parts.push(
                    <span 
                        key={`html-${partKey++}`}
                        dangerouslySetInnerHTML={{ __html: remainingText }}
                    />
                );
            } else {
                parts.push(remainingText);
            }
        }
        
        return parts;
    };
    
    return (
        <div className={`markdown-content ${className}`}>
            {renderMarkdown(content)}
        </div>
    );
};

export default MarkdownRenderer;
