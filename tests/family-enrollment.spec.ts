import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:8000/api';

const UNIQUE_ID = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

const testData = {
  student: {
    email: `teststudent-${UNIQUE_ID}@example.com`,
    username: `teststudent${UNIQUE_ID}`,
    password: 'testpass123'
  },
  teacher: {
    email: `testteacher-${UNIQUE_ID}@example.com`,
    username: `testteacher${UNIQUE_ID}`,
    password: 'testpass123'
  },
  parent: {
    email: `testparent-${UNIQUE_ID}@example.com`,
    username: `testparent${UNIQUE_ID}`,
    password: 'testpass123'
  },
  family: {
    name: 'Test Family - E2E'
  },
  course: {
    subject: 'Mathematics',
    gradeLevel: '10'
  }
};

test.describe.serial('Family-Based Course Enrollment', () => {
  let studentToken: string;
  let teacherToken: string;
  let parentToken: string;
  let familyId: number;
  let teacherId: number;

  test.beforeAll(async () => {
    const registerStudent = await fetch(`${API_BASE_URL}/users/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testData.student.email,
        username: testData.student.username,
        password: testData.student.password,
        role: 'Student'
      })
    });

    const registerTeacher = await fetch(`${API_BASE_URL}/users/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testData.teacher.email,
        username: testData.teacher.username,
        password: testData.teacher.password,
        role: 'Teacher'
      })
    });

    const registerParent = await fetch(`${API_BASE_URL}/users/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testData.parent.email,
        username: testData.parent.username,
        password: testData.parent.password,
        role: 'Parent'
      })
    });

    const studentLogin = await fetch(`${API_BASE_URL}/users/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testData.student.email,
        password: testData.student.password
      })
    });
    const studentData = await studentLogin.json();
    studentToken = studentData.access;

    const teacherLogin = await fetch(`${API_BASE_URL}/users/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testData.teacher.email,
        password: testData.teacher.password
      })
    });
    const teacherData = await teacherLogin.json();
    teacherToken = teacherData.access;

    const parentLogin = await fetch(`${API_BASE_URL}/users/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testData.parent.email,
        password: testData.parent.password
      })
    });
    const parentData = await parentLogin.json();
    parentToken = parentData.access;

    const userMe = await fetch(`${API_BASE_URL}/users/me/`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    const userData = await userMe.json();
    teacherId = userData.id;

    const createFamily = await fetch(`${API_BASE_URL}/users/families/create_family/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ name: testData.family.name })
    });
    const familyData = await createFamily.json();
    familyId = familyData.id;

    const addParentToFamily = await fetch(`${API_BASE_URL}/users/family-memberships/add_member/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        family_id: familyId,
        user_id: (await (await fetch(`${API_BASE_URL}/users/me/`, {
          headers: { 'Authorization': `Bearer ${parentToken}` }
        })).json()).id,
        role: 'Parent/Guardian'
      })
    });

    const createTeacherCourseRequest = await fetch(`${API_BASE_URL}/academics/teacher-course-requests/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        subject: testData.course.subject,
        grade_level: testData.course.gradeLevel,
        stream: ''
      })
    });
    const courseRequest = await createTeacherCourseRequest.json();

    const approveCourseRequest = await fetch(`${API_BASE_URL}/academics/teacher-course-requests/${courseRequest.id}/approve/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({})
    });
  });

  test('Student should see Family Selector on enrollment page', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.fill('input[placeholder*="email"]', testData.student.email);
    await page.fill('input[placeholder*="password"]', testData.student.password);
    await page.click('button:has-text("Login")');
    
    await page.waitForNavigation();
    await page.goto(`${BASE_URL}/student-dashboard`);
    
    await page.click('text=Course Enrollment');
    
    await expect(page.locator('text=Family')).toBeVisible();
    await expect(page.locator('text=Select a family')).toBeVisible();
  });

  test('Family Selector should display available families', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.fill('input[placeholder*="email"]', testData.student.email);
    await page.fill('input[placeholder*="password"]', testData.student.password);
    await page.click('button:has-text("Login")');
    
    await page.waitForNavigation();
    await page.goto(`${BASE_URL}/student-dashboard`);
    
    await page.click('text=Course Enrollment');
    
    const familyElements = await page.locator('text=Test Family - E2E').count();
    expect(familyElements).toBeGreaterThan(0);
  });

  test('Student can search families by username', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.fill('input[placeholder*="email"]', testData.student.email);
    await page.fill('input[placeholder*="password"]', testData.student.password);
    await page.click('button:has-text("Login")');
    
    await page.waitForNavigation();
    await page.goto(`${BASE_URL}/student-dashboard`);
    
    await page.click('text=Course Enrollment');
    
    const searchInput = page.locator('input[placeholder*="Search families"]');
    await searchInput.fill(testData.parent.username);
    
    await page.click('button:has-text("Search")');
    
    await expect(page.locator('text=Test Family - E2E')).toBeVisible();
  });

  test('Enroll button should be disabled until family is selected', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.fill('input[placeholder*="email"]', testData.student.email);
    await page.fill('input[placeholder*="password"]', testData.student.password);
    await page.click('button:has-text("Login")');
    
    await page.waitForNavigation();
    await page.goto(`${BASE_URL}/student-dashboard`);
    
    await page.click('text=Course Enrollment');
    
    const enrollButtons = await page.locator('button:has-text("Select Family First")').count();
    expect(enrollButtons).toBeGreaterThan(0);
    
    await page.click('text=Test Family - E2E');
    
    const updatedButtons = await page.locator('button:has-text("Enroll")').count();
    expect(updatedButtons).toBeGreaterThan(0);
  });

  test('Student can complete enrollment with family selection', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.fill('input[placeholder*="email"]', testData.student.email);
    await page.fill('input[placeholder*="password"]', testData.student.password);
    await page.click('button:has-text("Login")');
    
    await page.waitForNavigation();
    await page.goto(`${BASE_URL}/student-dashboard`);
    
    await page.click('text=Course Enrollment');
    
    await page.click('text=Test Family - E2E');
    
    await page.click('button:has-text("Enroll")');
    
    await page.waitForTimeout(1000);
    
    await expect(page.locator('text=pending|under_review')).toBeVisible();
  });

  test('Enrollment request should include family information', async () => {
    const enrollmentResponse = await fetch(`${API_BASE_URL}/academics/student-enrollment-requests/`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    
    const enrollments = await enrollmentResponse.json();
    const enrollment = enrollments.results?.[0] || enrollments[0];
    
    expect(enrollment).toHaveProperty('family');
    expect(enrollment.family).toBe(familyId);
    expect(enrollment).toHaveProperty('family_name');
  });

  test('Parent should see student in dashboard after enrollment approval', async ({ page }) => {
    const approveEnrollment = await fetch(`${API_BASE_URL}/academics/student-enrollment-requests/?student__username=${testData.student.username}`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    
    const enrollments = await approveEnrollment.json();
    const enrollment = enrollments.results?.[0] || enrollments[0];
    
    await fetch(`${API_BASE_URL}/academics/student-enrollment-requests/${enrollment.id}/approve/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({})
    });

    await page.goto(BASE_URL);
    
    await page.fill('input[placeholder*="email"]', testData.parent.email);
    await page.fill('input[placeholder*="password"]', testData.parent.password);
    await page.click('button:has-text("Login")');
    
    await page.waitForNavigation();
    await page.goto(`${BASE_URL}/parent-dashboard`);
    
    await expect(page.locator(`text=${testData.student.username}`)).toBeVisible();
  });

  test('Parent dashboard should display student courses', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.fill('input[placeholder*="email"]', testData.parent.email);
    await page.fill('input[placeholder*="password"]', testData.parent.password);
    await page.click('button:has-text("Login")');
    
    await page.waitForNavigation();
    await page.goto(`${BASE_URL}/parent-dashboard`);
    
    const dropdown = page.locator('select, [role="combobox"]').first();
    await dropdown.click();
    
    await expect(page.locator(`text=${testData.student.username}`)).toBeVisible();
  });

  test('Parent-linked-students API should return correct students', async () => {
    const response = await fetch(`${API_BASE_URL}/academics/parent-linked-students/`, {
      headers: { 'Authorization': `Bearer ${parentToken}` }
    });
    
    const students = await response.json();
    
    expect(Array.isArray(students)).toBe(true);
    if (students.length > 0) {
      expect(students[0]).toHaveProperty('id');
      expect(students[0]).toHaveProperty('name');
      expect(students[0]).toHaveProperty('courses');
      expect(Array.isArray(students[0].courses)).toBe(true);
    }
  });

  test('Family unique constraint should prevent duplicate enrollments', async () => {
    const studentResponse = await fetch(`${API_BASE_URL}/users/me/`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const student = await studentResponse.json();

    const duplicateEnrollment = await fetch(`${API_BASE_URL}/academics/student-enrollment-requests/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        teacher: teacherId,
        subject: testData.course.subject,
        grade_level: testData.course.gradeLevel,
        stream: '',
        family: familyId
      })
    });

    expect(duplicateEnrollment.status).toBe(400);
  });

  test('Family search should filter by name and username', async () => {
    const searchResponse = await fetch(`${API_BASE_URL}/users/search-families/?q=${testData.parent.username}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    
    const families = await searchResponse.json();
    
    expect(Array.isArray(families)).toBe(true);
    expect(families.length).toBeGreaterThan(0);
    expect(families[0].name).toContain('Test Family');
  });

  test('Student families endpoint should return correct families', async () => {
    const response = await fetch(`${API_BASE_URL}/users/student-families/`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    
    const families = await response.json();
    
    expect(Array.isArray(families)).toBe(true);
    expect(families.length).toBeGreaterThan(0);
    expect(families[0]).toHaveProperty('id');
    expect(families[0]).toHaveProperty('name');
    expect(families[0]).toHaveProperty('members');
  });
});
