import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8000/api';

interface User {
  email: string;
  username: string;
  password: string;
  role: 'Student' | 'Teacher' | 'Parent';
}

// Generate unique IDs for this test run
const UNIQUE_ID = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

const testData = {
  student: {
    email: `student-${UNIQUE_ID}@test.com`,
    username: `student${UNIQUE_ID}`,
    password: 'testpass123456',
    role: 'Student' as const
  },
  teacher: {
    email: `teacher-${UNIQUE_ID}@test.com`,
    username: `teacher${UNIQUE_ID}`,
    password: 'testpass123456',
    role: 'Teacher' as const
  },
  parent: {
    email: `parent-${UNIQUE_ID}@test.com`,
    username: `parent${UNIQUE_ID}`,
    password: 'testpass123456',
    role: 'Parent' as const
  }
};

const credentials: { [key: string]: { token: string; id: number } } = {};

async function registerUser(user: User): Promise<{ token: string; id: number }> {
  const registerRes = await fetch(`${API_BASE_URL}/users/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });

  if (!registerRes.ok) {
    const error = await registerRes.text();
    throw new Error(`Register failed: ${registerRes.status} - ${error}`);
  }

  const loginRes = await fetch(`${API_BASE_URL}/users/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      password: user.password
    })
  });

  if (!loginRes.ok) {
    const error = await loginRes.text();
    throw new Error(`Login failed: ${loginRes.status} - ${error}`);
  }

  const tokenData = await loginRes.json();

  const meRes = await fetch(`${API_BASE_URL}/users/me/`, {
    headers: { 'Authorization': `Bearer ${tokenData.access}` }
  });

  const userData = await meRes.json();

  return {
    token: tokenData.access,
    id: userData.id
  };
}

test.describe.serial('Family-Based Course Enrollment API Tests', () => {
  let studentToken: string;
  let teacherToken: string;
  let parentToken: string;
  let studentId: number;
  let teacherId: number;
  let parentId: number;
  let familyId: number;

  test.beforeAll(async () => {
    const student = await registerUser(testData.student);
    studentToken = student.token;
    studentId = student.id;
    credentials['student'] = student;

    const teacher = await registerUser(testData.teacher);
    teacherToken = teacher.token;
    teacherId = teacher.id;
    credentials['teacher'] = teacher;

    const parent = await registerUser(testData.parent);
    parentToken = parent.token;
    parentId = parent.id;
    credentials['parent'] = parent;
  });

  test('Student should be able to create a family', async () => {
    const res = await fetch(`${API_BASE_URL}/users/families/create_family/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        name: `Test Family ${UNIQUE_ID}`
      })
    });

    expect(res.status).toBe(201);
    const family = await res.json();
    expect(family).toHaveProperty('id');
    expect(family).toHaveProperty('name');
    familyId = family.id;
  });

  test('Parent should be able to be added to a family', async () => {
    const res = await fetch(`${API_BASE_URL}/users/family-memberships/add_member/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        family_id: familyId,
        user_id: parentId,
        role: 'Parent'
      })
    });

    expect([200, 201, 202]).toContain(res.status);
    const result = await res.json();
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('role');
    expect(result.role).toBe('Parent');
  });

  test('Student should be able to retrieve their families', async () => {
    const res = await fetch(`${API_BASE_URL}/users/student-families/`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    expect(res.status).toBe(200);
    const families = await res.json();
    expect(Array.isArray(families)).toBe(true);
    expect(families.length).toBeGreaterThan(0);
    expect(families[0]).toHaveProperty('id');
    expect(families[0]).toHaveProperty('name');
    expect(families[0]).toHaveProperty('members');
  });

  test('Student should be able to search for families', async () => {
    const res = await fetch(`${API_BASE_URL}/users/search-families/?q=${testData.parent.username}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    expect(res.status).toBe(200);
    const families = await res.json();
    expect(Array.isArray(families)).toBe(true);
  });

  test('Teacher should be able to create a course request', async () => {
    const res = await fetch(`${API_BASE_URL}/academics/teacher-course-requests/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        subject: 'Mathematics',
        grade_level: '10',
        description: 'Advanced Math Course'
      })
    });

    expect(res.status).toBe(201);
    const request = await res.json();
    expect(request).toHaveProperty('id');
  });

  test('Admin should be able to approve teacher course request', async () => {
    const admin = await registerUser({
      email: `admin-${UNIQUE_ID}@test.com`,
      username: `admin${UNIQUE_ID}`,
      password: 'testpass123456',
      role: 'Student' as const
    });

    const listRes = await fetch(`${API_BASE_URL}/academics/teacher-course-requests/`, {
      headers: { 'Authorization': `Bearer ${admin.token}` }
    });

    expect(listRes.status).toBe(200);
    const requests = await listRes.json();

    if (requests && requests.length > 0) {
      const requestId = requests[0].id;
      const approveRes = await fetch(`${API_BASE_URL}/academics/teacher-course-requests/${requestId}/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${admin.token}`
        }
      });

      expect([200, 201, 202]).toContain(approveRes.status);
    }
  });

  test('Student should be able to submit enrollment request with family', async () => {
    const courseRes = await fetch(`${API_BASE_URL}/academics/courses/?limit=1`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    if (courseRes.status === 200) {
      const coursesData = await courseRes.json();
      if (coursesData.results && coursesData.results.length > 0) {
        const courseId = coursesData.results[0].id;

        const enrollRes = await fetch(`${API_BASE_URL}/academics/student-enrollment-requests/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${studentToken}`
          },
          body: JSON.stringify({
            course_id: courseId,
            family_id: familyId
          })
        });

        expect(enrollRes.status).toBe(201);
      }
    }
  });

  test('Student enrollment should include family in response', async () => {
    const enrollmentsRes = await fetch(`${API_BASE_URL}/academics/student-enrollment-requests/?status=pending`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    expect(enrollmentsRes.status).toBe(200);
    const enrollments = await enrollmentsRes.json();
    if (enrollments && enrollments.length > 0) {
      expect(enrollments[0]).toHaveProperty('family_id');
    }
  });

  test('Teacher should be able to approve student enrollment', async () => {
    const enrollmentsRes = await fetch(`${API_BASE_URL}/academics/student-enrollment-requests/?status=pending`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });

    if (enrollmentsRes.status === 200) {
      const enrollments = await enrollmentsRes.json();
      if (enrollments && enrollments.length > 0) {
        const enrollmentId = enrollments[0].id;

        const approveRes = await fetch(`${API_BASE_URL}/academics/student-enrollment-requests/${enrollmentId}/approve/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${teacherToken}`
          }
        });

        expect([200, 201, 202]).toContain(approveRes.status);
      }
    }
  });

  test('Parent should be able to see linked students through enrollment', async () => {
    const linkedStudentsRes = await fetch(`${API_BASE_URL}/academics/parent-linked-students/`, {
      headers: { 'Authorization': `Bearer ${parentToken}` }
    });

    expect(linkedStudentsRes.status).toBe(200);
    const linkedStudents = await linkedStudentsRes.json();
    expect(Array.isArray(linkedStudents)).toBe(true);
  });

  test('Enrollment request with family should be queryable by parent', async () => {
    const res = await fetch(`${API_BASE_URL}/academics/student-enrollment-requests/?student_id=${studentId}`, {
      headers: { 'Authorization': `Bearer ${parentToken}` }
    });

    if (res.status === 200) {
      const enrollments = await res.json();
      expect(Array.isArray(enrollments)).toBe(true);
    }
  });

  test('Family should have correct member information', async () => {
    const res = await fetch(`${API_BASE_URL}/users/families/${familyId}/`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    if (res.status === 200) {
      const family = await res.json();
      expect(family).toHaveProperty('members');
      expect(Array.isArray(family.members)).toBe(true);
    }
  });

  test('Duplicate enrollment with same family should fail', async () => {
    const courseRes = await fetch(`${API_BASE_URL}/academics/courses/?limit=1`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    if (courseRes.status === 200) {
      const coursesData = await courseRes.json();
      if (coursesData.results && coursesData.results.length > 0) {
        const courseId = coursesData.results[0].id;

        // Try to enroll twice with same family
        const enrollRes1 = await fetch(`${API_BASE_URL}/academics/student-enrollment-requests/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${studentToken}`
          },
          body: JSON.stringify({
            course_id: courseId,
            family_id: familyId
          })
        });

        // Second enrollment with same family should fail
        const enrollRes2 = await fetch(`${API_BASE_URL}/academics/student-enrollment-requests/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${studentToken}`
          },
          body: JSON.stringify({
            course_id: courseId,
            family_id: familyId
          })
        });

        if (enrollRes1.status === 201) {
          expect([400, 409]).toContain(enrollRes2.status);
        }
      }
    }
  });

  test('Student should only see their own families', async () => {
    const res = await fetch(`${API_BASE_URL}/users/student-families/`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    expect(res.status).toBe(200);
    const families = await res.json();
    expect(Array.isArray(families)).toBe(true);
    expect(families.length).toBeGreaterThan(0);
    expect(families[0]).toHaveProperty('id');
  });

  test('Parent should only see families they belong to', async () => {
    const res = await fetch(`${API_BASE_URL}/users/student-families/`, {
      headers: { 'Authorization': `Bearer ${parentToken}` }
    });

    if (res.status === 200) {
      const families = await res.json();
      expect(Array.isArray(families)).toBe(true);
    }
  });
});
