# Migration Fix Instructions

## Problem
The migration file `0003_studentgrade.py` was created with an incorrect dependency reference, causing a `NodeNotFoundError` when Django tries to build the migration graph.

**Error:**
```
django.db.migrations.exceptions.NodeNotFoundError: Migration academics.0003_studentgrade dependencies reference nonexistent parent node ('academics', '0002_auto_previous_migration')
```

## Root Cause
1. There was already a `0003_add_document_type_to_assignment.py` migration
2. The new `0003_studentgrade.py` migration referenced a non-existent parent migration `0002_auto_previous_migration`
3. This created a conflict in the migration sequence

## Solution Applied

### Step 1: Delete the Incorrect Migration File
**File to delete:** `yeneta_backend/academics/migrations/0003_studentgrade.py`

This file has been replaced with the correct migration.

### Step 2: Use the Correct Migration File
**File to use:** `yeneta_backend/academics/migrations/0007_studentgrade.py`

This migration file:
- Has the correct sequence number (0007, after 0006_apikey_apikeyprovider_and_more)
- References the correct parent migration: `('academics', '0006_apikey_apikeyprovider_and_more')`
- Contains the complete StudentGrade model definition
- Includes all necessary indexes

## How to Apply the Fix

### Option 1: Manual File Deletion (Recommended)
1. Open file explorer
2. Navigate to: `d:\django_project\yeneta-ai-school\yeneta_backend\academics\migrations\`
3. Delete the file: `0003_studentgrade.py`
4. Keep the file: `0007_studentgrade.py`

### Option 2: Using Command Line
```bash
cd d:\django_project\yeneta-ai-school
del yeneta_backend\academics\migrations\0003_studentgrade.py
```

## Verification

After deleting the incorrect migration file, run:

```bash
cd d:\django_project\yeneta-ai-school
python manage.py migrate
```

You should see:
```
Operations to perform:
  Apply all migrations: academics, ...
Running migrations:
  Applying academics.0007_studentgrade... OK
```

## Migration Sequence

The correct migration sequence for the academics app is:
- 0001_initial.py
- 0002_initial.py
- 0003_add_document_type_to_assignment.py
- 0004_teachercourserequest_studentenrollmentrequest.py
- 0005_studentenrollmentrequest_family.py
- 0006_apikey_apikeyprovider_and_more.py
- **0007_studentgrade.py** ← NEW (StudentGrade model)

## Files Involved

**To Delete:**
- `yeneta_backend/academics/migrations/0003_studentgrade.py` (INCORRECT)

**To Keep:**
- `yeneta_backend/academics/migrations/0007_studentgrade.py` (CORRECT)

**Related Files (No Changes Needed):**
- `yeneta_backend/academics/models.py` - StudentGrade model definition
- `yeneta_backend/academics/serializers.py` - StudentGradeSerializer
- `yeneta_backend/academics/views.py` - StudentGradeViewSet
- `yeneta_backend/academics/urls.py` - StudentGrade routes

## Troubleshooting

If you still see migration errors after deleting the file:

1. **Clear Django cache:**
   ```bash
   python manage.py clear_cache
   ```

2. **Check migration status:**
   ```bash
   python manage.py showmigrations academics
   ```

3. **If needed, reset migrations (CAUTION - Development Only):**
   ```bash
   python manage.py migrate academics zero
   python manage.py migrate academics
   ```

## Status
✅ Correct migration file created: `0007_studentgrade.py`
⏳ Incorrect migration file needs to be deleted: `0003_studentgrade.py`
✅ All backend code is correct and ready
✅ Frontend components are ready
✅ API endpoints are configured

Once you delete the incorrect migration file, the backend will start without errors.
