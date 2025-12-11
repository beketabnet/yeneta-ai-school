# User Selection Feature - Debugging Guide

**Date**: November 7, 2025 (10:20 PM)  
**Issue**: "No users found matching your criteria" - Users not appearing in modal

---

## Debugging Steps Added

### Console Logging

Added comprehensive console logging to trace the issue:

**In `fetchUsers()`**:
```typescript
console.log('All users fetched:', allUsers.length);
console.log('Current user:', currentUser?.username, currentUser?.id);
console.log('Allowed roles:', allowedRoles);
console.log('After removing current user:', availableUsers.length);
console.log('After role filtering:', availableUsers.length);
console.log('Available users:', availableUsers.map(u => `${u.username} (${u.role})`));
```

**In `filterUsers()`**:
```typescript
console.log('filterUsers called - roleFilter:', roleFilter, 'searchQuery:', searchQuery);
console.log('Total users before filtering:', users.length);
console.log('After role filter:', filtered.length, 'users with role:', roleFilter);
console.log('Final filtered users:', filtered.map(u => `${u.username} (${u.role})`));
```

---

## How to Debug

### Step 1: Open Browser Console
1. Open your browser (Chrome/Firefox/Edge)
2. Press `F12` to open Developer Tools
3. Go to the "Console" tab

### Step 2: Test the Feature
1. Login as Teacher (`teacher@yeneta.com` / `teacher123`)
2. Navigate to Communication Log
3. Click the "➕ New" button
4. Watch the console output

### Step 3: Analyze Console Output

**Expected Output**:
```
All users fetched: 4
Current user: teacher 2
Allowed roles: ['Parent', 'Admin']
After removing current user: 3
After role filtering: 2
Available users: ['parent (Parent)', 'admin (Admin)']
filterUsers called - roleFilter: all searchQuery: 
Total users before filtering: 2
Final filtered users: ['parent (Parent)', 'admin (Admin)']
```

---

## Possible Issues and Solutions

### Issue 1: No Users Fetched
**Console shows**: `All users fetched: 0`

**Cause**: Database is empty or API endpoint not working

**Solution**:
1. Check if users exist in database:
```bash
cd yeneta_backend
python manage.py shell
>>> from users.models import User
>>> User.objects.all().count()
>>> User.objects.all().values('id', 'username', 'role')
```

2. If no users, create test users:
```bash
python manage.py createsuperuser
# Or use existing test users
```

3. Verify API endpoint works:
```
http://localhost:8000/api/users/
```

### Issue 2: Wrong Roles in Database
**Console shows**: `After role filtering: 0`

**Cause**: Users in database don't have 'Parent' or 'Admin' roles

**Solution**:
1. Check user roles in database:
```python
python manage.py shell
>>> from users.models import User
>>> for u in User.objects.all():
...     print(f"{u.username}: {u.role}")
```

2. Update user roles if needed:
```python
>>> user = User.objects.get(username='parent')
>>> user.role = 'Parent'
>>> user.save()
```

### Issue 3: Current User Not Set
**Console shows**: `Current user: undefined undefined`

**Cause**: AuthContext not providing current user

**Solution**:
1. Check if user is logged in
2. Verify AuthContext is working:
```typescript
// In component
console.log('AuthContext user:', currentUser);
```

3. Refresh page and login again

### Issue 4: Role Filter Not Working
**Console shows**: `After role filter: 0 users with role: Parent`

**Cause**: Role mismatch (case sensitivity or spelling)

**Solution**:
1. Check exact role values in database
2. Ensure roles match exactly: 'Admin', 'Teacher', 'Parent', 'Student'
3. Check for extra spaces or different casing

---

## Expected Behavior

### For Teachers
**Allowed Roles**: `['Parent', 'Admin']`

**Should See**:
- All Parents in the system
- All Admins in the system
- NOT other Teachers
- NOT Students
- NOT themselves

**Role Filter Buttons**:
- "All Users" - Shows all Parents and Admins
- "Parents" - Shows only Parents
- "Admins" - Shows only Admins

### For Parents
**Allowed Roles**: `['Teacher', 'Admin']`

**Should See**:
- All Teachers in the system
- All Admins in the system
- NOT other Parents
- NOT Students
- NOT themselves

### For Admins
**Allowed Roles**: `['Teacher', 'Parent']`

**Should See**:
- All Teachers in the system
- All Parents in the system
- NOT other Admins
- NOT Students
- NOT themselves

---

## Database Schema Check

### User Model Fields
```python
class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=[
            ('Admin', 'Admin'),
            ('Teacher', 'Teacher'),
            ('Student', 'Student'),
            ('Parent', 'Parent'),
        ]
    )
```

**Valid Role Values**:
- `'Admin'` (capital A)
- `'Teacher'` (capital T)
- `'Student'` (capital S)
- `'Parent'` (capital P)

---

## API Endpoint Check

### Test API Directly

**Get All Users**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/users/
```

**Expected Response**:
```json
[
    {
        "id": 1,
        "username": "admin",
        "email": "admin@yeneta.com",
        "role": "Admin",
        "first_name": "",
        "last_name": ""
    },
    {
        "id": 2,
        "username": "teacher",
        "email": "teacher@yeneta.com",
        "role": "Teacher",
        "first_name": "",
        "last_name": ""
    },
    {
        "id": 3,
        "username": "parent",
        "email": "parent@yeneta.com",
        "role": "Parent",
        "first_name": "",
        "last_name": ""
    }
]
```

---

## Quick Fix Commands

### Create Test Users (if needed)

```bash
cd yeneta_backend
python manage.py shell
```

```python
from users.models import User

# Create Admin
admin = User.objects.create_user(
    username='admin',
    email='admin@yeneta.com',
    password='admin123',
    role='Admin'
)

# Create Teacher
teacher = User.objects.create_user(
    username='teacher',
    email='teacher@yeneta.com',
    password='teacher123',
    role='Teacher'
)

# Create Parent
parent = User.objects.create_user(
    username='parent',
    email='parent@yeneta.com',
    password='parent123',
    role='Parent'
)

# Create Student
student = User.objects.create_user(
    username='student',
    email='student@yeneta.com',
    password='student123',
    role='Student'
)

print("Test users created successfully!")
```

---

## Common Mistakes

### 1. Case Sensitivity
❌ Wrong: `role: 'admin'` (lowercase)  
✅ Correct: `role: 'Admin'` (capital A)

### 2. Extra Spaces
❌ Wrong: `role: 'Parent '` (trailing space)  
✅ Correct: `role: 'Parent'`

### 3. Different Spelling
❌ Wrong: `role: 'Administrator'`  
✅ Correct: `role: 'Admin'`

### 4. Null/Undefined Roles
❌ Wrong: `role: null`  
✅ Correct: `role: 'Admin'`

---

## Testing Checklist

After debugging, verify:

- [ ] Console shows users being fetched
- [ ] Console shows correct number after role filtering
- [ ] "All Users" button shows all allowed roles
- [ ] Individual role buttons (Parent, Admin) work
- [ ] Search functionality works
- [ ] Can select a user
- [ ] Can create conversation
- [ ] No console errors

---

## Next Steps

1. **Check Console Logs**: Follow Step 1-3 above
2. **Identify Issue**: Match console output to possible issues
3. **Apply Solution**: Use the appropriate fix
4. **Test Again**: Verify the fix works
5. **Report Back**: Share console output if issue persists

---

**Status**: Debugging tools added  
**Date**: November 7, 2025 (10:20 PM)  
**Action Required**: Check browser console and report findings
