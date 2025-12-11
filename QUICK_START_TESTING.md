# Practice Labs - Quick Start Testing Guide

**Last Updated**: November 9, 2025, 5:20 AM UTC+03:00  
**Status**: Ready for Immediate Testing

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start Backend
```bash
cd d:\django_project\yeneta-ai-school\yeneta_backend
python manage.py runserver
```

### Step 2: Start Frontend (New Terminal)
```bash
cd d:\django_project\yeneta-ai-school
npm start
```

### Step 3: Login
- URL: http://localhost:3000
- Email: `student@yeneta.com`
- Password: `student123`

### Step 4: Navigate to Practice Labs
- Click "Student Dashboard"
- Click "Practice Labs" in sidebar

---

## ✅ Visual Checklist (2 Minutes)

### What You Should See:

1. **Header Section**
   - [ ] "Practice Labs - Mind Gym" title
   - [ ] 🏆 Badges button (yellow)
   - [ ] 🎯 Missions button (blue)

2. **Practice Mode Selector** (3 Cards)
   - [ ] 🏋️ Standard Practice (blue card)
   - [ ] 📝 Exam Mode (purple card)
   - [ ] 🎮 Game Mode (green card)

3. **Performance Tracker**
   - [ ] XP and Level display
   - [ ] Progress bar
   - [ ] Streak counter

4. **Configuration Panel** (Left Side)
   - [ ] Question Mode buttons (4 buttons)
   - [ ] Subject dropdown
   - [ ] Topic input
   - [ ] Grade level selector
   - [ ] Generate button

---

## 🧪 Quick Feature Tests (10 Minutes)

### Test 1: Practice Mode Selection (1 min)
1. Click "Standard Practice" → Should highlight blue
2. Click "Exam Mode" → Should highlight purple
3. Click "Game Mode" → Should highlight green
✅ **Pass if**: Cards highlight correctly

### Test 2: Badges Panel (1 min)
1. Click "🏆 Badges" button
2. Modal should open
3. Should see badge categories
4. Close modal
✅ **Pass if**: Modal opens and closes

### Test 3: Missions Panel (1 min)
1. Click "🎯 Missions" button
2. Modal should open
3. Should see daily missions
4. Close modal
✅ **Pass if**: Modal opens and closes

### Test 4: Generate Question (2 min)
1. Select "Standard Practice"
2. Choose "Subject-Based" question mode
3. Select subject: "Mathematics"
4. Enter topic: "Algebra"
5. Click "Generate Practice Question"
6. Wait for question to load
✅ **Pass if**: Question displays

### Test 5: Two-Layer Hints (2 min)
1. With question displayed
2. Click "💡 Layer 1: Quick Hint"
3. Should see yellow hint box
4. Click "📚 Layer 2: Step-by-Step"
5. Should see blue detailed hint
✅ **Pass if**: Both hints display

### Test 6: Student Feedback (1 min)
1. Click "🤔 Need Help?" button
2. Feedback form modal opens
3. Select a struggle reason
4. Enter text in textarea
5. Close form
✅ **Pass if**: Form opens and closes

### Test 7: Answer Submission (2 min)
1. Enter an answer
2. Click "Submit Answer"
3. Should see feedback
4. Check XP earned
5. Click "Next Question"
✅ **Pass if**: Feedback shows, XP updates

---

## 🔌 API Endpoint Tests (5 Minutes)

### Test Backend Endpoints

Open a new terminal and run these curl commands:

#### 1. Get Badges
```bash
curl -X GET http://localhost:8000/api/ai-tools/get-badges/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```
✅ **Expected**: JSON with badges array

#### 2. Get Missions
```bash
curl -X GET http://localhost:8000/api/ai-tools/get-missions/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```
✅ **Expected**: JSON with dailyMissions and weeklyMissions

#### 3. Calculate ZPD Score
```bash
curl -X POST http://localhost:8000/api/ai-tools/calculate-zpd-score/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"masteryPercentage": 65}'
```
✅ **Expected**: JSON with zpdScore and recommendedDifficulty

#### 4. Generate Two-Layer Hints
```bash
curl -X POST http://localhost:8000/api/ai-tools/generate-two-layer-hints/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question": "Solve for x: 2x + 5 = 15",
    "correctAnswer": "x = 5",
    "difficulty": "medium"
  }'
```
✅ **Expected**: JSON with minimalHint and detailedHint

#### 5. Detect Misconceptions
```bash
curl -X POST http://localhost:8000/api/ai-tools/detect-misconceptions/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subject": "Mathematics",
    "question": "What is -3 + 5?",
    "studentAnswer": "-8",
    "correctAnswer": "2",
    "isCorrect": false
  }'
```
✅ **Expected**: JSON with misconceptions array

---

## 🐛 Common Issues & Fixes

### Issue 1: "Cannot read property 'questionMode'"
**Fix**: Refresh page, localStorage might have old config
```javascript
// In browser console:
localStorage.removeItem('practiceLabsPerformance');
location.reload();
```

### Issue 2: Badges/Missions don't load
**Check**: Backend is running
**Check**: API endpoints return 200 status
**Fix**: Restart backend server

### Issue 3: Hints don't generate
**Check**: LLM service is configured
**Check**: API keys are set in .env
**Workaround**: Use fallback hints from question.hints array

### Issue 4: Timer doesn't start in Exam Mode
**Check**: Select "Exam Mode" from Practice Mode Selector
**Check**: Console for errors
**Expected**: Timer should appear automatically

---

## 📊 Success Criteria

### Minimum Viable Test (Must Pass)
- ✅ All 3 practice modes selectable
- ✅ Badges and Missions modals open
- ✅ Question generates successfully
- ✅ Answer submission works
- ✅ XP and streak update

### Full Feature Test (Should Pass)
- ✅ Two-layer hints display
- ✅ Student feedback form works
- ✅ All 5 API endpoints respond
- ✅ No console errors
- ✅ Responsive on mobile

---

## 🔍 Debugging Tips

### Check Browser Console
```javascript
// View current config
console.log(localStorage.getItem('practiceLabsPerformance'));

// Check if components loaded
console.log('PracticeModeSelector:', !!window.PracticeModeSelector);
```

### Check Network Tab
- Filter by "ai-tools"
- Look for 200 status codes
- Check response payloads

### Check Backend Logs
```bash
# In backend terminal, watch for:
# - "Practice Labs: ..." log messages
# - Any error stack traces
# - API endpoint hits
```

---

## 📝 Report Template

```markdown
## Test Results - [Your Name] - [Date/Time]

### Environment
- Browser: Chrome/Firefox/Safari
- OS: Windows/Mac/Linux
- Backend: Running ✅ / Not Running ❌
- Frontend: Running ✅ / Not Running ❌

### Quick Tests (7 tests)
1. Practice Mode Selection: ✅ / ❌
2. Badges Panel: ✅ / ❌
3. Missions Panel: ✅ / ❌
4. Generate Question: ✅ / ❌
5. Two-Layer Hints: ✅ / ❌
6. Student Feedback: ✅ / ❌
7. Answer Submission: ✅ / ❌

### API Tests (5 endpoints)
1. Get Badges: ✅ / ❌
2. Get Missions: ✅ / ❌
3. Calculate ZPD: ✅ / ❌
4. Generate Hints: ✅ / ❌
5. Detect Misconceptions: ✅ / ❌

### Issues Found
1. [Description]
2. [Description]

### Screenshots
[Attach if any issues]

### Overall Status
✅ Ready for Production
⚠️ Minor Issues (list below)
❌ Critical Issues (list below)
```

---

## 🎯 Next Steps After Testing

1. **If All Tests Pass**
   - Document success
   - Move to user acceptance testing
   - Plan production deployment

2. **If Minor Issues**
   - Document in GitHub issues
   - Prioritize fixes
   - Re-test after fixes

3. **If Critical Issues**
   - Stop and fix immediately
   - Re-run full test suite
   - Document root cause

---

## 📞 Support

### Getting Help
- Check `PRACTICE_LABS_TESTING_GUIDE.md` for detailed tests
- Check `PRACTICE_LABS_RESEARCH_IMPLEMENTATION.md` for architecture
- Check browser console for errors
- Check backend terminal for logs

### Common Questions

**Q: Where are badges stored?**
A: Currently in memory (localStorage). Database models pending.

**Q: Why don't missions persist?**
A: Database models not yet created. Coming in next phase.

**Q: Can I test without LLM?**
A: Yes, fallback hints from question.hints array will work.

**Q: How do I reset everything?**
A: Clear localStorage and refresh page.

---

## ✅ Quick Test Completion

**Time Required**: 15-20 minutes
**Prerequisites**: Backend + Frontend running
**Success Rate**: Aim for 90%+ tests passing

**Ready to test? Let's go! 🚀**

---

**Last Updated**: November 9, 2025  
**Version**: 1.0  
**Status**: Ready for Testing
