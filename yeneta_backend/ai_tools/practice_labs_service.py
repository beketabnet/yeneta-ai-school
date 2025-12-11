"""
Practice Labs Enhanced Service
Implements ZPD-based difficulty, two-layer hints, misconception detection,
and badges/missions system based on research document.
"""

import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ZPDCalculator:
    """
    Zone of Proximal Development (ZPD) Calculator
    Maps student mastery to optimal question complexity (0.0-1.0 scale)
    """
    
    @staticmethod
    def calculate_zpd_score(mastery_percentage: float) -> float:
        """
        Calculate ZPD complexity score from mastery percentage.
        Research doc: "10% more challenging than current competence"
        
        Args:
            mastery_percentage: Student's mastery level (0-100)
            
        Returns:
            ZPD complexity score (0.0-1.0)
        """
        # Convert mastery to 0-1 scale
        mastery = mastery_percentage / 100.0
        
        # ZPD sweet spot: 10% above current mastery
        zpd_score = min(1.0, mastery + 0.1)
        
        # Ensure minimum challenge
        zpd_score = max(0.3, zpd_score)
        
        return round(zpd_score, 2)
    
    @staticmethod
    def zpd_to_difficulty(zpd_score: float) -> str:
        """
        Convert ZPD score to difficulty label.
        
        Args:
            zpd_score: ZPD complexity score (0.0-1.0)
            
        Returns:
            Difficulty level: 'easy', 'medium', or 'hard'
        """
        if zpd_score < 0.4:
            return 'easy'
        elif zpd_score < 0.7:
            return 'medium'
        else:
            return 'hard'
    
    @staticmethod
    def update_mastery(
        current_mastery: float,
        is_correct: bool,
        question_difficulty: str
    ) -> float:
        """
        Update mastery level based on performance.
        
        Args:
            current_mastery: Current mastery percentage (0-100)
            is_correct: Whether answer was correct
            question_difficulty: Question difficulty level
            
        Returns:
            Updated mastery percentage
        """
        # Difficulty multipliers
        difficulty_weights = {
            'easy': 0.5,
            'medium': 1.0,
            'hard': 1.5
        }
        
        weight = difficulty_weights.get(question_difficulty, 1.0)
        
        if is_correct:
            # Increase mastery (diminishing returns at high mastery)
            gain = (100 - current_mastery) * 0.1 * weight
            new_mastery = min(100, current_mastery + gain)
        else:
            # Decrease mastery slightly
            loss = current_mastery * 0.05 * weight
            new_mastery = max(0, current_mastery - loss)
        
        return round(new_mastery, 2)


class MisconceptionDetector:
    """
    Detects and tracks student misconception patterns.
    Based on research doc's misconception pattern analysis.
    """
    
    # Common misconception patterns by subject
    MISCONCEPTION_PATTERNS = {
        'Mathematics': [
            'Sign errors in algebra',
            'Order of operations confusion',
            'Fraction manipulation errors',
            'Variable isolation mistakes',
            'Geometric formula misapplication',
            'Unit conversion errors'
        ],
        'Physics': [
            'Force and motion confusion',
            'Energy conservation misunderstanding',
            'Vector direction errors',
            'Unit inconsistency',
            'Formula misapplication'
        ],
        'Chemistry': [
            'Balancing equation errors',
            'Mole concept confusion',
            'Oxidation state mistakes',
            'Periodic table misinterpretation',
            'Reaction type confusion'
        ],
        'Biology': [
            'Cell structure confusion',
            'Genetic inheritance errors',
            'Ecosystem relationship misunderstanding',
            'Classification mistakes'
        ]
    }
    
    @staticmethod
    def detect_misconceptions(
        subject: str,
        question: str,
        student_answer: str,
        correct_answer: str,
        is_correct: bool
    ) -> List[str]:
        """
        Detect potential misconceptions from student answer.
        
        Args:
            subject: Subject area
            question: Question text
            student_answer: Student's answer
            correct_answer: Correct answer
            is_correct: Whether answer was correct
            
        Returns:
            List of detected misconception types
        """
        if is_correct:
            return []
        
        misconceptions = []
        
        # Pattern matching based on subject
        patterns = MisconceptionDetector.MISCONCEPTION_PATTERNS.get(subject, [])
        
        # Simple keyword-based detection (can be enhanced with ML)
        answer_lower = student_answer.lower()
        question_lower = question.lower()
        
        # Mathematics misconceptions
        if subject == 'Mathematics':
            if 'negative' in question_lower and '-' not in student_answer and '-' in correct_answer:
                misconceptions.append('Sign errors in algebra')
            if ('*' in question_lower or '×' in question_lower) and ('+' in student_answer or '-' in student_answer):
                misconceptions.append('Order of operations confusion')
        
        # Physics misconceptions
        elif subject == 'Physics':
            if 'force' in question_lower and 'acceleration' in answer_lower and 'mass' not in answer_lower:
                misconceptions.append('Force and motion confusion')
        
        # Return detected misconceptions
        return misconceptions[:3]  # Limit to top 3
    
    @staticmethod
    def get_remediation(misconception_type: str) -> str:
        """
        Get remediation strategy for a misconception.
        
        Args:
            misconception_type: Type of misconception
            
        Returns:
            Remediation suggestion
        """
        remediations = {
            'Sign errors in algebra': 'Practice tracking positive and negative signs through each step. Use color coding.',
            'Order of operations confusion': 'Remember PEMDAS/BODMAS. Practice with parentheses first.',
            'Fraction manipulation errors': 'Review finding common denominators. Practice with visual models.',
            'Variable isolation mistakes': 'Practice inverse operations step-by-step. Check your work backwards.',
            'Force and motion confusion': 'Review Newton\'s laws. Draw free-body diagrams for each problem.',
            'Balancing equation errors': 'Count atoms systematically. Start with the most complex molecule.',
        }
        
        return remediations.get(misconception_type, 'Review the concept and practice similar problems.')


class BadgeSystem:
    """
    Manages badges and achievements for gamification.
    Based on research doc's gamification requirements.
    """
    
    # Badge definitions
    BADGES = {
        'first_question': {
            'id': 'first_question',
            'name': 'First Steps',
            'description': 'Completed your first practice question',
            'icon': '🎯',
            'category': 'achievement',
            'requirement': 'Complete 1 question'
        },
        'streak_5': {
            'id': 'streak_5',
            'name': 'On Fire',
            'description': '5 correct answers in a row',
            'icon': '🔥',
            'category': 'streak',
            'requirement': '5-question streak'
        },
        'streak_10': {
            'id': 'streak_10',
            'name': 'Unstoppable',
            'description': '10 correct answers in a row',
            'icon': '⚡',
            'category': 'streak',
            'requirement': '10-question streak'
        },
        'accuracy_100': {
            'id': 'accuracy_100',
            'name': 'Perfect Score',
            'description': '100% accuracy on 10 questions',
            'icon': '💯',
            'category': 'achievement',
            'requirement': '10 questions with 100% accuracy'
        },
        'subject_master_50': {
            'id': 'subject_master_50',
            'name': 'Subject Master',
            'description': 'Completed 50 questions in one subject',
            'icon': '📚',
            'category': 'mastery',
            'requirement': '50 questions in one subject'
        },
        'resilience': {
            'id': 'resilience',
            'name': 'Resilient Learner',
            'description': 'Completed 10 problems without hints',
            'icon': '💪',
            'category': 'resilience',
            'requirement': '10 questions without hints'
        },
        'speed_demon': {
            'id': 'speed_demon',
            'name': 'Speed Demon',
            'description': 'Answered 5 questions in under 5 minutes',
            'icon': '⚡',
            'category': 'speed',
            'requirement': '5 questions in <5 minutes'
        }
    }
    
    @staticmethod
    def check_badge_eligibility(
        total_questions: int,
        correct_count: int,
        streak: int,
        subject_counts: Dict[str, int],
        hints_used: int,
        time_spent: int
    ) -> List[Dict]:
        """
        Check which badges should be awarded.
        
        Returns:
            List of newly earned badges
        """
        earned_badges = []
        
        # First question
        if total_questions == 1:
            earned_badges.append(BadgeSystem.BADGES['first_question'])
        
        # Streaks
        if streak == 5:
            earned_badges.append(BadgeSystem.BADGES['streak_5'])
        elif streak == 10:
            earned_badges.append(BadgeSystem.BADGES['streak_10'])
        
        # Perfect accuracy
        if total_questions >= 10 and correct_count == total_questions:
            earned_badges.append(BadgeSystem.BADGES['accuracy_100'])
        
        # Subject mastery
        for subject, count in subject_counts.items():
            if count == 50:
                earned_badges.append(BadgeSystem.BADGES['subject_master_50'])
        
        # Resilience (no hints)
        if total_questions >= 10 and hints_used == 0:
            earned_badges.append(BadgeSystem.BADGES['resilience'])
        
        # Speed
        if total_questions >= 5 and time_spent < 300:  # 5 minutes
            earned_badges.append(BadgeSystem.BADGES['speed_demon'])
        
        return earned_badges


class MissionSystem:
    """
    Manages daily/weekly missions and challenges.
    Based on research doc's gamification requirements.
    """
    
    @staticmethod
    def generate_daily_missions() -> List[Dict]:
        """
        Generate daily missions for students.
        
        Returns:
            List of daily missions
        """
        missions = [
            {
                'id': 'daily_5_questions',
                'title': 'Daily Practice',
                'description': 'Complete 5 practice questions today',
                'type': 'daily',
                'target': 5,
                'current': 0,
                'reward': {'xp': 50, 'badge': None},
                'expiresAt': datetime.now() + timedelta(days=1)
            },
            {
                'id': 'daily_3_correct',
                'title': 'Accuracy Challenge',
                'description': 'Get 3 questions correct in a row',
                'type': 'daily',
                'target': 3,
                'current': 0,
                'reward': {'xp': 30, 'badge': None},
                'expiresAt': datetime.now() + timedelta(days=1)
            },
            {
                'id': 'daily_no_hints',
                'title': 'Independent Thinker',
                'description': 'Answer 3 questions without using hints',
                'type': 'daily',
                'target': 3,
                'current': 0,
                'reward': {'xp': 40, 'badge': None},
                'expiresAt': datetime.now() + timedelta(days=1)
            }
        ]
        
        return missions
    
    @staticmethod
    def generate_weekly_missions() -> List[Dict]:
        """
        Generate weekly missions for students.
        
        Returns:
            List of weekly missions
        """
        missions = [
            {
                'id': 'weekly_25_questions',
                'title': 'Weekly Warrior',
                'description': 'Complete 25 practice questions this week',
                'type': 'weekly',
                'target': 25,
                'current': 0,
                'reward': {'xp': 200, 'badge': 'Weekly Champion'},
                'expiresAt': datetime.now() + timedelta(weeks=1)
            },
            {
                'id': 'weekly_3_subjects',
                'title': 'Multi-Subject Master',
                'description': 'Practice in 3 different subjects this week',
                'type': 'weekly',
                'target': 3,
                'current': 0,
                'reward': {'xp': 150, 'badge': None},
                'expiresAt': datetime.now() + timedelta(weeks=1)
            }
        ]
        
        return missions


class TwoLayerHintGenerator:
    """
    Generates two-layer hints as per research document.
    Layer 1: Minimal one-line hint
    Layer 2: Detailed step-by-step breakdown
    """
    
    @staticmethod
    def generate_hints_prompt(
        question: str,
        correct_answer: str,
        difficulty: str
    ) -> str:
        """
        Generate prompt for two-layer hint system.
        
        Returns:
            Prompt for LLM to generate layered hints
        """
        return f"""Generate a two-layer hint system for this question:

Question: {question}
Correct Answer: {correct_answer}
Difficulty: {difficulty}

**CRITICAL: Return ONLY a valid JSON object with this exact structure:**

{{
    "minimalHint": "A single-line gentle nudge (one sentence, no more than 15 words)",
    "detailedHint": "Step-by-step breakdown: 1. First step description 2. Second step description 3. Third step description"
}}

**Layer 1 (Minimal Hint) Guidelines:**
- One sentence only
- Gentle nudge in the right direction
- Don't give away the answer
- Help student think about the approach
- Example: "Think about what happens to the variable when you move terms across the equals sign"

**Layer 2 (Detailed Hint) Guidelines:**
- Numbered step-by-step breakdown
- Each step should be clear and specific
- Guide through the solution process
- Still encourage student to do the work
- Example: "1. Identify the variable you need to isolate 2. Move all terms with the variable to one side 3. Move constants to the other side 4. Simplify and solve"

Make hints appropriate for {difficulty} difficulty level."""
