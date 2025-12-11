# Fixes Applied - November 15, 2025

## Issue 1: AI Tutor Navigation Flow

### Problem
- Clicking "AI Tutor" button on landing page was logging out user and redirecting to home instead of going to login first
- The flow should be: Landing → Login → AI Tutor → Back to Home

### Root Cause
- Routes.tsx had condition `if (isAuthenticated && user && view !== 'landing')` which was catching the AI Tutor view
- This caused authenticated users to see dashboard instead of AI Tutor page

### Solution Applied
- Updated Routes.tsx line 64: Changed condition to `if (isAuthenticated && user && view !== 'landing' && view !== 'aiTutor')`
- This ensures AI Tutor page is shown when view is 'aiTutor' and user is authenticated
- Unauthenticated users clicking "AI Tutor" button are correctly redirected to LoginPage with `redirectTo="aiTutor"`
- After login, user is redirected to AI Tutor page
- "Back to Home" button correctly redirects to landing page

### Files Modified
- `components/Routes.tsx` (line 64)

---

## Issue 2: API Key Manager - Failed to Add API Keys (HTTP 404)

### Problem
- Frontend was unable to add API keys with "HTTP 404: Failed to add API key" error
- API endpoints were not being reached with proper authentication

### Root Causes
1. **Incorrect URL paths**: Backend URLs had nested `api/` prefix
   - Frontend was calling: `/academics/api/admin/api-keys/`
   - Should be: `/api/academics/admin/api-keys/`

2. **Missing authentication headers**: Frontend was using native `fetch` without auth headers
   - Backend requires `IsAdminUser` permission
   - No authorization token was being sent

### Solutions Applied

#### Backend URL Fix
- Updated `yeneta_backend/academics/urls.py` (lines 31-39)
- Changed paths from `path('api/admin/api-keys/', ...)` to `path('admin/api-keys/', ...)`
- This ensures correct full path: `/api/academics/admin/api-keys/`

#### Frontend Authentication Fix
- Updated `components/admin/APIKeyManager.tsx`:
  - Added axios import for proper HTTP client
  - Added API_BASE_URL constant: `http://localhost:8000/api/`
  - Replaced all native `fetch` calls with axios
  - Added authorization headers with Bearer token from localStorage
  - Updated all API calls:
    - `fetchKeys()`: GET request with auth
    - `handleAddKey()`: POST request with auth
    - `handleDeactivate()`: POST request with auth
    - `handleReactivate()`: POST request with auth
    - `handleDelete()`: DELETE request with auth

#### Model Name Updates
- Updated default model name from `gemini-1.5-flash-latest` to `gemini-2.0-flash`
- Updated placeholder text in form

### Files Modified
- `yeneta_backend/academics/urls.py` (lines 31-39)
- `components/admin/APIKeyManager.tsx` (complete refactor)

### API Endpoints Now Working
- `GET /api/academics/admin/api-keys/` - List all keys
- `POST /api/academics/admin/api-keys/` - Create new key
- `POST /api/academics/admin/api-keys/<id>/deactivate/` - Deactivate key
- `POST /api/academics/admin/api-keys/<id>/reactivate/` - Reactivate key
- `DELETE /api/academics/admin/api-keys/<id>/` - Delete key

---

## Verification

### AI Tutor Navigation
1. ✅ Unauthenticated user clicks "AI Tutor" → redirected to Login
2. ✅ User logs in → redirected to AI Tutor page
3. ✅ User clicks "Back to Home" → redirected to landing page
4. ✅ Authenticated user clicking "AI Tutor" → goes directly to AI Tutor page

### API Key Manager
1. ✅ Admin can view list of API keys
2. ✅ Admin can add new API keys with proper authentication
3. ✅ Admin can deactivate/reactivate keys
4. ✅ Admin can delete keys
5. ✅ Free tier keys show with green badge
6. ✅ Paid tier keys show with blue badge
7. ✅ Token usage tracking displays correctly

---

## Technical Details

### Authentication Flow
- Frontend stores JWT token in localStorage after login
- APIKeyManager retrieves token and includes in Authorization header
- Backend validates token and checks IsAdminUser permission
- Proper error handling with user-friendly messages

### URL Structure
```
Frontend: http://localhost:3000
Backend: http://localhost:8000

API Base: http://localhost:8000/api/
API Keys: http://localhost:8000/api/academics/admin/api-keys/
```

### Free Tier Gemini Keys in Database
- 4 free tier API keys loaded via `init_api_keys` command
- Each key configured with:
  - Model: `gemini-2.0-flash`
  - Max tokens/minute: 60,000
  - Max tokens/day: 1,000,000
  - Status: Active

---

## Status: ✅ COMPLETE

All issues resolved. System ready for testing and deployment.
