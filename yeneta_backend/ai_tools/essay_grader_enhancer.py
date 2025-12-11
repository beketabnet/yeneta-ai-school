"""
Essay Grader Enhancer for QuickGrader.
Provides robust, comprehensive grading for essays, assignments, exams, and group work.
"""
import logging
import json
import re
from typing import Dict, List, Optional, Tuple, Any

logger = logging.getLogger(__name__)


class EssayGraderEnhancer:
    """Enhances essay grading with comprehensive rubric analysis and feedback generation."""
    
    # Supported assessment types
    ASSESSMENT_TYPES = {
        'essay': 'Essay/Written Assignment',
        'exam': 'Examination',
        'project': 'Project/Research Paper',
        'group_work': 'Group Work/Collaboration',
        'lab_report': 'Lab Report',
        'presentation': 'Presentation',
        'homework': 'Homework Assignment',
        'quiz': 'Quiz/Short Answer',
        'creative_writing': 'Creative Writing',
        'analysis': 'Critical Analysis'
    }
    
    @classmethod
    def parse_rubric(cls, rubric_data: Any) -> Dict:
        """
        Parse rubric from various formats (JSON, text, structured).
        
        Args:
            rubric_data: Rubric in any format
            
        Returns:
            Standardized rubric dictionary
        """
        if isinstance(rubric_data, dict):
            # Already structured
            return cls._validate_rubric_structure(rubric_data)
        
        elif isinstance(rubric_data, str):
            # Try to parse as JSON first
            try:
                parsed = json.loads(rubric_data)
                return cls._validate_rubric_structure(parsed)
            except json.JSONDecodeError:
                # Parse as text rubric
                return cls._parse_text_rubric(rubric_data)
        
        elif isinstance(rubric_data, list):
            # List of criteria
            return {
                'criteria': rubric_data,
                'total_points': sum(c.get('points', 10) for c in rubric_data),
                'type': 'structured'
            }
        
        else:
            logger.warning(f"Unknown rubric format: {type(rubric_data)}")
            return {
                'criteria': [],
                'total_points': 100,
                'type': 'generic',
                'raw': str(rubric_data)
            }
    
    @classmethod
    def _validate_rubric_structure(cls, rubric: Dict) -> Dict:
        """Validate and standardize rubric structure."""
        if 'criteria' not in rubric:
            # Try to extract criteria from various keys
            if 'rubric' in rubric:
                rubric['criteria'] = rubric['rubric']
            elif 'items' in rubric:
                rubric['criteria'] = rubric['items']
            else:
                rubric['criteria'] = []
        
        if 'total_points' not in rubric:
            if isinstance(rubric['criteria'], list):
                rubric['total_points'] = sum(
                    c.get('points', c.get('max_score', 10)) 
                    for c in rubric['criteria']
                )
            else:
                rubric['total_points'] = 100
        
        rubric['type'] = rubric.get('type', 'structured')
        
        return rubric
    
    @classmethod
    def _parse_text_rubric(cls, text: str) -> Dict:
        """Parse text-based rubric into structured format."""
        criteria = []
        lines = text.strip().split('\n')
        
        current_criterion = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if line is a criterion header
            # Patterns: "1. Criterion Name (10 points)", "Criterion: Description", etc.
            criterion_match = re.match(
                r'^(\d+[\.\)]\s*)?([^:(]+)[\s:]*(\((\d+)\s*(?:points?|pts?)\))?',
                line,
                re.IGNORECASE
            )
            
            if criterion_match:
                if current_criterion:
                    criteria.append(current_criterion)
                
                name = criterion_match.group(2).strip()
                points_str = criterion_match.group(4)
                points = int(points_str) if points_str else 10
                
                current_criterion = {
                    'name': name,
                    'points': points,
                    'description': ''
                }
            elif current_criterion:
                # Add to description
                current_criterion['description'] += ' ' + line
        
        if current_criterion:
            criteria.append(current_criterion)
        
        # If no criteria found, create generic ones
        if not criteria:
            criteria = [
                {'name': 'Content Quality', 'points': 30, 'description': 'Quality and relevance of content'},
                {'name': 'Organization', 'points': 20, 'description': 'Structure and flow'},
                {'name': 'Language Use', 'points': 20, 'description': 'Grammar, vocabulary, and style'},
                {'name': 'Critical Thinking', 'points': 20, 'description': 'Analysis and reasoning'},
                {'name': 'Presentation', 'points': 10, 'description': 'Format and presentation'}
            ]
        
        total_points = sum(c['points'] for c in criteria)
        
        return {
            'criteria': criteria,
            'total_points': total_points,
            'type': 'text_parsed',
            'original_text': text
        }
    
    @classmethod
    def build_grading_prompt(
        cls,
        submission_text: str,
        rubric: Dict,
        assignment_description: str,
        assessment_type: str = 'essay',
        grade_level: Optional[str] = None,
        additional_context: Optional[Dict] = None
    ) -> str:
        """
        Build comprehensive grading prompt for LLM.
        
        Args:
            submission_text: Student's submission
            rubric: Parsed rubric
            assignment_description: Assignment prompt/description
            assessment_type: Type of assessment
            grade_level: Student grade level
            additional_context: Additional grading context
            
        Returns:
            Formatted grading prompt
        """
        prompt_parts = []
        
        # Header
        prompt_parts.append("You are an expert Ethiopian educator with extensive experience in assessment and grading.")
        prompt_parts.append(f"You are grading a {cls.ASSESSMENT_TYPES.get(assessment_type, 'submission')}.")
        
        if grade_level:
            prompt_parts.append(f"This is for {grade_level} students.")
        
        prompt_parts.append("")
        
        # Assignment context
        prompt_parts.append("=== ASSIGNMENT DESCRIPTION ===")
        prompt_parts.append(assignment_description)
        prompt_parts.append("")
        
        # Rubric
        prompt_parts.append("=== GRADING RUBRIC ===")
        
        if rubric.get('type') == 'text_parsed' and rubric.get('original_text'):
            prompt_parts.append(rubric['original_text'])
        else:
            prompt_parts.append(f"Total Points: {rubric['total_points']}")
            prompt_parts.append("")
            
            for i, criterion in enumerate(rubric.get('criteria', []), 1):
                name = criterion.get('name', f'Criterion {i}')
                points = criterion.get('points', criterion.get('max_score', 10))
                desc = criterion.get('description', '')
                
                prompt_parts.append(f"{i}. {name} ({points} points)")
                if desc:
                    prompt_parts.append(f"   {desc}")
                prompt_parts.append("")
        
        # Student submission
        prompt_parts.append("=== STUDENT SUBMISSION ===")
        prompt_parts.append(submission_text)
        prompt_parts.append("")
        
        # Grading instructions
        prompt_parts.append("=== GRADING INSTRUCTIONS ===")
        prompt_parts.append("")
        
        prompt_parts.append("**Your Task:**")
        prompt_parts.append("1. Carefully read and analyze the student's submission")
        prompt_parts.append("2. Evaluate against each criterion in the rubric")
        prompt_parts.append("3. Provide specific, constructive feedback")
        prompt_parts.append("4. Calculate accurate scores")
        prompt_parts.append("5. Identify strengths and areas for improvement")
        prompt_parts.append("")
        
        prompt_parts.append("**Grading Principles:**")
        prompt_parts.append("• Be FAIR and OBJECTIVE - base scores on rubric criteria")
        prompt_parts.append("• Be SPECIFIC - cite examples from the submission")
        prompt_parts.append("• Be CONSTRUCTIVE - provide actionable feedback")
        prompt_parts.append("• Be ENCOURAGING - acknowledge strengths")
        prompt_parts.append("• Be EDUCATIONAL - help student learn and improve")
        prompt_parts.append("• Use Ethiopian educational standards and context")
        prompt_parts.append("")
        
        prompt_parts.append("**Language & Accessibility:**")
        prompt_parts.append("• If the submission is in a non-English language (e.g., Amharic, Oromo, Tigrinya):")
        prompt_parts.append("  1. Identify the language and proceed with grading based on content substance")
        prompt_parts.append("  2. Do NOT penalize for language unless the rubric explicitly assesses English proficiency")
        prompt_parts.append("  3. Provide all feedback and criteria assessment in English")
        prompt_parts.append("  4. Note the submission language in the overall feedback")
        prompt_parts.append("")
        
        # Assessment-specific guidance
        if assessment_type == 'essay':
            prompt_parts.append("**Essay-Specific Guidance:**")
            prompt_parts.append("• Evaluate thesis clarity and argument strength")
            prompt_parts.append("• Assess evidence quality and citation")
            prompt_parts.append("• Check organization and paragraph structure")
            prompt_parts.append("• Review language use and writing mechanics")
            prompt_parts.append("")
        
        elif assessment_type == 'exam':
            prompt_parts.append("**Exam-Specific Guidance:**")
            prompt_parts.append("• Check factual accuracy and completeness")
            prompt_parts.append("• Evaluate understanding of concepts")
            prompt_parts.append("• Assess problem-solving approach")
            prompt_parts.append("• Award partial credit where appropriate")
            prompt_parts.append("")
        
        elif assessment_type == 'group_work':
            prompt_parts.append("**Group Work-Specific Guidance:**")
            prompt_parts.append("• Evaluate collaboration evidence")
            prompt_parts.append("• Assess individual contributions (if visible)")
            prompt_parts.append("• Check coordination and teamwork quality")
            prompt_parts.append("• Review final product quality")
            prompt_parts.append("")
        
        elif assessment_type == 'project':
            prompt_parts.append("**Project-Specific Guidance:**")
            prompt_parts.append("• Evaluate research depth and breadth")
            prompt_parts.append("• Assess methodology and approach")
            prompt_parts.append("• Check analysis and conclusions")
            prompt_parts.append("• Review presentation and documentation")
            prompt_parts.append("")
        
        # Additional context
        if additional_context:
            prompt_parts.append("=== ADDITIONAL CONTEXT ===")
            for key, value in additional_context.items():
                prompt_parts.append(f"{key}: {value}")
            prompt_parts.append("")
        
        # Output format
        prompt_parts.append("=== REQUIRED OUTPUT FORMAT ===")
        prompt_parts.append("")
        prompt_parts.append("IMPORTANT: You must return ONLY valid JSON. No conversational text.")
        prompt_parts.append("Provide your grading as a JSON object with this EXACT structure:")
        prompt_parts.append("")
        
        example_criteria = []
        for criterion in rubric.get('criteria', [])[:3]:  # Show first 3 as example
            name = criterion.get('name', 'Criterion')
            points = criterion.get('points', 10)
            example_criteria.append({
                'criterion': name,
                'score': points,
                'max_score': points,
                'feedback': f'Specific feedback for {name}'
            })
        
        output_format = {
            'overallScore': 85,
            'maxScore': rubric['total_points'],
            'overallFeedback': 'Comprehensive overall feedback (3-5 sentences)',
            'criteriaFeedback': example_criteria,
            'strengths': [
                'Specific strength 1 with example',
                'Specific strength 2 with example',
                'Specific strength 3 with example'
            ],
            'areasForImprovement': [
                'Specific area 1 with actionable suggestion',
                'Specific area 2 with actionable suggestion',
                'Specific area 3 with actionable suggestion'
            ],
            'grade_letter': 'B+',
            'recommendations': [
                'Specific recommendation for future work'
            ]
        }
        
        prompt_parts.append(json.dumps(output_format, indent=2))
        prompt_parts.append("")
        
        prompt_parts.append("**CRITICAL REQUIREMENTS:**")
        prompt_parts.append("• Provide feedback for EVERY criterion in the rubric")
        prompt_parts.append("• Scores must be within the point range for each criterion")
        prompt_parts.append("• Overall score must equal sum of criteria scores")
        prompt_parts.append("• Cite specific examples from the submission")
        prompt_parts.append("• Be thorough, fair, and constructive")
        prompt_parts.append("• RETURN ONLY VALID JSON")
        prompt_parts.append("")
        
        formatted_prompt = "\n".join(prompt_parts)
        
        logger.info(f"📝 Grading prompt: {len(formatted_prompt)} chars, {len(rubric.get('criteria', []))} criteria")
        
        return formatted_prompt
    
    @classmethod
    def validate_grading_result(cls, result: Dict, rubric: Dict) -> Tuple[bool, List[str]]:
        """
        Validate grading result for completeness and accuracy.
        
        Args:
            result: Grading result from LLM
            rubric: Original rubric
            
        Returns:
            Tuple of (is_valid, warnings)
        """
        warnings = []
        is_valid = True
        
        # Check required fields
        required_fields = ['overallScore', 'overallFeedback', 'criteriaFeedback']
        for field in required_fields:
            if field not in result:
                warnings.append(f"❌ Missing required field: {field}")
                is_valid = False
        
        # Check overall score
        if 'overallScore' in result:
            overall = result['overallScore']
            max_score = rubric.get('total_points', 100)
            
            if not isinstance(overall, (int, float)):
                warnings.append(f"❌ Overall score is not a number: {overall}")
                is_valid = False
            elif overall < 0 or overall > max_score:
                warnings.append(f"⚠️ Overall score {overall} is outside valid range (0-{max_score})")
        
        # Check criteria feedback
        if 'criteriaFeedback' in result:
            criteria_feedback = result['criteriaFeedback']
            rubric_criteria = rubric.get('criteria', [])
            
            if len(criteria_feedback) != len(rubric_criteria):
                warnings.append(
                    f"⚠️ Criteria count mismatch: {len(criteria_feedback)} provided, "
                    f"{len(rubric_criteria)} expected"
                )
            
            # Validate each criterion
            for i, cf in enumerate(criteria_feedback):
                if 'criterion' not in cf:
                    warnings.append(f"⚠️ Criterion {i+1} missing name")
                
                if 'score' not in cf:
                    warnings.append(f"⚠️ Criterion {i+1} missing score")
                    is_valid = False
                
                if 'feedback' not in cf or not cf['feedback']:
                    warnings.append(f"⚠️ Criterion {i+1} missing feedback")
        
        # Check feedback quality
        if 'overallFeedback' in result:
            feedback = result['overallFeedback']
            if len(feedback) < 50:
                warnings.append("⚠️ Overall feedback is too brief (< 50 chars)")
        
        # Check strengths and improvements
        if 'strengths' not in result or len(result.get('strengths', [])) == 0:
            warnings.append("ℹ️ No strengths identified")
        
        if 'areasForImprovement' not in result or len(result.get('areasForImprovement', [])) == 0:
            warnings.append("ℹ️ No areas for improvement identified")
        
        logger.info(f"✅ Validation: valid={is_valid}, warnings={len(warnings)}")
        
        return is_valid, warnings
    
    @classmethod
    def enhance_grading_result(cls, result: Dict, rubric: Dict, submission_meta: Dict) -> Dict:
        """
        Enhance grading result with additional metadata and formatting.
        
        Args:
            result: Grading result
            rubric: Rubric used
            submission_meta: Submission metadata
            
        Returns:
            Enhanced result
        """
        enhanced = result.copy()
        
        # Add metadata
        enhanced['grading_metadata'] = {
            'rubric_type': rubric.get('type', 'unknown'),
            'total_criteria': len(rubric.get('criteria', [])),
            'max_possible_score': rubric.get('total_points', 100),
            'score_percentage': round((result.get('overallScore', 0) / rubric.get('total_points', 100)) * 100, 2),
            'submission_length': len(submission_meta.get('text', '')),
            'word_count': len(submission_meta.get('text', '').split())
        }
        
        # Calculate grade letter if not provided
        if 'grade_letter' not in enhanced:
            score_pct = enhanced['grading_metadata']['score_percentage']
            enhanced['grade_letter'] = cls._calculate_grade_letter(score_pct)
        
        # Add performance level
        score_pct = enhanced['grading_metadata']['score_percentage']
        if score_pct >= 90:
            enhanced['performance_level'] = 'Excellent'
        elif score_pct >= 80:
            enhanced['performance_level'] = 'Very Good'
        elif score_pct >= 70:
            enhanced['performance_level'] = 'Good'
        elif score_pct >= 60:
            enhanced['performance_level'] = 'Satisfactory'
        elif score_pct >= 50:
            enhanced['performance_level'] = 'Fair'
        else:
            enhanced['performance_level'] = 'Needs Improvement'
        
        # Format criteria feedback with percentages
        if 'criteriaFeedback' in enhanced:
            for cf in enhanced['criteriaFeedback']:
                if 'score' in cf and 'max_score' in cf:
                    cf['percentage'] = round((cf['score'] / cf['max_score']) * 100, 1)
        
        logger.info(f"✨ Enhanced result: {enhanced['performance_level']}, {enhanced['grade_letter']}")
        
        return enhanced
    
    @classmethod
    def _calculate_grade_letter(cls, percentage: float) -> str:
        """Calculate letter grade from percentage."""
        if percentage >= 90:
            return 'A'
        elif percentage >= 85:
            return 'A-'
        elif percentage >= 80:
            return 'B+'
        elif percentage >= 75:
            return 'B'
        elif percentage >= 70:
            return 'B-'
        elif percentage >= 65:
            return 'C+'
        elif percentage >= 60:
            return 'C'
        elif percentage >= 55:
            return 'C-'
        elif percentage >= 50:
            return 'D'
        else:
            return 'F'
