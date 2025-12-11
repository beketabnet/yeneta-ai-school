# Dynamic Question Style Generation - November 8, 2025

## Overview
Implemented intelligent question style selection that adapts based on difficulty level, coach personality, adaptive mode, grade level, and RAG sources to provide varied and pedagogically appropriate practice questions.

---

## ✅ Implementation Complete

### **Core Feature**
The AI now dynamically selects question types and styles based on:
1. **Difficulty Level** (Easy, Medium, Hard)
2. **Grade Level** (KG, 1-12)
3. **Coach Personality** (Patient, Energetic, Analyst)
4. **Adaptive Difficulty Mode** (ON/OFF)
5. **RAG Sources** (Exam RAG, Curriculum RAG)

---

## 📊 Question Type Distribution

### **11 Question Types Available**:

1. **Multiple Choice** - 4 options, one correct answer
   - Good for: Knowledge recall, understanding
   - Best for: All difficulty levels

2. **True/False** - Binary choice
   - Good for: Specific facts, common misconceptions
   - Best for: Easy to Medium difficulty

3. **Short Answer** - 1-3 sentence response
   - Good for: Understanding, application
   - Best for: Medium to Hard difficulty

4. **Essay** - Paragraph response
   - Good for: Analysis, synthesis, critical thinking
   - Best for: Hard difficulty, Grades 9-12

5. **Fill-in-the-Blank** - Complete the sentence
   - Good for: Vocabulary, key concepts
   - Best for: Easy to Medium difficulty

6. **Problem Solving** - Multi-step mathematical/logical problem
   - Good for: Application, reasoning
   - Best for: Hard difficulty, STEM subjects

7. **Define** - Define a term or concept
   - Good for: Terminology, foundational knowledge
   - Best for: All difficulty levels

8. **Explain** - Explain a process, concept, or relationship
   - Good for: Understanding, comprehension
   - Best for: Medium to Hard difficulty

9. **Describe** - Describe characteristics, features, observations
   - Good for: Observation, detail recognition
   - Best for: All difficulty levels

10. **Compare/Contrast** - Identify similarities and differences
    - Good for: Analysis, critical thinking
    - Best for: Medium to Hard difficulty

11. **Analyze** - Break down and examine components
    - Good for: Deep understanding, critical thinking
    - Best for: Hard difficulty, Grades 10-12

---

## 🎯 Difficulty-Based Distribution

### **Easy Difficulty**:
```
Distribution:
- 50% Multiple Choice
- 30% True/False
- 15% Fill-in-the-Blank
- 5% Short Answer

Focus: Knowledge recall, basic understanding
Question Types: Multiple Choice, True/False, Fill-in-the-Blank, Define
```

### **Medium Difficulty**:
```
Distribution:
- 35% Multiple Choice
- 30% Short Answer
- 20% Fill-in-the-Blank
- 10% True/False
- 5% Essay

Focus: Understanding, application
Question Types: Multiple Choice, Short Answer, Fill-in-the-Blank, Explain, Describe
```

### **Hard Difficulty**:
```
Distribution:
- 40% Short Answer
- 25% Essay
- 20% Multiple Choice
- 10% Problem Solving
- 5% Fill-in-the-Blank

Focus: Analysis, synthesis, critical thinking
Question Types: Short Answer, Essay, Problem Solving, Analyze, Compare/Contrast
```

---

## 🎓 Grade Level Adjustments

### **KG - Grade 4** (Young Learners):
```
Characteristics:
- Simple language
- Visual descriptions
- Concrete examples
- Short, focused questions

Preferred Types:
- Multiple Choice (with pictures/simple options)
- True/False
- Fill-in-the-Blank (simple)
- Define (basic terms)

Example:
"Which animal lives in water?
A) Cat  B) Fish  C) Dog  D) Bird"
```

### **Grades 5-8** (Middle Grades):
```
Characteristics:
- Balance recall and application
- Real-world Ethiopian contexts
- Mix of question types
- Moderate complexity

Preferred Types:
- Multiple Choice
- Short Answer
- Fill-in-the-Blank
- Explain
- Describe

Example:
"Explain how the water cycle affects agriculture in Ethiopia."
```

### **Grades 9-10** (Secondary):
```
Characteristics:
- Critical thinking emphasis
- Multi-step problems
- Analytical questions
- Subject-specific depth

Preferred Types:
- Short Answer
- Essay
- Problem Solving
- Compare/Contrast
- Analyze

Example:
"Compare the economic systems of Ethiopia before and after 1991. 
Analyze the key differences in trade policies."
```

### **Grades 11-12** (Preparatory):
```
Characteristics:
- Exam readiness focus
- Deep understanding
- National exam formats
- Advanced reasoning

Preferred Types:
- Essay
- Problem Solving
- Analyze
- Compare/Contrast
- Multi-step Short Answer

Example:
"Analyze the factors that led to the Ethiopian Revolution of 1974. 
Discuss the political, economic, and social causes in detail."
```

---

## 🎭 Coach Personality Styles

### **Patient Coach**:
```
Approach:
- Gentle, encouraging language
- Break complex concepts into smaller steps
- Scaffolding approach
- Supportive tone

Question Preferences:
- Guided questions with helpful hints
- Step-by-step problem solving
- Clear, structured questions
- Emphasis on learning process

Question Style:
"Let's explore photosynthesis step by step.
First, what do plants need to make food? (Hint: Think about sunlight)"

Hint Style:
- "Let's think about this together..."
- "Remember when we learned about..."
- "Try breaking this into smaller parts..."
```

### **Energetic Coach**:
```
Approach:
- Dynamic, engaging language
- Exciting and challenging questions
- Creative and thought-provoking
- Enthusiastic tone

Question Preferences:
- Mix question types frequently
- Include creative scenarios
- Real-world applications
- Interactive elements

Question Style:
"Imagine you're a scientist discovering a new element! 
What experiments would you design to test its properties?"

Hint Style:
- "This is exciting! Let's dive in..."
- "Think creatively about..."
- "Challenge yourself to..."
```

### **Analyst Coach**:
```
Approach:
- Precise, technical language
- Logical reasoning focus
- Problem-solving emphasis
- Analytical tone

Question Preferences:
- Analytical questions
- Problem Solving
- Essay (analytical)
- Multi-step Short Answer

Question Style:
"Given the following data on Ethiopia's GDP growth:
2020: 6.1%, 2021: 5.6%, 2022: 6.4%
Analyze the trend and calculate the average growth rate."

Hint Style:
- "Consider the logical steps..."
- "Analyze the components..."
- "Apply the formula systematically..."
```

---

## 🔄 Adaptive Difficulty Mode

### **When Adaptive Mode is ON**:
```
Behavior:
- Start with medium difficulty
- Adjust based on student performance
- Mix question types to assess different skills
- Prepare follow-up questions at different levels

Question Strategy:
1. Initial Question: Medium difficulty, Multiple Choice
2. If Correct: Increase to Hard, Essay or Problem Solving
3. If Incorrect: Decrease to Easy, True/False or Fill-in-the-Blank
4. Continue adjusting based on performance

Example Flow:
Student Answer: Correct (Medium Multiple Choice)
  ↓
Next Question: Hard Short Answer
  ↓
Student Answer: Incorrect
  ↓
Next Question: Medium Fill-in-the-Blank
  ↓
Student Answer: Correct
  ↓
Next Question: Medium-Hard Explain
```

### **When Adaptive Mode is OFF**:
```
Behavior:
- Maintain selected difficulty level
- Vary question types within difficulty
- Consistent challenge level
- Predictable progression

Question Strategy:
- All questions at selected difficulty
- Mix types for engagement
- No automatic adjustment
- Student controls difficulty
```

---

## 📚 RAG Source Influence

### **Exam RAG Active**:
```
Question Style Adjustments:
- Match formats from past national exams
- Use formal, exam-style language
- Include question types from Ethiopian national exams
- Time-appropriate complexity
- Official terminology

Example:
"The following question is from the 2023 Grade 12 National Exam:

Calculate the pH of a 0.1M solution of acetic acid 
(Ka = 1.8 × 10⁻⁵). Show all steps in your calculation."

Characteristics:
- Formal structure
- Clear instructions
- Standard exam format
- Precise language
```

### **Curriculum RAG Active**:
```
Question Style Adjustments:
- Align with textbook content
- Use curriculum terminology
- Focus on learning objectives
- Match syllabus topics
- Educational scaffolding

Example:
"Based on Chapter 3 of your Biology textbook:

Describe the process of mitosis in plant cells. 
Include the four main stages and what happens in each."

Characteristics:
- Textbook alignment
- Chapter references
- Learning objective focus
- Curriculum vocabulary
```

### **Both RAG Sources Active**:
```
Question Style Adjustments:
- Curriculum-aligned content
- Exam-style formatting
- Comprehensive practice
- Best of both approaches

Example:
"Using concepts from Chapter 5 (Curriculum) and 
the format of past national exams:

Analyze the impact of deforestation on Ethiopia's 
water cycle. Discuss at least three consequences 
and propose two solutions."

Characteristics:
- Curriculum content
- Exam format
- Comprehensive coverage
- Practical application
```

---

## 🔧 Technical Implementation

### **Backend Function** (`views.py` lines 1215-1312):

```python
def get_question_style_guidance(difficulty, grade_level, coach_personality, 
                                adaptive_difficulty, use_exam_rag, use_curriculum_rag):
    """
    Determine appropriate question types and styles based on multiple factors.
    Returns guidance string for the AI model.
    """
    
    # Define question type pools based on difficulty
    question_types = {
        'easy': {
            'primary': ['multiple_choice', 'true_false', 'fill_blank'],
            'secondary': ['short_answer'],
            'weights': 'Prefer: 50% Multiple Choice, 30% True/False, ...'
        },
        'medium': {...},
        'hard': {...}
    }
    
    # Adjust based on grade level
    # Adjust based on coach personality
    # Adjust based on adaptive difficulty
    # Adjust based on RAG sources
    
    # Build comprehensive guidance
    return guidance
```

### **Integration** (lines 1314-1322):

```python
# Get dynamic question style guidance
question_style_guidance = get_question_style_guidance(
    difficulty=difficulty,
    grade_level=grade_level,
    coach_personality=coach_personality,
    adaptive_difficulty=adaptive_difficulty,
    use_exam_rag=use_exam_rag,
    use_curriculum_rag=use_curriculum_rag
)

# Include in system prompt
system_prompt = f"""...
{question_style_guidance}
..."""
```

---

## 📋 Example Question Variations

### **Same Topic, Different Styles**:

**Topic**: Photosynthesis (Grade 8, Biology)

#### **Easy + Patient Coach**:
```
Type: Multiple Choice
Question: "What do plants need to make food through photosynthesis?"
Options:
A) Sunlight, water, and carbon dioxide
B) Sunlight, soil, and oxygen
C) Water, oxygen, and nitrogen
D) Soil, sunlight, and nitrogen

Hints:
- "Think about what plants take in from the air"
- "Remember, plants need energy from the sun"
- "Consider what plants absorb through their roots"
```

#### **Medium + Energetic Coach**:
```
Type: Short Answer
Question: "Imagine you're a plant! Describe the amazing process 
your leaves use to turn sunlight into food. What ingredients do 
you need and what do you produce?"

Hints:
- "Think about your chloroplasts - they're like tiny factories!"
- "What gas do you breathe in? What do you release?"
- "Don't forget the energy source from above!"
```

#### **Hard + Analyst Coach**:
```
Type: Essay
Question: "Analyze the light-dependent and light-independent 
reactions of photosynthesis. Compare their locations, inputs, 
outputs, and energy requirements. Explain how they are 
interconnected in the overall process."

Hints:
- "Consider the thylakoid membrane vs. stroma locations"
- "Analyze the role of ATP and NADPH as connecting molecules"
- "Examine the cyclical nature of the Calvin cycle"
```

---

## 🎯 Combination Examples

### **Example 1**: Easy + Grade 5 + Patient + No RAG
```
Type: True/False
Question: "True or False: The Nile River is the longest river in Africa."
Hint: "Think about the major rivers you learned about in geography."
```

### **Example 2**: Medium + Grade 9 + Energetic + Curriculum RAG
```
Type: Short Answer
Question: "Based on Chapter 4 of your Chemistry textbook, 
explain what happens when you mix an acid and a base. 
Make it exciting - describe the reaction!"
Hint: "Think about neutralization - it's like a chemical handshake!"
```

### **Example 3**: Hard + Grade 12 + Analyst + Exam RAG
```
Type: Problem Solving
Question: "From the 2022 National Exam format:
A projectile is launched at 45° with initial velocity 20 m/s.
Calculate: (a) Maximum height (b) Range (c) Time of flight
Use g = 10 m/s². Show all work."
Hint: "Apply kinematic equations systematically for each component."
```

### **Example 4**: Medium + Grade 7 + Patient + Adaptive ON
```
Type: Fill-in-the-Blank
Question: "The capital city of Ethiopia is ________, which is 
located in the ________ region of the country."
Hint: "Think about where the government buildings are located."

[If correct, next question increases difficulty]
[If incorrect, next question provides more scaffolding]
```

---

## 🧪 Testing Scenarios

### **Test 1: Difficulty Variation**
```
Settings: Grade 10, Biology, Patient Coach
- Easy: Multiple Choice about cell parts
- Medium: Short Answer explaining cell division
- Hard: Essay analyzing cancer as uncontrolled mitosis
```

### **Test 2: Coach Personality**
```
Settings: Grade 8, Mathematics, Medium Difficulty
- Patient: "Let's solve this equation step by step: 2x + 5 = 15"
- Energetic: "Challenge time! Can you crack this equation: 2x + 5 = 15?"
- Analyst: "Given the linear equation 2x + 5 = 15, solve for x using algebraic principles."
```

### **Test 3: Grade Level**
```
Settings: Mathematics, Medium Difficulty, Energetic Coach
- Grade 3: "What is 5 + 7?"
- Grade 6: "If you have 5 apples and buy 7 more, how many do you have?"
- Grade 9: "Solve: x + 7 = 12"
- Grade 12: "Solve the system: x + y = 12, 2x - y = 3"
```

### **Test 4: Adaptive Mode**
```
Initial: Medium Multiple Choice
Correct → Hard Essay
Incorrect → Easy True/False
Correct → Medium Short Answer
[Continues adapting...]
```

### **Test 5: RAG Influence**
```
No RAG: General knowledge question
Curriculum RAG: "Based on Chapter 5..."
Exam RAG: "From the 2023 National Exam format..."
Both RAG: "Using Chapter 5 concepts in exam format..."
```

---

## 📊 Question Type Matrix

| Difficulty | Grade Level | Patient Coach | Energetic Coach | Analyst Coach |
|------------|-------------|---------------|-----------------|---------------|
| **Easy** | KG-4 | Multiple Choice, True/False | Fill-in-the-Blank, Define | Multiple Choice |
| **Easy** | 5-8 | Multiple Choice, Fill-in-the-Blank | True/False, Short Answer | Multiple Choice, Define |
| **Easy** | 9-12 | Multiple Choice, True/False | Fill-in-the-Blank, Define | Multiple Choice |
| **Medium** | KG-4 | Multiple Choice, Short Answer | Fill-in-the-Blank, Describe | Short Answer |
| **Medium** | 5-8 | Short Answer, Fill-in-the-Blank | Multiple Choice, Explain | Short Answer, Explain |
| **Medium** | 9-12 | Short Answer, Multiple Choice | Explain, Describe | Short Answer, Problem Solving |
| **Hard** | KG-4 | Short Answer, Explain | Describe, Compare | Short Answer |
| **Hard** | 5-8 | Essay, Short Answer | Compare, Analyze | Problem Solving, Analyze |
| **Hard** | 9-12 | Essay, Problem Solving | Analyze, Compare | Problem Solving, Essay, Analyze |

---

## 🎓 Benefits

### **1. Pedagogical Appropriateness** ✅
- Questions match student developmental level
- Difficulty aligns with learning objectives
- Question types suit content and skills

### **2. Engagement** ✅
- Variety prevents monotony
- Personality-matched delivery
- Culturally relevant content

### **3. Comprehensive Assessment** ✅
- Tests different cognitive levels
- Covers knowledge, understanding, application, analysis
- Balanced skill development

### **4. Adaptive Learning** ✅
- Responds to student performance
- Adjusts challenge level
- Maintains optimal difficulty

### **5. Exam Preparation** ✅
- Matches national exam formats
- Builds familiarity with question types
- Curriculum-aligned practice

---

## 📝 Summary

**Files Modified**:
- ✅ `yeneta_backend/ai_tools/views.py` (lines 1031-1032, 1211-1356)

**New Parameters**:
- ✅ `coach_personality` - Patient, Energetic, Analyst
- ✅ `adaptive_difficulty` - Boolean

**Question Types**: 11 different styles

**Factors Considered**: 5 (Difficulty, Grade, Personality, Adaptive, RAG)

**Distribution Strategies**: 3 (Easy, Medium, Hard)

**Coach Personalities**: 3 (Patient, Energetic, Analyst)

**Grade Groupings**: 4 (KG-4, 5-8, 9-10, 11-12)

---

**Dynamic Question Style Generation: COMPLETE!** 🎯

The AI now intelligently varies question types based on:
- ✅ Difficulty level (Easy/Medium/Hard)
- ✅ Grade level (KG through 12)
- ✅ Coach personality (Patient/Energetic/Analyst)
- ✅ Adaptive difficulty mode
- ✅ RAG sources (Exam/Curriculum)

Students will experience diverse, engaging, and pedagogically appropriate questions tailored to their specific learning context!

---

**Updated By**: Cascade AI Assistant  
**Date**: November 8, 2025  
**Time**: 05:30 AM UTC+03:00
