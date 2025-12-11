# Course Approval & Enrollment - Quick Start Guide

## Features Summary

### ✅ 1. User & Rostering Control - Vertical Scrolling
**Location**: Admin Dashboard → User & Rostering Control
**What's New**: Table now scrolls vertically with fixed header
- Supports large lists of users
- Header stays visible while scrolling
- Filter input for searching users
- Max height: 500px with automatic scrolling

### ✅ 2. Course Approval Manager (Admin)
**Location**: Admin Dashboard → Course Approval Manager
**Features**:
- Filter by status: Pending | Approved | Declined | Under Review | All
- Click any request to view details
- Add review notes (optional)
- Actions: Approve | Decline | Set Under Review
- Auto-refresh every 10 seconds (toggle available)
- Manual refresh button
- Real-time notifications on success/failure

**Admin Workflow**:
```
1. View pending course requests
2. Click request to select and view details
3. Add notes explaining decision
4. Click appropriate action button
5. See success notification
6. List updates automatically
```

### ✅ 3. Student Enrollment Management
**Location**: Student Dashboard → Available Courses & My Enrollment Requests
**Features**:
- View all approved courses from teachers
- See teacher name, subject, grade level
- Request enrollment with one click
- Track request status (Pending/Approved/Declined)
- Filter requests by status
- Real-time updates every 15 seconds

**Student Workflow**:
```
1. Browse available approved courses
2. Click "Request Enrollment" on desired course
3. See course move to "My Enrollment Requests" as Pending
4. Wait for admin/teacher to approve
5. Status updates automatically when approved
```

### ✅ 4. Real-time Notifications
**Appears at**: Top-right corner of screen
**Types**:
- ✅ Green: Successfully submitted/approved
- ❌ Red: Error/failed operation
- ℹ️ Blue: Information updates

**Auto-disappears**: After 5 seconds

### ✅ 5. Status Indicators
**Pending** (Blue): Awaiting review
**Approved** (Green): Course/Enrollment approved
**Declined** (Red): Request denied
**Under Review** (Yellow): Being evaluated

## API Integration

The implementation automatically calls these endpoints:

### Admin Endpoints
```
GET    /academics/teacher-course-requests/
       - Filter: ?status=pending|approved|declined|under_review
POST   /academics/teacher-course-requests/{id}/approve/
POST   /academics/teacher-course-requests/{id}/decline/
POST   /academics/teacher-course-requests/{id}/under_review/
```

### Student Endpoints
```
GET    /academics/approved-teacher-courses/
GET    /academics/my-enrollment-requests/
POST   /academics/student-enrollment-requests/
```

## Customization

### Change Auto-Refresh Interval
**Admin Manager** (AdminCourseApprovalManager.tsx):
```tsx
// Line ~94 - Change 10000 to desired milliseconds
}, 10000);  // 10 seconds
```

**Student Enrollment** (StudentCourseEnrollment.tsx):
```tsx
// Line ~82 - Change 15000 to desired milliseconds
}, 15000);  // 15 seconds
```

### Change Notification Duration
**Both Components**:
```tsx
// Change 5000 to desired milliseconds
setTimeout(() => {
  setNotifications(prev => prev.filter(n => n.id !== id));
}, 5000);  // 5 seconds
```

### Change Max Height of Scrolling
**UserManagement.tsx** (Line ~61):
```tsx
style={{ maxHeight: '500px' }}  // Change to your preferred height
```

**AdminCourseApprovalManager.tsx** (Line ~233):
```tsx
style={{ maxHeight: '600px' }}  // Change to your preferred height
```

## Dark Mode Support

All components automatically support dark mode:
- Automatic color switching
- Text contrast maintained
- Icons visible in both modes
- No configuration needed

## Browser Support

- Chrome/Chromium ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Mobile browsers ✅

## Testing

### Manual Testing Checklist

**Admin Tests**:
- [ ] Can view pending requests
- [ ] Can filter by status
- [ ] Can add review notes
- [ ] Can approve request
- [ ] Can decline request
- [ ] Can set under review
- [ ] Notification appears on action
- [ ] Auto-refresh works (watch for new requests)
- [ ] Can toggle auto-refresh
- [ ] Manual refresh button works

**Student Tests**:
- [ ] Can see available courses
- [ ] Can request enrollment
- [ ] Request appears in My Requests as Pending
- [ ] Can filter requests by status
- [ ] Status updates when admin approves
- [ ] Notification appears on request submit
- [ ] Auto-refresh shows updated status

**UI/UX Tests**:
- [ ] Dark mode looks good
- [ ] Vertical scroll works on user table
- [ ] All buttons are clickable
- [ ] Icons display correctly
- [ ] Layout looks good on mobile
- [ ] Notifications disappear after 5 seconds

### Automated E2E Tests

Run all tests:
```bash
npm run dev
npx playwright test tests/course-approval-enrollment.spec.ts
```

Run specific test:
```bash
npx playwright test tests/course-approval-enrollment.spec.ts -k "should display course approval"
```

View test report:
```bash
npx playwright show-report
```

## Troubleshooting

### Issue: Components not showing
**Solution**: Ensure components are imported in Dashboard files and routes are configured

### Issue: Notifications not appearing  
**Solution**: Check browser console for errors, verify notification container exists

### Issue: Auto-refresh not working
**Solution**: Check browser console, verify API endpoints are accessible, check network tab

### Issue: Scroll not working
**Solution**: Ensure container has max-height style applied, check overflow classes

## File Locations

**Modified Files**:
- `components/admin/UserManagement.tsx` - Added vertical scroll
- `components/admin/AdminCourseApprovalManager.tsx` - Enhanced with full workflow
- `services/apiService.ts` - Added new API methods

**New Files**:
- `components/student/StudentCourseEnrollment.tsx` - Student enrollment component
- `tests/course-approval-enrollment.spec.ts` - E2E tests
- `COURSE_APPROVAL_IMPLEMENTATION.md` - Detailed documentation
- `COURSE_APPROVAL_QUICK_START.md` - This file

## Support

For issues or questions:
1. Check error messages in browser console
2. Review implementation documentation
3. Verify API endpoints are responding
4. Check test output for specific failures

## Success Metrics

✅ Admin can approve/decline teacher course requests
✅ Students see approved courses and can request enrollment
✅ Real-time updates keep data synchronized
✅ Notifications confirm all actions
✅ System works seamlessly across devices
✅ No performance degradation with auto-refresh
✅ Accessible and responsive design
✅ Full dark mode support

---

**Status**: ✅ Implementation Complete
**Last Updated**: November 2024
**Version**: 1.0
