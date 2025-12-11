# Message Attachment Testing Guide

**Quick Reference for Testing the New Attachment Display Feature**

---

## Quick Start

1. **Start Backend**:
```bash
cd yeneta_backend
python manage.py runserver
```

2. **Start Frontend**:
```bash
npm start
# or
npm run dev
```

3. **Login**:
   - Teacher: `teacher@yeneta.com` / `teacher123`
   - Parent: `parent@yeneta.com` / `parent123`

---

## Test Scenarios

### 1. Image Attachments 🖼️

**Steps**:
1. Navigate to Secure Teacher-Parent Messaging
2. Click paperclip icon
3. Select an image file (JPG, PNG, GIF)
4. Send message

**Expected Results**:
- ✅ Image displays inline in message bubble
- ✅ Image is properly sized (max 300px height)
- ✅ Click image → Opens full-screen zoom modal
- ✅ Click outside modal → Closes zoom
- ✅ Download button visible and functional
- ✅ Loading spinner shows while image loads

**Test Files**:
- Small image (< 100KB)
- Large image (> 1MB)
- Different formats: JPG, PNG, GIF, WebP

---

### 2. Video Attachments 🎥

**Steps**:
1. Click video camera icon
2. Record a short video (or upload MP4 file)
3. Send message

**Expected Results**:
- ✅ Video player displays inline
- ✅ Play button works
- ✅ Pause button works
- ✅ Seek bar works
- ✅ Volume control works
- ✅ Fullscreen button works
- ✅ Download button visible and functional

**Test Files**:
- MP4 video (H.264 codec)
- WebM video
- Short video (< 10 seconds)
- Longer video (> 1 minute)

---

### 3. Audio Attachments 🎵

**Steps**:
1. Click microphone icon
2. Record audio (or upload MP3 file)
3. Send message

**Expected Results**:
- ✅ Audio player displays inline
- ✅ Play button works
- ✅ Pause button works
- ✅ Seek bar works
- ✅ Volume control works
- ✅ Download button visible and functional
- ✅ File name displays correctly

**Test Files**:
- MP3 audio
- WAV audio
- Short recording (< 5 seconds)
- Longer recording (> 30 seconds)

---

### 4. Document Attachments 📄

**Steps**:
1. Click paperclip icon
2. Select a document (PDF, DOC, XLSX, etc.)
3. Send message

**Expected Results**:
- ✅ File card displays with icon
- ✅ File name shows correctly
- ✅ File type indicator shows (e.g., "PDF File")
- ✅ Download button prominent and functional
- ✅ Click download → File downloads with correct name

**Test Files**:
- PDF document
- Word document (DOC/DOCX)
- Excel spreadsheet (XLS/XLSX)
- PowerPoint presentation (PPT/PPTX)
- Text file (TXT)

---

### 5. Mixed Messages (Text + Attachment)

**Steps**:
1. Type a text message
2. Attach a file (any type)
3. Send message

**Expected Results**:
- ✅ Both text and attachment display
- ✅ Attachment shows first
- ✅ Text shows below attachment
- ✅ Proper spacing between elements
- ✅ Message bubble adjusts size appropriately

---

### 6. Attachment-Only Messages

**Steps**:
1. Don't type any text
2. Attach a file
3. Send message

**Expected Results**:
- ✅ Message sends successfully
- ✅ Only attachment displays (no empty text)
- ✅ Message bubble sized appropriately
- ✅ Timestamp and status indicators show

---

### 7. Multiple Messages with Different Attachment Types

**Steps**:
1. Send image
2. Send video
3. Send audio
4. Send document
5. Send text-only message

**Expected Results**:
- ✅ All messages display correctly
- ✅ Each attachment type renders appropriately
- ✅ Scrolling works smoothly
- ✅ No layout issues
- ✅ Messages align correctly (sent vs received)

---

### 8. Responsive Design

**Test on Different Screen Sizes**:

#### Mobile (< 640px)
- ✅ Attachments scale to fit screen
- ✅ Controls remain accessible
- ✅ Download buttons visible
- ✅ Zoom modal works
- ✅ Video/audio players functional

#### Tablet (640px - 1024px)
- ✅ Optimal sizing for attachments
- ✅ Two-column layout maintained
- ✅ All features accessible

#### Desktop (> 1024px)
- ✅ Max-width constraints applied
- ✅ Proper spacing
- ✅ All features work

---

### 9. Dark Mode

**Steps**:
1. Toggle dark mode (if available)
2. Send/view attachments

**Expected Results**:
- ✅ Attachments visible in dark mode
- ✅ Proper contrast maintained
- ✅ Download buttons visible
- ✅ Media players styled correctly
- ✅ Zoom modal has dark background

---

### 10. Error Handling

#### Broken Image URL
**Steps**:
1. Manually create message with invalid image URL
2. View message

**Expected Results**:
- ✅ Fallback display shows
- ✅ No console errors break the app
- ✅ Download button still available

#### Network Error During Download
**Steps**:
1. Disconnect internet
2. Try to download attachment

**Expected Results**:
- ✅ Error logged to console
- ✅ Fallback: Opens in new tab
- ✅ User sees appropriate feedback

---

### 11. Performance

**Steps**:
1. Send 10+ messages with attachments
2. Scroll through conversation
3. Monitor browser performance

**Expected Results**:
- ✅ Smooth scrolling
- ✅ Images lazy load
- ✅ No memory leaks
- ✅ No excessive re-renders
- ✅ Fast initial page load

---

### 12. Accessibility

**Keyboard Navigation**:
1. Tab through message attachments
2. Press Enter on download buttons
3. Press Escape in zoom modal

**Expected Results**:
- ✅ All buttons keyboard accessible
- ✅ Proper focus indicators
- ✅ Tab order logical
- ✅ Escape closes modals

**Screen Reader**:
1. Enable screen reader
2. Navigate through messages

**Expected Results**:
- ✅ ARIA labels read correctly
- ✅ File names announced
- ✅ Button purposes clear
- ✅ Image alt text present

---

## Browser Testing

Test in multiple browsers:

- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest)
- [ ] **Edge** (latest)
- [ ] **Mobile Safari** (iOS)
- [ ] **Chrome Mobile** (Android)

---

## Common Issues and Solutions

### Issue: Images don't display
**Solution**: Check backend MEDIA_URL and MEDIA_ROOT settings

### Issue: Videos don't play
**Solution**: Ensure video format is MP4 (H.264). WebM not supported in Safari.

### Issue: Download doesn't work
**Solution**: Check CORS settings in backend. Ensure proper headers.

### Issue: Zoom modal doesn't close
**Solution**: Check z-index conflicts with other components

### Issue: Audio player not visible
**Solution**: Check browser console for errors. Ensure audio format supported.

---

## Backend Configuration Check

Ensure these settings in `settings.py`:

```python
# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# CORS (if frontend on different port)
CORS_ALLOW_ALL_ORIGINS = True  # Development only
# Or specific origins:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]
```

Ensure `urls.py` serves media files:

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... your patterns
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## Verification Checklist

After testing, verify:

- [ ] All attachment types display correctly
- [ ] Download works for all file types
- [ ] Media players have all controls
- [ ] Zoom modal works for images
- [ ] Responsive on all screen sizes
- [ ] Works in light and dark mode
- [ ] No console errors
- [ ] No breaking changes to existing features
- [ ] Teacher Dashboard works
- [ ] Parent Dashboard works
- [ ] Performance is acceptable
- [ ] Accessibility features work

---

## Reporting Issues

If you find issues, document:

1. **What**: Describe the issue
2. **Where**: Which component/page
3. **How**: Steps to reproduce
4. **Expected**: What should happen
5. **Actual**: What actually happens
6. **Browser**: Which browser and version
7. **Console**: Any console errors
8. **Screenshot**: If applicable

---

## Success Criteria

✅ **Feature is ready when**:
- All test scenarios pass
- No console errors
- Works in all major browsers
- Responsive on all devices
- Accessible to all users
- Performance is acceptable
- Documentation is complete
- No breaking changes

---

**Happy Testing!** 🎉
