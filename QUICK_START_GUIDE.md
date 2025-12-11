# Quick Start Guide - Ethiopian Curriculum RAG Pipeline

## ✅ All Issues Fixed

### Issue 1: ModuleNotFoundError
**Error:** `ModuleNotFoundError: No module named 'rag.services'`  
**Status:** ✅ **FIXED** - Python cache cleared, module imports successfully

### Issue 2: Incorrect Curriculum
**Problem:** Generic grade/subject structure not matching Ethiopian education system  
**Status:** ✅ **FIXED** - Complete Ethiopian curriculum implemented (KG - Grade 12)

## Quick Test Instructions

### 1. Start the Backend
```bash
cd yeneta_backend
python manage.py runserver
```

Expected output:
```
✅ OpenAI API key not found (expected - optional)
✅ System check identified no issues (0 silenced)
✅ Starting development server at http://127.0.0.1:8000/
```

### 2. Test Curriculum API
Open browser or use curl:
```bash
# Get full curriculum config
curl http://127.0.0.1:8000/api/rag/curriculum-config/

# Get subjects for Grade 11 Natural Science
curl "http://127.0.0.1:8000/api/rag/curriculum-config/?grade=Grade%2011&stream=Natural%20Science"
```

### 3. Start the Frontend
```bash
# In a new terminal
npm start
```

### 4. Test the Feature
1. Login as admin: `admin@yeneta.com` / `admin123`
2. Navigate to **Admin Dashboard** → **Curriculum RAG Pipeline**
3. You should see:
   - ✅ Grade dropdown with KG, Grade 1-12
   - ✅ Subject dropdown (dynamically loaded)
   - ✅ Stream dropdown (only for Grades 11-12)
   - ✅ Education level labels (Pre-primary, Primary, etc.)

### 5. Upload a Test Document

**Example 1: Grade 7 General Science**
- Grade: Grade 7
- Subject: General Science
- Stream: (hidden - not required)
- File: Any PDF/DOCX file

**Example 2: Grade 11 Natural Science Physics**
- Grade: Grade 11
- Subject: Physics
- Stream: Natural Science (required)
- File: Any PDF/DOCX file

**Example 3: Grade 12 Matric Questions**
- Grade: Grade 12
- Subject: Chemistry
- Stream: Natural Science (required)
- File: matric_questions.pdf

### 6. Verify File Organization
Check the folder structure:
```
media/rag_documents/
├── Grade_7/
│   └── Subject_General_Science/
│       └── 2025-11-08/
│           └── your_file.pdf
├── Grade_11/
│   └── Stream_Natural_Science/
│       └── Subject_Physics/
│           └── 2025-11-08/
│               └── your_file.pdf
└── Grade_12/
    └── Stream_Natural_Science/
        └── Subject_Chemistry/
            └── 2025-11-08/
                └── matric_questions.pdf
```

## Ethiopian Curriculum Structure

### Grade Levels (13 total)
```
KG                    → Pre-primary Education
Grade 1-6             → Primary Education
Grade 7-8             → Middle Education
Grade 9-10            → General Secondary Education
Grade 11-12           → Preparatory Secondary (Streamed)
```

### Streaming (Grades 11-12 Only)
```
Natural Science Stream:
- English, Mathematics, Physics, Chemistry, Biology, IT, Agriculture

Social Science Stream:
- English, Mathematics, Geography, History, Economics, IT
```

### Subject Count by Grade
- **KG:** 7 subjects (theme-based)
- **Grade 1-2:** 6 subjects
- **Grade 3-6:** 7 subjects (includes optional local language)
- **Grade 7-8:** 11 subjects
- **Grade 9-10:** 11 subjects
- **Grade 11-12:** 7 subjects per stream

## Key Features

### ✅ Dynamic Subject Loading
- Subjects automatically update when grade changes
- Stream-specific subjects for Grades 11-12
- Validation prevents invalid combinations

### ✅ Organized File Storage
- Hierarchical folder structure
- Date-based organization
- Stream-based separation for Grades 11-12

### ✅ Smart Validation
- File type checking (PDF, DOCX, TXT)
- File size limit (50MB)
- Stream requirement enforcement
- Subject-grade compatibility

### ✅ Real-time Processing
- Status updates (Processing → Active/Failed)
- Chunk count display
- Automatic polling for status changes

## API Endpoints

### Get Curriculum Configuration
```
GET /api/rag/curriculum-config/
```
Returns: All grades, streams, and subjects

### Get Subjects for Grade
```
GET /api/rag/curriculum-config/?grade=Grade 11&stream=Natural Science
```
Returns: Subjects for specific grade and stream

### Vector Store Management
```
GET    /api/rag/vector-stores/          # List all
POST   /api/rag/vector-stores/          # Create new
DELETE /api/rag/vector-stores/{id}/     # Delete
```

## Troubleshooting

### Frontend doesn't show subjects
**Solution:** Check browser console for API errors. Ensure backend is running.

### Stream selector not appearing for Grade 11-12
**Solution:** Refresh page. Check that `isStreamRequired` is being set correctly.

### File upload fails
**Solution:** 
- Check file size (max 50MB)
- Verify file type (PDF, DOCX, TXT only)
- Ensure subject is selected

### Vector store stuck on "Processing"
**Solution:** Check Django console for errors. Verify ChromaDB and LangChain are installed.

## File Locations

### Backend Files
```
yeneta_backend/rag/
├── curriculum_config.py    # ✅ NEW - Curriculum configuration
├── models.py               # ✅ Updated - Added vector_store_path, chunk_count
├── serializers.py          # ✅ Updated - Enhanced validation
├── views.py                # ✅ Updated - Added curriculum endpoint
├── urls.py                 # ✅ Updated - Added route
└── services.py             # ✅ NEW - Document processing
```

### Frontend Files
```
components/admin/
└── CurriculumManager.tsx   # ✅ Updated - Dynamic curriculum

services/
└── apiService.ts           # ✅ Updated - Added curriculum methods

types.ts                    # ✅ Updated - VectorStore interface
```

### Documentation
```
RAG_PIPELINE_IMPLEMENTATION.md          # Initial implementation
ETHIOPIAN_CURRICULUM_IMPLEMENTATION.md  # Complete curriculum details
QUICK_START_GUIDE.md                    # This file
```

## Success Indicators

### Backend
- ✅ `python manage.py check` shows no errors
- ✅ Server starts without import errors
- ✅ Curriculum API returns data
- ✅ File uploads create organized folders

### Frontend
- ✅ Grade dropdown shows KG, Grade 1-12
- ✅ Subjects load dynamically
- ✅ Stream selector appears for Grades 11-12
- ✅ Education level labels display correctly
- ✅ File uploads succeed

### System
- ✅ Files organized in correct folder structure
- ✅ Vector stores created successfully
- ✅ Status updates from Processing to Active
- ✅ Chunk counts displayed

## Next Steps

1. **Test with Real Documents**
   - Upload actual curriculum PDFs
   - Verify text extraction
   - Check vector store creation

2. **Integrate with AI Features**
   - Use vector stores in AI Tutor
   - Implement curriculum-aware question generation
   - Add context-aware lesson planning

3. **Add Regional Support**
   - Implement region selector
   - Load region-specific subjects
   - Support bilingual content

4. **Performance Optimization**
   - Implement async processing (Celery)
   - Add progress bars
   - Optimize vector store queries

## Support

For issues or questions:
1. Check `ETHIOPIAN_CURRICULUM_IMPLEMENTATION.md` for detailed information
2. Review Django console logs for backend errors
3. Check browser console for frontend errors
4. Verify all files are in correct locations

---

**Status:** ✅ **READY FOR TESTING**  
**Last Updated:** November 8, 2025  
**Version:** 1.0.0
