#!/usr/bin/env python
import re

file_path = 'services/apiService.ts'

# Read the file
with open(file_path, 'r') as f:
    content = f.read()

# Find the position of the export const apiService = {
export_pos = content.find('export const apiService = {')
if export_pos == -1:
    print("Could not find export statement")
    exit(1)

# Find the position of "declineCourseRequest," to insert new methods before it
insert_marker = content.find('declineCourseRequest,', export_pos)
if insert_marker == -1:
    print("Could not find declineCourseRequest")
    exit(1)

# New methods to add
new_methods = '''
const underReviewCourseRequest = async (requestId: number, notes?: string): Promise<any> => {
    return api.post(`/academics/teacher-course-requests/${requestId}/under_review/`, { review_notes: notes });
};

const getTeacherCourseRequests = async (): Promise<any[]> => {
    const response = await api.get('/academics/teacher-course-requests/');
    return response.data;
};

const getAllCourseRequests = async (): Promise<any[]> => {
    const response = await api.get('/academics/teacher-course-requests/');
    return response.data;
};

const getStudentEnrollmentRequests = async (): Promise<any[]> => {
    const response = await api.get('/academics/student-enrollment-requests/');
    return response.data;
};

const submitEnrollmentRequest = async (enrollmentData: { course?: number; teacher?: number; subject: string; grade_level: string; stream?: string; family?: number }): Promise<any> => {
    const response = await api.post('/academics/student-enrollment-requests/', enrollmentData);
    return response.data;
};

const approveEnrollmentRequest = async (requestId: number, notes?: string): Promise<any> => {
    return api.post(`/academics/student-enrollment-requests/${requestId}/approve/`, { review_notes: notes });
};

const declineEnrollmentRequest = async (requestId: number, notes?: string): Promise<any> => {
    return api.post(`/academics/student-enrollment-requests/${requestId}/decline/`, { review_notes: notes });
};

const underReviewEnrollmentRequest = async (requestId: number, notes?: string): Promise<any> => {
    return api.post(`/academics/student-enrollment-requests/${requestId}/under_review/`, { review_notes: notes });
};

const getNotifications = async (): Promise<any[]> => {
    const response = await api.get('/communications/notifications/');
    return response.data;
};

const getUnreadNotifications = async (): Promise<any[]> => {
    const response = await api.get('/communications/notifications/unread/');
    return response.data;
};

const getNotificationCount = async (): Promise<{count: number}> => {
    const response = await api.get('/communications/notifications/unread_count/');
    return response.data;
};

const markNotificationAsRead = async (notificationId: number): Promise<any> => {
    return api.post(`/communications/notifications/${notificationId}/mark_read/`);
};

'''

# Insert the new methods before the last 50 lines (where export statement likely is)
content = content[:insert_marker] + new_methods + content[insert_marker:]

# Now we need to add exports for these new methods in the export statement
# Find the closing brace of the export
export_start = content.find('export const apiService = {')
brace_count = 0
i = export_start + len('export const apiService = {')
while i < len(content):
    if content[i] == '{':
        brace_count += 1
    elif content[i] == '}':
        if brace_count == 0:
            export_end = i
            break
        brace_count -= 1
    i += 1

# Find the last comma before the closing brace
last_line = content[:export_end].rfind(',')
if last_line != -1:
    # Add new exports
    exports_to_add = ',\n    underReviewCourseRequest,\n    getTeacherCourseRequests,\n    getAllCourseRequests,\n    getStudentEnrollmentRequests,\n    submitEnrollmentRequest,\n    approveEnrollmentRequest,\n    declineEnrollmentRequest,\n    underReviewEnrollmentRequest,\n    getNotifications,\n    getUnreadNotifications,\n    getNotificationCount,\n    markNotificationAsRead'
    content = content[:last_line+1] + exports_to_add + content[last_line+1:]

# Write back
with open(file_path, 'w') as f:
    f.write(content)

print("API methods added successfully!")
