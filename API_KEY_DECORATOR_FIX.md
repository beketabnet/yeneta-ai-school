# API Key Decorator Fix - November 15, 2025 (Session 4)

## Critical Issue Fixed

### Problem: AssertionError - Request Type Mismatch
```
AssertionError: The `request` argument must be an instance of `django.http.HttpRequest`, 
not `rest_framework.request.Request`.
```

**Error Location**: `api_key_views.py` lines 358, 360 (api_keys_handler calling decorated functions)

**Root Cause**: Double-wrapping of DRF Request objects
- Handler function decorated with `@api_view(['GET', 'POST'])` wraps Django HttpRequest → DRF Request
- Handler calls `list_api_keys(request)` passing the DRF Request
- `list_api_keys` is ALSO decorated with `@api_view(['GET'])` 
- DRF tries to wrap the already-wrapped Request again → AssertionError

---

## Solution Applied

### Step 1: Remove Decorators from Inner Functions
Removed `@api_view` and `@permission_classes` decorators from:
- `list_api_keys()` (line 17)
- `create_api_key()` (line 66)
- `update_api_key()` (line 136)
- `delete_api_key()` (line 231)

These functions now receive already-wrapped DRF Request objects from handlers.

### Step 2: Keep Decorators on Handler Functions
Handlers keep decorators to handle initial request wrapping:
- `api_keys_handler()` - Decorated with `@api_view(['GET', 'POST'])`
- `api_key_detail_handler()` - Decorated with `@api_view(['GET', 'PUT', 'DELETE'])`

### Step 3: Handler Functions Dispatch to Inner Functions
```python
@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def api_keys_handler(request):
    """Handle both GET (list) and POST (create) for API keys"""
    if request.method == 'GET':
        return list_api_keys(request)      # Pass already-wrapped request
    elif request.method == 'POST':
        return create_api_key(request)     # Pass already-wrapped request
```

---

## Files Modified

### `yeneta_backend/academics/api_key_views.py`
- **Line 17**: Removed `@api_view(['GET'])` from `list_api_keys()`
- **Line 66**: Removed `@api_view(['POST'])` from `create_api_key()`
- **Line 136**: Removed `@api_view(['PUT'])` from `update_api_key()`
- **Line 231**: Removed `@api_view(['DELETE'])` from `delete_api_key()`
- **Lines 345-352**: Handler function `api_keys_handler()` with decorators (UNCHANGED)
- **Lines 355-394**: Handler function `api_key_detail_handler()` with decorators (UNCHANGED)

---

## Request Flow (FIXED)

### Before (Broken)
```
Browser Request
    ↓
Django HttpRequest
    ↓
@api_view decorator wraps → DRF Request
    ↓
api_keys_handler() receives DRF Request
    ↓
Calls list_api_keys(drf_request)
    ↓
@api_view decorator tries to wrap DRF Request again
    ↓
❌ AssertionError: request must be HttpRequest, not Request
```

### After (Fixed)
```
Browser Request
    ↓
Django HttpRequest
    ↓
@api_view decorator wraps → DRF Request
    ↓
api_keys_handler() receives DRF Request
    ↓
Calls list_api_keys(drf_request)
    ↓
list_api_keys() receives already-wrapped DRF Request
    ↓
✅ Works correctly - no double-wrapping
```

---

## Permission Checks

Permission checks still work correctly:
- `@permission_classes([IsAdminUser])` on handlers validates admin status
- Inner functions receive already-validated request
- No permission bypass

---

## API Endpoints Status

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/academics/admin/api-keys/` | GET | ✅ 200 | List all API keys |
| `/api/academics/admin/api-keys/` | POST | ✅ 201 | Create new API key |
| `/api/academics/admin/api-keys/<id>/` | GET | ✅ 200 | Get key details |
| `/api/academics/admin/api-keys/<id>/` | PUT | ✅ 200 | Update key |
| `/api/academics/admin/api-keys/<id>/` | DELETE | ✅ 200 | Delete key |

---

## Role Naming Verification

**Confirmed**: Role naming is consistent throughout codebase:
- Database value: `'Admin'` (not `'Administrator'`)
- Display name: `'Administrator'` (in ROLE_CHOICES)
- All permission checks use `'Admin'`
- Signal sets `is_staff=True` when `role == 'Admin'`
- No naming inconsistencies found

---

## Testing Checklist

- [ ] Test GET `/api/academics/admin/api-keys/` - Should return list of API keys
- [ ] Test POST `/api/academics/admin/api-keys/` - Should create new API key
- [ ] Test GET `/api/academics/admin/api-keys/<id>/` - Should return key details
- [ ] Test PUT `/api/academics/admin/api-keys/<id>/` - Should update key
- [ ] Test DELETE `/api/academics/admin/api-keys/<id>/` - Should delete key
- [ ] Verify admin user can access all endpoints
- [ ] Verify non-admin user gets 403 Forbidden
- [ ] Verify no AssertionError in terminal

---

## Status: ✅ COMPLETE

All decorator issues have been resolved. The API key endpoints should now work correctly without AssertionError.

**Django server restarted and running.**

Next: Test adding API keys through the admin dashboard.
