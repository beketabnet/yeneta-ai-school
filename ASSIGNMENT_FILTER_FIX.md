# Assignment-Type Questions Filter - Added ✅

## Problem
Quiz generator was creating questions like:
> "Interview people in your localities, especially those who have cows or camels, and ask them about the basic requirements to carry out dairy farming and report to the class."

These are **assignment questions**, not suitable for online quizzes/exams.

## Solution
Added explicit filtering rules to the LLM prompt to prevent such questions.

### Forbidden Question Types
The LLM is now instructed to **NEVER** generate questions that require:
- ❌ Interviewing people in localities
- ❌ Conducting surveys
- ❌ Visiting farms/factories/locations
- ❌ Collecting samples
- ❌ Preparing presentations
- ❌ Creating projects
- ❌ Research and reporting
- ❌ Any real-world fieldwork or extended time activities

### What to Do Instead
✅ Ask about the **CONTENT/CONCEPTS** that such activities would teach

**Example:**
- ❌ **Bad**: "Interview farmers about dairy farming requirements"
- ✅ **Good**: "According to the textbook, what are the basic requirements for dairy farming?"

## Files Modified
**`yeneta_backend/ai_tools/quiz_generator_rag_enhancer.py`**
- Lines 253-263: Added detailed forbidden question types list
- Line 346: Added critical reminder in final section

## Testing
Generate a new quiz and verify:
- No questions asking to interview people
- No questions requiring field visits
- No questions requiring projects or presentations
- All questions are answerable from textbook content alone

The filter is now active for all quiz generations! 🎯
