import { GeneratedRubric } from '../types';

/**
 * Utility functions for exporting rubrics in various formats
 */

/**
 * Generates text content for a rubric
 */
export const generateRubricTextContent = (
  rubric: GeneratedRubric,
  topic: string,
  gradeLevel: string,
  subject?: string,
  learningObjectives?: string[],
  weightingEnabled?: boolean
): string => {
  const rubricType = rubric.rubric_type || 'analytic';
  
  return `
${rubric.title}
${'='.repeat(rubric.title.length)}

Topic: ${topic}
Grade Level: ${gradeLevel}
${subject ? `Subject: ${subject}\n` : ''}Rubric Type: ${rubricType.replace('_', ' ').toUpperCase()}
Total Points: ${rubric.total_points || 100}

${learningObjectives && learningObjectives.length > 0 ? `Learning Objectives:\n${learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}\n\n` : ''}
Criteria:
${rubric.criteria.map((crit, i) => `
${i + 1}. ${crit.criterion}${crit.description ? ` - ${crit.description}` : ''}
${weightingEnabled ? `   Weight: ${crit.weight}%\n` : ''}
${crit.performanceLevels.map(level => `   ${level.level} (${level.points} pts): ${level.description}`).join('\n')}
`).join('\n')}
  `.trim();
};

/**
 * Downloads a file with the given content and filename
 * Uses the File System Access API when available for folder selection
 */
export const downloadFile = async (
  content: string | Blob,
  filename: string,
  mimeType: string
): Promise<void> => {
  // Check if File System Access API is available (Chrome 86+, Edge 86+)
  const hasFileSystemAccess = 'showSaveFilePicker' in window;
  console.log('File System Access API available:', hasFileSystemAccess);
  
  if (hasFileSystemAccess) {
    try {
      // Get Downloads directory handle as starting point
      let startIn: any = 'downloads'; // Default to downloads folder
      
      const options: any = {
        suggestedName: filename,
        startIn: startIn, // Start in Downloads folder
        types: [
          {
            description: getFileDescription(mimeType),
            accept: { [mimeType]: [getFileExtension(filename)] }
          }
        ]
      };

      // Show save file picker dialog (opens from Downloads folder)
      console.log('Opening file picker with options:', options);
      const handle = await (window as any).showSaveFilePicker(options);
      const writable = await handle.createWritable();
      
      if (typeof content === 'string') {
        await writable.write(content);
      } else {
        await writable.write(content);
      }
      
      await writable.close();
      console.log('File saved successfully via File System Access API');
      return;
    } catch (err: any) {
      // User cancelled or error occurred
      if (err.name === 'AbortError') {
        // User cancelled, don't proceed with fallback
        console.log('User cancelled file save');
        throw new Error('Save cancelled by user');
      } else {
        // API failed, fall back to standard download
        console.warn('File System Access API failed, falling back to standard download:', err);
      }
    }
  } else {
    console.log('File System Access API not supported, using standard download');
  }

  // Fallback: Standard download (downloads to default folder)
  console.log('Using standard download fallback');
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: mimeType })
    : content;
    
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Opens file picker with multiple format options and saves content
 * Returns the selected format or null if cancelled/unsupported
 */
export const saveWithFilePicker = async (
  baseFilename: string,
  getContent: (format: 'txt' | 'pdf' | 'docx') => Promise<string | Blob>
): Promise<'txt' | 'pdf' | 'docx' | null> => {
  // Check if File System Access API is available
  if ('showSaveFilePicker' in window) {
    try {
      const options: any = {
        suggestedName: `${baseFilename}.pdf`,
        startIn: 'downloads',
        types: [
          {
            description: 'PDF Documents',
            accept: { 'application/pdf': ['.pdf'] }
          },
          {
            description: 'Word Documents',
            accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
          },
          {
            description: 'Text Files',
            accept: { 'text/plain': ['.txt'] }
          }
        ]
      };

      const handle = await (window as any).showSaveFilePicker(options);
      const filename = handle.name;
      
      // Determine format from extension
      let format: 'txt' | 'pdf' | 'docx' = 'pdf';
      if (filename.endsWith('.txt')) {
        format = 'txt';
      } else if (filename.endsWith('.docx')) {
        format = 'docx';
      } else if (filename.endsWith('.pdf')) {
        format = 'pdf';
      }
      
      // Get content for the selected format
      const content = await getContent(format);
      
      // Write to file
      const writable = await handle.createWritable();
      if (typeof content === 'string') {
        await writable.write(content);
      } else {
        await writable.write(content);
      }
      await writable.close();
      
      return format;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null; // User cancelled
      }
      throw err;
    }
  }
  
  // Fallback: return null to show modal
  return null;
};

/**
 * Opens file picker with multiple format options
 * Returns the selected format based on file extension
 */
export const openFilePickerWithFormats = async (
  baseFilename: string
): Promise<{ format: 'txt' | 'pdf' | 'docx'; filename: string } | null> => {
  // Check if File System Access API is available
  if ('showSaveFilePicker' in window) {
    try {
      const options: any = {
        suggestedName: `${baseFilename}.pdf`,
        startIn: 'downloads',
        types: [
          {
            description: 'PDF Documents',
            accept: { 'application/pdf': ['.pdf'] }
          },
          {
            description: 'Word Documents',
            accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
          },
          {
            description: 'Text Files',
            accept: { 'text/plain': ['.txt'] }
          }
        ]
      };

      const handle = await (window as any).showSaveFilePicker(options);
      const filename = handle.name;
      
      // Determine format from extension
      let format: 'txt' | 'pdf' | 'docx' = 'pdf';
      if (filename.endsWith('.txt')) {
        format = 'txt';
      } else if (filename.endsWith('.docx')) {
        format = 'docx';
      } else if (filename.endsWith('.pdf')) {
        format = 'pdf';
      }
      
      return { format, filename: handle.name };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null; // User cancelled
      }
      throw err;
    }
  }
  
  // Fallback: return null to show modal
  return null;
};

/**
 * Gets file description based on MIME type
 */
const getFileDescription = (mimeType: string): string => {
  const descriptions: Record<string, string> = {
    'text/plain': 'Text Files',
    'application/pdf': 'PDF Documents',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Documents'
  };
  return descriptions[mimeType] || 'Files';
};

/**
 * Gets file extension from filename
 */
const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
};

/**
 * Sanitizes filename by removing invalid characters
 */
export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-z0-9_\-\.]/gi, '_');
};

/**
 * Gets MIME type for a given format
 */
export const getMimeType = (format: 'txt' | 'pdf' | 'docx'): string => {
  const mimeTypes = {
    txt: 'text/plain',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return mimeTypes[format];
};
