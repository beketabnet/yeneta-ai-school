#!/usr/bin/env python
import sys
import os

sys.path.insert(0, 'yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')

import django
django.setup()

from academics.models import StudentEnrollmentRequest, Course, Enrollment
from django.contrib.auth import get_user_model

User = get_user_model()

print('=== Diagnosis Report ===')

# Check for StudentEnrollmentRequest records
reqs = StudentEnrollmentRequest.objects.filter(status='approved')
print('\nTotal approved StudentEnrollmentRequests: {}'.format(reqs.count()))

missing_courses = 0
for req in reqs[:10]:
    matching_course = Course.objects.filter(
        subject=req.subject,
        grade_level=req.grade_level,
        teacher=req.teacher
    ).first()
    
    if not matching_course:
        missing_courses += 1
        print('  NO_COURSE: {} ({}) - Teacher: {}'.format(req.subject, req.grade_level, req.teacher.username))
    else:
        print('  HAS_COURSE: {} ({}) - Course ID: {}'.format(req.subject, req.grade_level, matching_course.id))

print('\nMissing matching courses: {} out of {}'.format(missing_courses, min(reqs.count(), 10)))

# Check enrollment data
enrollments = Enrollment.objects.select_related('course', 'student').all()
print('\nTotal Enrollments: {}'.format(enrollments.count()))

# Check courses
print('\nCourses by subject/grade:')
courses = Course.objects.all()
for course in courses[:5]:
    enroll_count = Enrollment.objects.filter(course=course).count()
    print('  Course {}: {} ({}) - Enrollments: {}'.format(course.id, course.title, course.grade_level, enroll_count))
