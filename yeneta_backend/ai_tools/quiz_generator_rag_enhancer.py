"""
Quiz Generator RAG Enhancer for chapter-aware content extraction.
Optimizes curriculum content retrieval for quiz generation with full chapter support.
"""
import logging
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class QuizGeneratorRAGEnhancer:
    """Enhances RAG queries for quiz generation with chapter awareness."""
    
    @classmethod
    def build_quiz_query(
        cls,
        topic: str,
        subject: str,
        grade_level: str,
        quiz_type: str,
        difficulty: str,
        chapter_info: Optional[Dict] = None
    ) -> str:
        """
        Build optimized query for quiz generation.
        """
        query_parts = [f"Generate {quiz_type} questions about {topic}"]
        
        # Add chapter variants if available
        if chapter_info and chapter_info.get('variants'):
            query_parts.extend(chapter_info['variants'][:3])
        
        # Add context
        query_parts.append(f"{subject} Grade {grade_level}")
        query_parts.append(f"Difficulty: {difficulty}")
        query_parts.append("exam questions multiple choice true false short answer")
        
        enhanced_query = " ".join(query_parts)
        
        logger.info(f"🔍 Quiz generation query: {enhanced_query[:150]}...")
        
        return enhanced_query
    
    @classmethod
    def format_quiz_context(
        cls,
        documents: List[Dict],
        topic: str,
        chapter_info: Optional[Dict] = None,
        max_chars: int = 12000
    ) -> Tuple[str, List[str]]:
        """
        Format curriculum content for quiz generation.
        """
        if not documents:
            return "", []
        
        # Check if we have full chapter content
        has_full_chapter = any(doc.get('full_chapter', False) for doc in documents)
        
        context_parts = []
        sources = []
        total_chars = 0
        
        # Header
        context_parts.append("=== ETHIOPIAN CURRICULUM CONTENT FOR QUIZ GENERATION ===")
        
        if has_full_chapter:
            context_parts.append("The following is COMPLETE CHAPTER content from official Ethiopian curriculum textbooks:")
        else:
            context_parts.append("The following content is from official Ethiopian curriculum textbooks:")
        
        context_parts.append("")
        
        # Add documents
        for i, doc in enumerate(documents[:5], 1):
            source = doc.get('source', 'Unknown')
            content = doc.get('content', '')
            is_full_chapter = doc.get('full_chapter', False)
            
            if not content:
                continue
            
            # Build source header
            if is_full_chapter:
                chapter_num = doc.get('chapter_number', '')
                chapter_title = doc.get('title', f'Chapter {chapter_num}')
                
                source_header = f"[COMPLETE CHAPTER {chapter_num}: {chapter_title}]"
                source_header += f"\n[Source: {source}]"
            else:
                source_header = f"[Source {i}: {source}]"
            
            # Calculate available space
            remaining_chars = max_chars - total_chars - len(source_header) - 100
            
            if remaining_chars < 500 and not is_full_chapter:
                break
            
            # Content handling
            if is_full_chapter:
                # Full chapter content is already smartly truncated by the extractor if needed
                pass
            else:
                # Standard truncation for chunks
                if len(content) > remaining_chars:
                    content = content[:remaining_chars] + "..."
            
            # Add to context
            context_parts.append(source_header)
            context_parts.append(content)
            context_parts.append("")
            
            sources.append(source)
            total_chars += len(source_header) + len(content)
            
            # If we have full chapter, that's usually sufficient
            if is_full_chapter:
                break
        
        # Footer with instructions
        context_parts.append("=== END CURRICULUM CONTENT ===")
        context_parts.append("")
        
        if has_full_chapter and chapter_info:
            context_parts.append(f"📚 COMPLETE CHAPTER {chapter_info['number']} CONTENT PROVIDED")
            context_parts.append("Use this content to generate accurate questions based strictly on the material.")
        else:
            context_parts.append("Use the above curriculum content to generate questions that align with Ethiopian education standards.")
        
        context_parts.append("")
        
        formatted_context = "\n".join(context_parts)
        
        return formatted_context, list(set(sources))

    @classmethod
    def build_quiz_prompt_and_context(
        cls,
        context: str,
        topic: str,
        subject: str,
        grade_level: str,
        quiz_type: str,
        difficulty: str,
        num_questions: int,
        question_types: List[str],
        rag_info: str,
        chapter_title: Optional[str] = None,
        chapter_objectives: Optional[List[str]] = None,
        topics: Optional[List[str]] = None,
        has_explicit_objectives: bool = False,
        time_limit: int = 60,
        total_points: int = 10,
        question_counts: Optional[Dict[str, int]] = None
    ) -> Tuple[str, str]:
        """
        Build prompt instructions and context separately.
        
        Returns:
            Tuple[str, str]: (instructions_prompt, context_content)
        """
        prompt_parts = []
        
        # Ultra-Strict Instructions Header (for Ollama compatibility)
        prompt_parts.append("="*60)
        prompt_parts.append("🚨 ABSOLUTE REQUIREMENTS - READ CAREFULLY 🚨")
        prompt_parts.append("="*60)
        prompt_parts.append("")
        prompt_parts.append(f"1. QUIZ TYPE: This is a {quiz_type.upper()} for {subject} Grade {grade_level}")
        prompt_parts.append(f"   - {quiz_type} = Timed assessment with specific, answerable questions")
        prompt_parts.append(f"   - NOT an assignment, NOT a project, NOT homework")
        prompt_parts.append(f"   - Questions must be suitable for an ONLINE EXAM environment")
        prompt_parts.append("")
        prompt_parts.append(f"2. EXACT QUESTION COUNT: Generate EXACTLY {num_questions} questions")
        prompt_parts.append(f"   - NOT {num_questions-1}, NOT {num_questions+1}")
        prompt_parts.append(f"   - EXACTLY {num_questions} question objects in the 'questions' array")
        prompt_parts.append(f"   - Count your questions before submitting: 1, 2, 3... up to {num_questions}")
        prompt_parts.append("")
        prompt_parts.append("3. NO REPEATED QUESTIONS:")
        prompt_parts.append("   - Each question must be UNIQUE")
        prompt_parts.append("   - Do NOT ask the same thing twice with different wording")
        prompt_parts.append("   - Cover DIFFERENT concepts, examples, and scenarios")
        prompt_parts.append("")
        prompt_parts.append("4. NO ASSIGNMENT-TYPE QUESTIONS:")
        prompt_parts.append("   - ❌ NO 'Interview people...'")
        prompt_parts.append("   - ❌ NO 'Visit a location...'")
        prompt_parts.append("   - ❌ NO 'Conduct a survey...'")
        prompt_parts.append("   - ❌ NO 'Prepare a presentation...'")
        prompt_parts.append("   - ❌ NO 'Create a project...'")
        prompt_parts.append("   - ❌ NO 'In groups, discuss...'")
        prompt_parts.append("   - ✅ ONLY questions answerable IMMEDIATELY from textbook content")
        prompt_parts.append("   - 💡 STRATEGY: If the text says 'Activity: Interview a farmer about milk production', DO NOT ask the student to interview a farmer.")
        prompt_parts.append("     INSTEAD ask: 'According to the text, what are the key steps in milk production?'")
        prompt_parts.append("")
        prompt_parts.append("="*60)
        prompt_parts.append("")
        
        # Header
        prompt_parts.append(f"You are an expert Ethiopian Curriculum Developer and Exam Creator for {subject} Grade {grade_level}.")
        prompt_parts.append(f"Your task is to create a high-quality {quiz_type} that is STRICTLY based on the provided textbook content.")
        prompt_parts.append("")
        
        prompt_parts.append("=== MULTILINGUAL & LANGUAGE HANDLING ===")
        prompt_parts.append("1. **Automatic Language Detection**: Analyze the 'CURRICULUM CONTENT' provided.")
        prompt_parts.append("2. **Match Content Language**: Generate questions, options, and explanations in the SAME LANGUAGE as the provided content.")
        prompt_parts.append("   - If content is in Amharic, generate Amharic questions.")
        prompt_parts.append("   - If content is in Oromo, generate Oromo questions.")
        prompt_parts.append("   - If content is mixed, respect the dominant instructional language.")
        prompt_parts.append("3. **Subject Context**: For language subjects (e.g., 'English', 'Amharic'), follow the language conventions of that subject.")
        prompt_parts.append("4. **Unicode Support**: Ensure all non-English characters are preserved correctly in the JSON output.")
        prompt_parts.append("")
        
        # Diversity and Randomization Instruction
        from datetime import datetime
        timestamp_seed = datetime.now().strftime("%Y%m%d%H%M%S")
        
        prompt_parts.append("=== CRITICAL: QUESTION DIVERSITY ===")
        prompt_parts.append("⚠️ Generate VARIED and DIVERSE questions on EVERY generation:")
        prompt_parts.append("- Use DIFFERENT sections of the content each time")
        prompt_parts.append("- Vary the COGNITIVE LEVELS (remember, understand, apply, analyze, evaluate)")
        prompt_parts.append("- Mix QUESTION FORMATS even within the same type")
        prompt_parts.append("- Focus on DIFFERENT aspects of each concept")
        prompt_parts.append("- Avoid repetitive patterns or formulaic questions")
        prompt_parts.append("- Be CREATIVE while staying accurate to the textbook")
        prompt_parts.append("- 🛑 DO NOT REPEAT questions from previous runs if possible")
        prompt_parts.append("- 🛑 DO NOT start multiple questions with the same phrase (e.g., 'What is the pronunciation...')")
        prompt_parts.append("- 🛑 DO NOT focus more than 2 questions on the exact same sub-topic (e.g., pronunciation)")
        prompt_parts.append(f"- 🎲 RANDOMIZATION SEED: {timestamp_seed} (use this to vary your selection)")
        prompt_parts.append("")

        # Explicit Dimensions to force diversity
        prompt_parts.append("=== QUESTION DIMENSIONS (MANDATORY MIX) ===")
        prompt_parts.append("To ensure diversity, you MUST generate questions across these 5 dimensions:")
        prompt_parts.append("1. 🧠 FACTUAL RECALL (approx 30%): Direct questions about specific facts, names, lists, or definitions from the text.")
        prompt_parts.append("2. 💡 CONCEPTUAL UNDERSTANDING (approx 20%): Questions asking 'Why', 'How', or explaining relationships between ideas.")
        prompt_parts.append("3. 🌍 APPLICATION/SCENARIO (approx 20%): Apply a concept to a simple situation or identify an example.")
        prompt_parts.append("4. 📖 VOCABULARY & LANGUAGE (approx 15%): Definitions, synonyms, antonyms, or usage of key terms found in the text.")
        prompt_parts.append("5. 🕵️ INFERENCE (approx 15%): Drawing logical conclusions based on evidence in the text (not explicitly stated but implied).")
        prompt_parts.append("⚠️ DO NOT label the questions with these categories in the output, but use them to guide your generation.")
        prompt_parts.append("")
        
        # Chapter Information Section
        if chapter_title or chapter_objectives or topics:
            prompt_parts.append("=== CHAPTER INFORMATION ===")
            
            if chapter_title:
                prompt_parts.append(f"Chapter Title: {chapter_title}")
                prompt_parts.append("")
            
            if topics:
                prompt_parts.append("Main Topics Covered:")
                for i, t in enumerate(topics[:10], 1):  # Limit to 10 topics
                    prompt_parts.append(f"  {i}. {t}")
                prompt_parts.append("")
            
            if chapter_objectives:
                prompt_parts.append("=== LEARNING OBJECTIVES ===")
                if has_explicit_objectives:
                    prompt_parts.append("The following are the OFFICIAL learning objectives from the Ethiopian curriculum textbook:")
                else:
                    prompt_parts.append("The following learning objectives were derived from the chapter content:")
                prompt_parts.append("")
                
                for i, obj in enumerate(chapter_objectives, 1):
                    prompt_parts.append(f"{i}. {obj}")
                prompt_parts.append("")
                
                prompt_parts.append("⚠️ CRITICAL REQUIREMENT:")
                prompt_parts.append("- Your questions MUST directly assess these learning objectives")
                prompt_parts.append("- Ensure EACH objective is covered by at least one question")
                prompt_parts.append("- Questions should test whether students have achieved these specific learning goals")
                prompt_parts.append("- Do NOT create generic questions - tie each question to a specific objective")
                prompt_parts.append("")
        
        # Instructions
        prompt_parts.append("=== QUESTION GENERATION INSTRUCTIONS ===")
        prompt_parts.append("1. **Analyze the Content**: Read the provided text carefully and identify:")
        
        if chapter_objectives:
            prompt_parts.append("   - ✅ **Learning Objectives**: USE THE OBJECTIVES PROVIDED ABOVE")
            prompt_parts.append("   - For each objective, create at least one question that assesses it")
        else:
            prompt_parts.append("   - **Unit Objectives**: Extract what students are supposed to learn from the content")
        
        prompt_parts.append("   - **Key Vocabulary**: Identify new words and terms introduced in the chapter")
        prompt_parts.append("   - **Grammar Points**: Note specific grammar rules taught (e.g., Gerunds, Infinitives, Tenses)")
        prompt_parts.append("   - **Reading Passages**: Use stories, dialogues, and texts provided")
        prompt_parts.append("   - **Activities**: Reference exercises and activities (e.g., 'Activity 3.2') for question ideas")
        prompt_parts.append("   - **Examples and Cases**: Use specific examples, case studies, and scenarios from the text")
        prompt_parts.append("   - **Summaries and Key Points**: Focus on chapter summaries and key takeaways")
        prompt_parts.append("")
        
        prompt_parts.append("2. **Question Design Rules**:")
        prompt_parts.append("   - ❌ **NO External Knowledge**: Do NOT ask general questions about the topic")
        prompt_parts.append("     Example of WRONG question: 'What is road safety?' (too general)")
        prompt_parts.append("     Example of CORRECT question: 'According to the dialogue in Section 3.1, what did Addismiraf identify as a cause of road accidents?'")
        prompt_parts.append("")
        prompt_parts.append("   - ✅ **ONLY Textbook Content**: Questions must be answerable ONLY from the provided text")
        prompt_parts.append("   - ✅ **Cite Specific Sections**: Reference specific parts of the text in explanations")
        prompt_parts.append("   - ✅ **Mimic Textbook Style**: If the text has 'True/False based on listening text', create similar questions")
        prompt_parts.append("   - ✅ **Use Textbook Terminology**: Use the exact terms and vocabulary from the textbook")
        prompt_parts.append("   - ✅ **Reference Activities**: Create questions based on textbook activities and exercises")
        prompt_parts.append("")
        
        prompt_parts.append("   - ❌ **NO Assignment-Type Questions**: This is an ONLINE QUIZ/EXAM, not a classroom assignment")
        prompt_parts.append("     FORBIDDEN question types:")
        prompt_parts.append("     • 'Interview people in your locality...'")
        prompt_parts.append("     • 'Conduct a survey...'")
        prompt_parts.append("     • 'Visit a farm/factory/location...'")
        prompt_parts.append("     • 'Collect samples...'")
        prompt_parts.append("     • 'Prepare a presentation...'")
        prompt_parts.append("     • 'Create a project...'")
        prompt_parts.append("     • 'Research and report...'")
        prompt_parts.append("     • Any question requiring real-world fieldwork or extended time")
        prompt_parts.append("     ✅ INSTEAD: Ask about the CONTENT/CONCEPTS that such activities would teach")
        prompt_parts.append("")
        
        if chapter_objectives:
            prompt_parts.append("3. **Objective Coverage Requirement**:")
            prompt_parts.append(f"   - You must generate {num_questions} questions")
            prompt_parts.append(f"   - Distribute questions across ALL {len(chapter_objectives)} learning objectives")
            prompt_parts.append("   - Each objective must have at least 1 question")
            prompt_parts.append("   - More important objectives may have 2-3 questions")
            prompt_parts.append("   - In the explanation, cite which objective(s) the question assesses")
            prompt_parts.append("   - ⚠️ VARY the approach for each objective (different examples, scenarios, angles)")
            prompt_parts.append("")
        
        prompt_parts.append(f"4. **Question Types and Difficulty**:")
        prompt_parts.append(f"   - Allowed Question Types: {', '.join(question_types)}")
        prompt_parts.append(f"   - Difficulty Level: {difficulty}")
        prompt_parts.append(f"   - Total Questions: {num_questions}")
        prompt_parts.append(f"   - Total Points: {total_points}")
        prompt_parts.append(f"   - Time Limit per Question: {time_limit} seconds")
        prompt_parts.append("")
        
        # Explicit Distribution Strategy
        if question_counts:
             prompt_parts.append("   ⚠️ DISTRIBUTION STRATEGY (MANDATORY COUNTS):")
             prompt_parts.append("   You MUST generate EXACTLY the following distribution:")
             for qt, count in question_counts.items():
                 if count > 0:
                      prompt_parts.append(f"   - {qt.replace('_', ' ').title()}: {count} questions")
             prompt_parts.append("")
        elif len(question_types) > 1:
            prompt_parts.append("   ⚠️ DISTRIBUTION STRATEGY (MANDATORY MIX):")
            prompt_parts.append(f"   You requested multiple question types. You MUST mix them as follows:")
            
            # Dynamic distribution logic
            if 'multiple_choice' in question_types and 'true_false' in question_types:
                prompt_parts.append("   - Multiple Choice: ~40-50%")
                prompt_parts.append("   - True/False: ~20-30%")
                remaining = [qt for qt in question_types if qt not in ['multiple_choice', 'true_false']]
                if remaining:
                    prompt_parts.append(f"   - {', '.join(remaining).title()}: ~20-30%")
            else:
                share = 100 // len(question_types)
                prompt_parts.append(f"   - Distribute evenly: ~{share}% for each type")
            prompt_parts.append("   - DO NOT generate only one type of question!")
            prompt_parts.append("")
        else:
            # STRICT Single Type Enforcement
            prompt_parts.append("   ⚠️ STRICT TYPE ENFORCEMENT:")
            prompt_parts.append(f"   - You MUST generate ONLY '{question_types[0]}' questions.")
            prompt_parts.append(f"   - DO NOT include any other question types.")
            prompt_parts.append(f"   - All {num_questions} questions must be '{question_types[0]}'.")
            prompt_parts.append("")

        # Difficulty Enforcement
        prompt_parts.append("   ⚠️ DIFFICULTY ENFORCEMENT:")
        if difficulty.lower() == 'easy':
            prompt_parts.append("   - Focus on FACTUAL RECALL and DEFINITIONS.")
            prompt_parts.append("   - Use simple language and direct questions.")
            prompt_parts.append("   - Avoid complex scenarios.")
        elif difficulty.lower() == 'medium':
            prompt_parts.append("   - Mix factual questions with CONCEPTUAL UNDERSTANDING.")
            prompt_parts.append("   - Ask 'Why' and 'How' questions.")
            prompt_parts.append("   - Include some simple application scenarios.")
        elif difficulty.lower() == 'hard':
            prompt_parts.append("   - Focus on APPLICATION, ANALYSIS, and INFERENCE.")
            prompt_parts.append("   - Use complex scenarios and case studies.")
            prompt_parts.append("   - Ask students to evaluate or compare concepts.")
            prompt_parts.append("   - Minimize simple recall questions.")
        prompt_parts.append("")
        
        # Add subject-specific guidance
        prompt_parts.append("   **Subject-Specific Question Type Guidance**:")
        if 'work_out' in question_types:
            prompt_parts.append("   - 'Work Out' questions are for mathematical/computational problems")
            prompt_parts.append("   - Include step-by-step solutions in explanations")
            prompt_parts.append("   - Show calculations, formulas, and working")
        if 'essay' in question_types:
            prompt_parts.append("   - 'Essay' questions require extended written responses")
            prompt_parts.append("   - Focus on analysis, explanation, and critical thinking")
            prompt_parts.append("   - NOT suitable for pure mathematical subjects")
        prompt_parts.append("")
        
        prompt_parts.append(f"5. **Point Allocation (AI-Based)**:")
        prompt_parts.append(f"   Assign points to each question such that they SUM EXACTLY to {total_points}.")
        prompt_parts.append("   Distribute points based on:")
        prompt_parts.append("   - Question Type & Difficulty:")
        prompt_parts.append("     • Multiple Choice / True-False: Lower points")
        prompt_parts.append("     • Work Out / Essay: Higher points")
        prompt_parts.append("   - Question Complexity: Adjust based on cognitive demand")
        prompt_parts.append(f"   - ⚠️ IMPORTANT: The total sum of all 'points' fields must correspond to {total_points}.")
        prompt_parts.append("")
        
        prompt_parts.append(f"6. **CRITICAL: Question Count Requirement**:")
        prompt_parts.append(f"   ⚠️ YOU MUST GENERATE EXACTLY {num_questions} QUESTIONS - NO MORE, NO LESS")
        prompt_parts.append(f"   ⚠️ The 'questions' array MUST contain precisely {num_questions} question objects")
        prompt_parts.append(f"   ⚠️ Generating fewer or more than {num_questions} questions is UNACCEPTABLE")
        prompt_parts.append("")
        
        # Add concrete examples
        prompt_parts.append("=== EXAMPLES OF GOOD VS BAD QUESTIONS ===")
        prompt_parts.append("")
        prompt_parts.append("✅ GOOD QUESTION EXAMPLES (Use these as templates):")
        prompt_parts.append("1. 'According to the dialogue in Section 3.1, what did Addismiraf identify as a cause of road accidents?'")
        prompt_parts.append("   - Specific section reference")
        prompt_parts.append("   - Directly from textbook content")
        prompt_parts.append("   - Answerable from the text")
        prompt_parts.append("")
        prompt_parts.append("2. 'What is the effect of road accidents according to Nuhamin?'")
        prompt_parts.append("   - References specific character")
        prompt_parts.append("   - Based on dialogue content")
        prompt_parts.append("   - Clear and direct")
        prompt_parts.append("")
        prompt_parts.append("3. 'How do you pronounce the word 'fight'?'")
        prompt_parts.append("   - Tests pronunciation skill from chapter")
        prompt_parts.append("   - Specific word from vocabulary")
        prompt_parts.append("   - Classroom-appropriate")
        prompt_parts.append("")
        prompt_parts.append("❌ BAD QUESTION EXAMPLES (NEVER create these):")
        prompt_parts.append("1. 'Interview a farmer in your village about milk production'")
        prompt_parts.append("   - Requires external activity")
        prompt_parts.append("   - Not answerable from text")
        prompt_parts.append("   - Assignment-style")
        prompt_parts.append("")
        prompt_parts.append("2. 'Conduct a survey about road safety in your locality'")
        prompt_parts.append("   - Requires fieldwork")
        prompt_parts.append("   - Out-of-classroom activity")
        prompt_parts.append("   - Not quiz-appropriate")
        prompt_parts.append("")
        prompt_parts.append("3. 'What is road safety?' (without textbook reference)")
        prompt_parts.append("   - Too general")
        prompt_parts.append("   - Not tied to specific content")
        prompt_parts.append("   - Could be answered without reading")
        prompt_parts.append("")
        
        # Content Filtering Instruction
        if chapter_title and "Unit" not in chapter_title and "Chapter" not in chapter_title:
             prompt_parts.append(f"⚠️ CONTENT FILTERING: The user wants a quiz specifically for '{chapter_title}'.")
             prompt_parts.append(f"   - IGNORE any content in the provided context that is NOT related to '{chapter_title}'.")
             prompt_parts.append(f"   - If the context contains mixed topics (e.g. from other units), FOCUS ONLY on '{chapter_title}'.")
             prompt_parts.append("")

        # Final count verification
        prompt_parts.append("=== ⚠️ MANDATORY FINAL CHECKS ⚠️ ===")
        prompt_parts.append("")
        prompt_parts.append(f"BEFORE SUBMITTING YOUR RESPONSE:")
        prompt_parts.append(f"1. Count your questions: 1, 2, 3, 4, 5... up to {num_questions}")
        prompt_parts.append(f"2. Verify: Total count = {num_questions}?")
        prompt_parts.append(f"3. If count ≠ {num_questions}, ADD or REMOVE questions NOW")
        prompt_parts.append(f"4. Double-check: 'I have EXACTLY {num_questions} questions in my JSON'")
        prompt_parts.append("")
        prompt_parts.append("🛑 ANTI-REPETITION RULES (STRICT):")
        prompt_parts.append("   - DO NOT start multiple questions with the same phrase (e.g. 'What is...', 'How do...')")
        prompt_parts.append("   - DO NOT focus more than 2 questions on the exact same sub-topic")
        prompt_parts.append("   - DO NOT ask the same question twice with slight rephrasing")
        prompt_parts.append("")
        prompt_parts.append("SELF-CHECK QUESTIONS:")
        prompt_parts.append(f"- Did I count my questions? ___")
        prompt_parts.append(f"- Is my count exactly {num_questions}? ___")
        prompt_parts.append("- Are all questions unique and diverse? ___")
        prompt_parts.append("- Are all questions textbook-based (not assignment-style)? ___")
        prompt_parts.append("- Did I reference specific sections/dialogues/activities? ___")
        prompt_parts.append("- Did I use the CORRECT TITLE provided below? ___")
        prompt_parts.append("- Did I ignore content unrelated to the topic? ___")
        prompt_parts.append("")
        
        # Output Format
        prompt_parts.append("=== OUTPUT FORMAT ===")
        prompt_parts.append("Return a JSON object with this EXACT structure:")
        prompt_parts.append("")
        
        # Force the title to be the extracted chapter title if available
        final_title = f"{chapter_title} - {quiz_type}" if chapter_title else f"{topic} - {quiz_type}"
        # Clean up title if it has "Unit X: Unit X:" duplication
        final_title = final_title.replace("Unit ", "").replace("Chapter ", "") # Simple cleanup, rely on LLM to format nicely but use the core text
        
        # Better title logic:
        if chapter_title:
             title_instruction = f'    "title": "{chapter_title} - {quiz_type}",  // USE THIS EXACT TITLE'
        else:
             title_instruction = f'    "title": "{topic} - {quiz_type}",'

        description_example = f"A {quiz_type.lower()} based on {rag_info}"
        if chapter_objectives:
            description_example += f" assessing {len(chapter_objectives)} learning objectives"
        description_example += " covering key concepts, vocabulary, and skills from the Ethiopian curriculum."
        
        prompt_parts.append("{")
        prompt_parts.append(title_instruction)
        prompt_parts.append(f'    "description": "{description_example}",')
        prompt_parts.append('    "questions": [')
        prompt_parts.append('        {')
        prompt_parts.append('            "text": "Question text (Must be specific to the textbook content)",')
        prompt_parts.append('            "type": "multiple_choice",  // MUST be one of: ' + ', '.join(question_types))
        prompt_parts.append('            "points": 1.0,  // Proportional to difficulty, ensure TOTAL sums to ' + str(total_points) + ')')
        prompt_parts.append(f'            "time_limit": {time_limit},')
        prompt_parts.append('            "options": ["Option A", "Option B", "Option C", "Option D"],  // Only for multiple_choice')
        prompt_parts.append('            "correct_answer": "Option A",  // Or True/False, or sample answer for open-ended')
        
        if chapter_objectives:
            prompt_parts.append('            "explanation": "Explanation citing the specific part of the text AND which learning objective this assesses (e.g., \'This question assesses Objective 2: Students will be able to identify causes of road accidents. In the dialogue, Addismiraf states...\')",')
        else:
            prompt_parts.append('            "explanation": "Explanation citing the specific part of the text (e.g., \'In the dialogue, Addismiraf states that narrow roads are a cause...\')",')
        
        prompt_parts.append('            "hint": "Hint pointing to the relevant section (e.g., \'Review the dialogue in Section 3.1\')"')
        prompt_parts.append('        }')
        prompt_parts.append('    ]')
        prompt_parts.append('}')
        prompt_parts.append("")
        
        # Final Reminders
        prompt_parts.append("=== CRITICAL REMINDERS ===")
        prompt_parts.append("❗ Questions MUST be answerable from the provided textbook content ONLY")
        prompt_parts.append("❗ NO generic or external knowledge questions")
        prompt_parts.append("❗ Cite specific sections, dialogues, activities, or passages in explanations")
        prompt_parts.append("❗ Use exact terminology from the Ethiopian curriculum textbook")
        prompt_parts.append(f"❗ GENERATE EXACTLY {num_questions} QUESTIONS - THIS IS MANDATORY")
        prompt_parts.append("❗ Assign appropriate points based on difficulty and question type")
        prompt_parts.append("❗ NO ASSIGNMENT-TYPE QUESTIONS - No interviews, field work, or projects")
        prompt_parts.append("❗ GENERATE DIVERSE QUESTIONS - Vary cognitive levels, formats, and content focus")
        
        if chapter_objectives:
            prompt_parts.append(f"❗ ENSURE ALL {len(chapter_objectives)} LEARNING OBJECTIVES ARE ASSESSED")
            prompt_parts.append("❗ Each question's explanation must reference which objective it assesses")
        
        prompt_parts.append("")
        
        formatted_prompt = "\n".join(prompt_parts)
        
        # Prepare context part
        context_parts = []
        context_parts.append("=== CURRICULUM CONTENT ===")
        context_parts.append(context)
        context_parts.append("")
        formatted_context = "\n".join(context_parts)
        
        logger.info(f"📝 Built quiz prompt: {len(formatted_prompt)} chars, context: {len(formatted_context)} chars")
        
        return formatted_prompt, formatted_context

    @classmethod
    def build_textbook_aligned_prompt(
        cls,
        context: str,
        topic: str,
        subject: str,
        grade_level: str,
        quiz_type: str,
        difficulty: str,
        num_questions: int,
        question_types: List[str],
        rag_info: str,
        chapter_title: Optional[str] = None,
        chapter_objectives: Optional[List[str]] = None,
        topics: Optional[List[str]] = None,
        has_explicit_objectives: bool = False,
        time_limit: int = 60,
        total_points: int = 10,
        question_counts: Optional[Dict[str, int]] = None
    ) -> str:
        """
        Legacy method for backward compatibility.
        Combines prompt and context into a single string.
        """
        prompt, context_part = cls.build_quiz_prompt_and_context(
            context=context,
            topic=topic,
            subject=subject,
            grade_level=grade_level,
            quiz_type=quiz_type,
            difficulty=difficulty,
            num_questions=num_questions,
            question_types=question_types,
            rag_info=rag_info,
            chapter_title=chapter_title,
            chapter_objectives=chapter_objectives,
            topics=topics,
            has_explicit_objectives=has_explicit_objectives,
            time_limit=time_limit,
            total_points=total_points,
            question_counts=question_counts
        )
        
        return f"{prompt}\n\n{context_part}"
