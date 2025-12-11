export interface ChapterIdentifier {
  prefix: string;
  number: number;
  title?: string;
  type: 'chapter' | 'unit' | 'lesson' | 'topic' | 'section';
}

export interface ChapterBoundary {
  startLine: number;
  endLine: number;
  title: string;
  content: string;
}

class ChapterAwarenessService {
  /**
   * Detects chapter boundaries in text
   * Supports: "Chapter 1", "Unit 2", "Lesson 3", "Section 4", etc.
   * Also supports: "Chapter One", "Unit Two", etc.
   */
  detectChapterBoundaries(text: string): ChapterBoundary[] {
    const boundaries: ChapterBoundary[] = [];
    const lines = text.split('\n');

    const chapterPattern =
      /^(Chapter|Unit|Lesson|Section|Part|Module|Topic)\s+(?:(\d+)|([A-Za-z]+))\s*[:.-]?\s*(.*)$/im;

    let currentStart = 0;
    let currentTitle = '';

    lines.forEach((line, index) => {
      const match = line.match(chapterPattern);

      if (match) {
        if (currentTitle && index > currentStart) {
          boundaries.push({
            startLine: currentStart,
            endLine: index,
            title: currentTitle,
            content: lines.slice(currentStart, index).join('\n'),
          });
        }

        currentStart = index;
        currentTitle = match[0];
      }
    });

    if (currentTitle) {
      boundaries.push({
        startLine: currentStart,
        endLine: lines.length,
        title: currentTitle,
        content: lines.slice(currentStart).join('\n'),
      });
    }

    return boundaries;
  }

  /**
   * Parses chapter input in various formats
   * Supports: "Chapter 1", "Chapter One", "Unit 2", "Unit Two", etc.
   */
  parseChapterInput(input: string): ChapterIdentifier | null {
    if (!input || typeof input !== 'string') return null;

    const trimmed = input.trim();

    const patterns = [
      {
        regex:
          /^(Chapter|Unit|Lesson|Section|Part|Module)\s+(\d+)\s*[:.-]?\s*(.*)/i,
        type: 'numeric' as const,
      },
      {
        regex:
          /^(Chapter|Unit|Lesson|Section|Part|Module)\s+(One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve|Thirteen|Fourteen|Fifteen|Sixteen|Seventeen|Eighteen|Nineteen|Twenty)\s*[:.-]?\s*(.*)/i,
        type: 'word' as const,
      },
    ];

    const numberMap: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      eleven: 11,
      twelve: 12,
      thirteen: 13,
      fourteen: 14,
      fifteen: 15,
      sixteen: 16,
      seventeen: 17,
      eighteen: 18,
      nineteen: 19,
      twenty: 20,
    };

    for (const pattern of patterns) {
      const match = trimmed.match(pattern.regex);

      if (match) {
        const prefix = match[1].toLowerCase();
        let number = 0;

        if (pattern.type === 'numeric') {
          number = parseInt(match[2]);
        } else {
          number = numberMap[match[2].toLowerCase()] || 0;
        }

        if (number > 0) {
          return {
            prefix: match[1],
            number,
            title: match[3] || undefined,
            type: (prefix as any) || 'chapter',
          };
        }
      }
    }

    return null;
  }

  /**
   * Extracts topics from chapter content
   */
  extractTopicsFromChapter(chapterContent: string): string[] {
    const topics: string[] = [];

    const topicPatterns = [
      /^#{1,4}\s+(.+?)$/gm,
      /^[•\-\*]\s+(.+?)$/gm,
      /^(\d+\.)\s+(.+?)$/gm,
    ];

    for (const pattern of topicPatterns) {
      let match;
      while ((match = pattern.exec(chapterContent)) !== null) {
        const topic = match[match.length - 1].trim();
        if (topic && topic.length > 5 && topic.length < 200) {
          if (!topics.includes(topic)) {
            topics.push(topic);
          }
        }
      }
    }

    return topics.slice(0, 10);
  }

  /**
   * Improves learning objective extraction from chapter content
   */
  extractLearningObjectives(
    chapterContent: string,
    topic: string
  ): string[] {
    const objectives: string[] = [];

    const objectiveKeywords = [
      'understand',
      'know',
      'learn',
      'identify',
      'describe',
      'explain',
      'apply',
      'analyze',
      'evaluate',
      'create',
      'solve',
      'demonstrate',
    ];

    const contentLines = chapterContent.split('\n').slice(0, 30);

    for (const line of contentLines) {
      for (const keyword of objectiveKeywords) {
        if (line.toLowerCase().includes(keyword)) {
          const cleaned = line.replace(/^[•\-\*\d.]+\s*/, '').trim();
          if (cleaned && cleaned.length > 10 && cleaned.length < 150) {
            if (!objectives.includes(cleaned)) {
              objectives.push(cleaned);
            }
          }
          break;
        }
      }
    }

    if (objectives.length === 0) {
      objectives.push(`Understand the key concepts of ${topic}`);
      objectives.push(`Apply knowledge about ${topic} to real-world scenarios`);
      objectives.push(`Evaluate and analyze topics related to ${topic}`);
    }

    return objectives.slice(0, 5);
  }

  /**
   * Builds enhanced RAG query with chapter awareness
   */
  buildChapterAwareQuery(
    topic: string,
    chapter: ChapterIdentifier | null,
    subject?: string,
    gradeLevel?: string
  ): string {
    const parts: string[] = [];

    if (gradeLevel) {
      parts.push(`for ${gradeLevel}`);
    }

    if (subject) {
      parts.push(`${subject}`);
    }

    if (chapter) {
      parts.push(
        `${chapter.prefix} ${chapter.number}${
          chapter.title ? `: ${chapter.title}` : ''
        }`
      );
    }

    parts.push(`on "${topic}"`);

    return `Complete content ${parts.join(' ')}. Include all sections, subsections, learning objectives, activities, and assessment materials.`;
  }

  /**
   * Assembles complete chapter content from multiple sources
   */
  assembleChapterContent(
    contentFragments: string[],
    topic: string,
    chapter?: ChapterIdentifier
  ): string {
    if (contentFragments.length === 0) return '';

    const assembled = contentFragments.join('\n\n---\n\n');
    const cleaned = assembled
      .replace(/\n\n+/g, '\n\n')
      .replace(/#{4,}/g, '###')
      .trim();

    return cleaned;
  }

  /**
   * Validates and normalizes chapter format
   */
  normalizeChapterFormat(input: string): string {
    const parsed = this.parseChapterInput(input);

    if (!parsed) {
      return input;
    }

    const numStr = parsed.number.toString();
    let normalized = `${parsed.prefix} ${numStr}`;

    if (parsed.title) {
      normalized += `: ${parsed.title}`;
    }

    return normalized;
  }
}

export const chapterAwarenessService = new ChapterAwarenessService();
