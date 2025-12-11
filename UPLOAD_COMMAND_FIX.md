# Upload Command Fix

## Issue
**Error**: `TypeError: DocumentChunk.__init__() got an unexpected keyword argument 'id'`

## Root Cause
The `DocumentChunk` dataclass has a specific parameter order:
```python
@dataclass
class DocumentChunk:
    text: str
    metadata: Dict
    chunk_id: str          # ✅ NOT 'id'
    source: str
    page_number: Optional[int] = None
    section: Optional[str] = None
```

## Fix Applied
Changed from:
```python
chunk = DocumentChunk(
    id=str(uuid.uuid4()),  # ❌ Wrong parameter name
    text=unit_text.strip(),
    metadata={...},
    embedding=None  # ❌ Not a parameter
)
```

To:
```python
chunk = DocumentChunk(
    text=unit_text.strip(),
    metadata={...},
    chunk_id=str(uuid.uuid4()),  # ✅ Correct parameter name
    source=f'{grade}_{subject}_curriculum.pdf',
    page_number=units.index(unit_data) + 1,
    section=unit_data['unit']
)
```

## Now Run This
```bash
cd yeneta_backend
python manage.py upload_test_curriculum --grade "Grade 7" --subject "English"
```

## Expected Output
```
📚 Uploading test curriculum for Grade 7 English...

  ✓ Created chunk for Unit One: Reading Comprehension and Analysis
  ✓ Created chunk for Unit Two: Grammar and Sentence Structure
  ✓ Created chunk for Unit Three: Writing Skills and Composition
  ✓ Created chunk for Unit Four: Vocabulary Development
  ✓ Created chunk for Unit Five: Speaking and Listening Skills

📤 Uploading 5 chunks to vector store...

✅ Successfully uploaded 5 curriculum units!

📊 Summary:
   Grade: Grade 7
   Subject: English
   Units: 5
   Vector Store: Ready for chapter extraction

💡 You can now test chapter extraction with:
   - "Unit One"
   - "Unit Two"
   - "Unit Three"
   - "Unit Four"
   - "Unit Five"
```

## Status
✅ Fixed - Ready to run!
