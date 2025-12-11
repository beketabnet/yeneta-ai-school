
Project: chromium
11/13/2025, 10:59:39 PM
Total time: 20.3s
gradebook-manager.spec.ts
Gradebook Manager › should display gradebook manager tabchromium
9ms
gradebook-manager.spec.ts:13
Gradebook Manager › should load gradebook manager interfacechromium
16ms
gradebook-manager.spec.ts:18
Gradebook Manager › should filter students by grade levelchromium
6ms
gradebook-manager.spec.ts:30
Gradebook Manager › should display gradebook table with students and assignmentschromium
7ms
gradebook-manager.spec.ts:40
Gradebook Manager › should allow editing grades inlinechromium
11ms
gradebook-manager.spec.ts:55
Gradebook Manager › should validate grade inputchromium
7ms
gradebook-manager.spec.ts:79
Gradebook Manager › should cancel grade editingchromium
4ms
gradebook-manager.spec.ts:100
Gradebook Manager › should persist grade changeschromium
4ms
gradebook-manager.spec.ts:121
family-enrollment.spec.ts
Family-Based Course Enrollment › Student should see Family Selector on enrollment pagechromium
5ms
family-enrollment.spec.ts:161
Family-Based Course Enrollment › Student can search families by usernamechromium
8ms
family-enrollment.spec.ts:193
Family-Based Course Enrollment › Student can complete enrollment with family selectionchromium
0ms
family-enrollment.spec.ts:234
Family-Based Course Enrollment › Parent should see student in dashboard after enrollment approvalchromium
0ms
family-enrollment.spec.ts:268
Family-Based Course Enrollment › Parent-linked-students API should return correct studentschromium
0ms
family-enrollment.spec.ts:313
Family-Based Course Enrollment › Family search should filter by name and usernamechromium
0ms
family-enrollment.spec.ts:353
family-enrollment-api.spec.ts
Family-Based Course Enrollment API Tests › Student should be able to retrieve their familieschromium
142ms
family-enrollment-api.spec.ts:141
Family-Based Course Enrollment API Tests › Admin should be able to approve teacher course requestchromium
203ms
family-enrollment-api.spec.ts:184
Family-Based Course Enrollment API Tests › Student should be able to submit enrollment request with familychromium
204ms
family-enrollment-api.spec.ts:210
Family-Based Course Enrollment API Tests › Student should only see their own familieschromium
120ms
family-enrollment-api.spec.ts:349
Family-Based Course Enrollment API Tests › Student should be able to create a familychromium
181ms
family-enrollment-api.spec.ts:101
Family-Based Course Enrollment API Tests › Parent should be able to be added to a familychromium
120ms
family-enrollment-api.spec.ts:120
Family-Based Course Enrollment API Tests › Student should be able to search for familieschromium
13ms
family-enrollment-api.spec.ts:155
Family-Based Course Enrollment API Tests › Teacher should be able to create a course requestchromium
214ms
family-enrollment-api.spec.ts:165
Family-Based Course Enrollment API Tests › Student enrollment should include family in responsechromium
10ms
family-enrollment-api.spec.ts:232
Family-Based Course Enrollment API Tests › Teacher should be able to approve student enrollmentchromium
149ms
family-enrollment-api.spec.ts:248
Family-Based Course Enrollment API Tests › Parent should be able to see linked students through enrollmentchromium
129ms
family-enrollment-api.spec.ts:271
Family-Based Course Enrollment API Tests › Enrollment request with family should be queryable by parentchromium
172ms
family-enrollment-api.spec.ts:289
Family-Based Course Enrollment API Tests › Family should have correct member informationchromium
65ms
family-enrollment-api.spec.ts:300
Family-Based Course Enrollment API Tests › Duplicate enrollment with same family should failchromium
286ms
family-enrollment-api.spec.ts:315
Family-Based Course Enrollment API Tests › Parent should only see families they belong tochromium
86ms
family-enrollment-api.spec.ts:361

================================================

Terminal Output:

(venv) D:\django_project\yeneta-ai-school\yeneta_backend>python manage.py runserver
Watching for file changes with StatReloader
Performing system checks...

OpenAI API key not found
System check identified no issues (0 silenced).
November 13, 2025 - 22:59:29
Django version 4.2.26, using settings 'yeneta_backend.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.

Bad Request: /api/users/register/
[13/Nov/2025 22:59:50] "POST /api/users/register/ HTTP/1.1" 400 50
Bad Request: /api/users/register/
[13/Nov/2025 22:59:50] "POST /api/users/register/ HTTP/1.1" 400 50
Bad Request: /api/users/register/
[13/Nov/2025 22:59:50] "POST /api/users/register/ HTTP/1.1" 400 50
Bad Request: /api/users/register/
Bad Request: /api/users/register/
[13/Nov/2025 22:59:50] "POST /api/users/register/ HTTP/1.1" 400 50
[13/Nov/2025 22:59:50] "POST /api/users/register/ HTTP/1.1" 400 50
Bad Request: /api/users/register/
[13/Nov/2025 22:59:50] "POST /api/users/register/ HTTP/1.1" 400 50
[13/Nov/2025 22:59:51] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:51] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:51] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:51] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:51] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:51] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:51] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:51] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:51] "POST /api/users/token/ HTTP/1.1" 200 581
[13/Nov/2025 22:59:51] "POST /api/users/token/ HTTP/1.1" 200 581
[13/Nov/2025 22:59:52] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:52] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:52] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:52] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:52] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:52] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:52] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:52] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:52] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:52] "POST /api/users/token/ HTTP/1.1" 200 581
[13/Nov/2025 22:59:52] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:52] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:52] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:52] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:52] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:52] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:52] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:52] "POST /api/users/token/ HTTP/1.1" 200 581
[13/Nov/2025 22:59:53] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:53] "POST /api/users/token/ HTTP/1.1" 200 578
[13/Nov/2025 22:59:53] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:53] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:53] "GET /api/users/me/ HTTP/1.1" 200 223
[13/Nov/2025 22:59:53] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:53] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:53] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:53] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:53] "POST /api/users/families/create_family/ HTTP/1.1" 201 484
[13/Nov/2025 22:59:53] "POST /api/users/token/ HTTP/1.1" 200 578
[13/Nov/2025 22:59:53] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:53] "GET /api/users/me/ HTTP/1.1" 200 220
[13/Nov/2025 22:59:53] "GET /api/users/me/ HTTP/1.1" 200 223
[13/Nov/2025 22:59:53] "POST /api/users/families/create_family/ HTTP/1.1" 201 484
[13/Nov/2025 22:59:53] "POST /api/users/family-memberships/add_member/ HTTP/1.1" 201 337
[13/Nov/2025 22:59:53] "GET /api/users/me/ HTTP/1.1" 200 220
[13/Nov/2025 22:59:53] "POST /api/users/family-memberships/add_member/ HTTP/1.1" 201 337
[13/Nov/2025 22:59:53] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:53] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:53] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:53] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:53] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:53] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:53] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:54] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:54] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:54] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:54] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:54] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:54] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:54] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:54] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:54] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:54] "POST /api/users/register/ HTTP/1.1" 201 140
[13/Nov/2025 22:59:54] "POST /api/users/register/ HTTP/1.1" 201 140
[13/Nov/2025 22:59:54] "POST /api/users/register/ HTTP/1.1" 201 140
[13/Nov/2025 22:59:54] "POST /api/users/register/ HTTP/1.1" 201 140
[13/Nov/2025 22:59:54] "POST /api/users/register/ HTTP/1.1" 201 140
[13/Nov/2025 22:59:54] "POST /api/users/register/ HTTP/1.1" 201 140
[13/Nov/2025 22:59:54] "POST /api/users/register/ HTTP/1.1" 201 140
[13/Nov/2025 22:59:55] "POST /api/users/register/ HTTP/1.1" 201 140
[13/Nov/2025 22:59:55] "POST /api/users/token/ HTTP/1.1" 200 601
[13/Nov/2025 22:59:55] "POST /api/users/token/ HTTP/1.1" 200 601
[13/Nov/2025 22:59:55] "GET /api/users/me/ HTTP/1.1" 200 238
[13/Nov/2025 22:59:55] "GET /api/users/me/ HTTP/1.1" 200 238
Internal Server Error: /api/academics/teacher-course-requests/
Traceback (most recent call last):
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 89, in _execute
    return self.cursor.execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\sqlite3\base.py", line 328, in execute
    return super().execute(query, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
sqlite3.IntegrityError: UNIQUE constraint failed: academics_teachercourserequest.teacher_id, academics_teachercourserequest.subject, academics_teachercourserequest.grade_level, academics_teachercourserequest.stream

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\core\handlers\exception.py", line 55, in inner
    response = get_response(request)
               ^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\core\handlers\base.py", line 197, in _get_response
    response = wrapped_callback(request, *callback_args, **callback_kwargs)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\views\decorators\csrf.py", line 56, in wrapper_view
    return view_func(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\viewsets.py", line 125, in view
    return self.dispatch(request, *args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 515, in dispatch
    response = self.handle_exception(exc)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 475, in handle_exception
    self.raise_uncaught_exception(exc)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 486, in raise_uncaught_exception
    raise exc
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 512, in dispatch
    response = handler(request, *args, **kwargs)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\mixins.py", line 19, in create
    self.perform_create(serializer)
  File "D:\django_project\yeneta-ai-school\yeneta_backend\academics\views.py", line 29, in perform_create
    serializer.save(teacher=self.request.user)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\serializers.py", line 210, in save
    self.instance = self.create(validated_data)
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\serializers.py", line 991, in create
    instance = ModelClass._default_manager.create(**validated_data)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\manager.py", line 87, in manager_method
    return getattr(self.get_queryset(), name)(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\query.py", line 660, in create
    obj.save(force_insert=True, using=self.db)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 814, in save
    self.save_base(
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 877, in save_base
    updated = self._save_table(
              ^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 1020, in _save_table
    results = self._do_insert(
              ^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 1061, in _do_insert
    return manager._insert(
           ^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\manager.py", line 87, in manager_method
    return getattr(self.get_queryset(), name)(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\query.py", line 1810, in _insert
    return query.get_compiler(using=using).execute_sql(returning_fields)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\sql\compiler.py", line 1822, in execute_sql
    cursor.execute(sql, params)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 102, in execute
    return super().execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 67, in execute
    return self._execute_with_wrappers(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 80, in _execute_with_wrappers
    return executor(sql, params, many, context)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 84, in _execute
    with self.db.wrap_database_errors:
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\utils.py", line 91, in __exit__
    raise dj_exc_value.with_traceback(traceback) from exc_value
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 89, in _execute
    return self.cursor.execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\sqlite3\base.py", line 328, in execute
    return super().execute(query, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
django.db.utils.IntegrityError: UNIQUE constraint failed: academics_teachercourserequest.teacher_id, academics_teachercourserequest.subject, academics_teachercourserequest.grade_level, academics_teachercourserequest.stream
[13/Nov/2025 22:59:55] "POST /api/academics/teacher-course-requests/ HTTP/1.1" 500 244718
Internal Server Error: /api/academics/teacher-course-requests/
Traceback (most recent call last):
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 89, in _execute
    return self.cursor.execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\sqlite3\base.py", line 328, in execute
    return super().execute(query, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
sqlite3.IntegrityError: UNIQUE constraint failed: academics_teachercourserequest.teacher_id, academics_teachercourserequest.subject, academics_teachercourserequest.grade_level, academics_teachercourserequest.stream

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\core\handlers\exception.py", line 55, in inner
    response = get_response(request)
               ^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\core\handlers\base.py", line 197, in _get_response
    response = wrapped_callback(request, *callback_args, **callback_kwargs)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\views\decorators\csrf.py", line 56, in wrapper_view
    return view_func(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\viewsets.py", line 125, in view
    return self.dispatch(request, *args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 515, in dispatch
    response = self.handle_exception(exc)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 475, in handle_exception
    self.raise_uncaught_exception(exc)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 486, in raise_uncaught_exception
    raise exc
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 512, in dispatch
    response = handler(request, *args, **kwargs)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\mixins.py", line 19, in create
    self.perform_create(serializer)
  File "D:\django_project\yeneta-ai-school\yeneta_backend\academics\views.py", line 29, in perform_create
    serializer.save(teacher=self.request.user)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\serializers.py", line 210, in save
    self.instance = self.create(validated_data)
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\serializers.py", line 991, in create
    instance = ModelClass._default_manager.create(**validated_data)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\manager.py", line 87, in manager_method
    return getattr(self.get_queryset(), name)(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\query.py", line 660, in create
    obj.save(force_insert=True, using=self.db)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 814, in save
    self.save_base(
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 877, in save_base
    updated = self._save_table(
              ^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 1020, in _save_table
    results = self._do_insert(
              ^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 1061, in _do_insert
    return manager._insert(
           ^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\manager.py", line 87, in manager_method
    return getattr(self.get_queryset(), name)(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\query.py", line 1810, in _insert
    return query.get_compiler(using=using).execute_sql(returning_fields)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\sql\compiler.py", line 1822, in execute_sql
    cursor.execute(sql, params)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 102, in execute
    return super().execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 67, in execute
    return self._execute_with_wrappers(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 80, in _execute_with_wrappers
    return executor(sql, params, many, context)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 84, in _execute
    with self.db.wrap_database_errors:
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\utils.py", line 91, in __exit__
    raise dj_exc_value.with_traceback(traceback) from exc_value
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 89, in _execute
    return self.cursor.execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\sqlite3\base.py", line 328, in execute
    return super().execute(query, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
django.db.utils.IntegrityError: UNIQUE constraint failed: academics_teachercourserequest.teacher_id, academics_teachercourserequest.subject, academics_teachercourserequest.grade_level, academics_teachercourserequest.stream
[13/Nov/2025 22:59:55] "POST /api/academics/teacher-course-requests/ HTTP/1.1" 500 244718
[13/Nov/2025 22:59:55] "POST /api/users/token/ HTTP/1.1" 200 601
[13/Nov/2025 22:59:55] "GET /api/users/me/ HTTP/1.1" 200 238
[13/Nov/2025 22:59:55] "POST /api/users/token/ HTTP/1.1" 200 601
[13/Nov/2025 22:59:55] "POST /api/users/token/ HTTP/1.1" 200 601
[13/Nov/2025 22:59:55] "POST /api/users/token/ HTTP/1.1" 200 601
[13/Nov/2025 22:59:55] "GET /api/academics/student-enrollment-requests/?family__id=undefined HTTP/1.1" 200 2
[13/Nov/2025 22:59:55] "GET /api/users/me/ HTTP/1.1" 200 238
[13/Nov/2025 22:59:55] "POST /api/users/token/ HTTP/1.1" 200 601
[13/Nov/2025 22:59:55] "POST /api/academics/teacher-course-requests/ HTTP/1.1" 201 438
[13/Nov/2025 22:59:55] "GET /api/users/me/ HTTP/1.1" 200 238
[13/Nov/2025 22:59:55] "GET /api/users/me/ HTTP/1.1" 200 238
[13/Nov/2025 22:59:55] "GET /api/users/me/ HTTP/1.1" 200 238
[13/Nov/2025 22:59:55] "POST /api/academics/student-enrollment-requests/ HTTP/1.1" 201 725
[13/Nov/2025 22:59:55,653] - Broken pipe from ('127.0.0.1', 65014)
[13/Nov/2025 22:59:55,653] - Broken pipe from ('127.0.0.1', 65012)
[13/Nov/2025 22:59:55,654] - Broken pipe from ('127.0.0.1', 64999)
[13/Nov/2025 22:59:55,654] - Broken pipe from ('127.0.0.1', 65004)
[13/Nov/2025 22:59:55] "GET /api/users/student-families/ HTTP/1.1" 200 2
Not Found: /api/users/families/undefined/
[13/Nov/2025 22:59:55] "GET /api/users/families/undefined/ HTTP/1.1" 404 23
Forbidden: /api/users/student-families/
[13/Nov/2025 22:59:55] "GET /api/users/student-families/ HTTP/1.1" 403 50
[13/Nov/2025 22:59:55] "POST /api/academics/teacher-course-requests/ HTTP/1.1" 201 434
[13/Nov/2025 22:59:55] "GET /api/academics/student-enrollment-requests/?teacher__id=191 HTTP/1.1" 200 2
Forbidden: /api/academics/teacher-course-requests/16/approve/
[13/Nov/2025 22:59:55] "POST /api/academics/teacher-course-requests/16/approve/ HTTP/1.1" 403 44
[13/Nov/2025 22:59:55] "POST /api/academics/student-enrollment-requests/ HTTP/1.1" 201 721
[13/Nov/2025 22:59:55,928] - Broken pipe from ('127.0.0.1', 65023)
[13/Nov/2025 22:59:55,928] - Broken pipe from ('127.0.0.1', 64995)
Bad Request: /api/academics/student-enrollment-requests/
[13/Nov/2025 22:59:55,966] - Broken pipe from ('127.0.0.1', 64991)
[13/Nov/2025 22:59:55,967] - Broken pipe from ('127.0.0.1', 65021)
[13/Nov/2025 22:59:55] "POST /api/academics/student-enrollment-requests/ HTTP/1.1" 400 70
[13/Nov/2025 22:59:56] "GET /api/academics/parent-linked-students/ HTTP/1.1" 200 2
Bad Request: /api/users/register/
[13/Nov/2025 22:59:56] "POST /api/users/register/ HTTP/1.1" 400 50
[13/Nov/2025 22:59:56] "POST /api/users/token/ HTTP/1.1" 200 601
Bad Request: /api/users/register/
[13/Nov/2025 22:59:56,125] - Broken pipe from ('127.0.0.1', 65019)
[13/Nov/2025 22:59:56,125] - Broken pipe from ('127.0.0.1', 65006)
Bad Request: /api/users/register/
[13/Nov/2025 22:59:56] "POST /api/users/register/ HTTP/1.1" 400 50
[13/Nov/2025 22:59:56] "GET /api/users/me/ HTTP/1.1" 200 238
[13/Nov/2025 22:59:56] "POST /api/users/register/ HTTP/1.1" 400 50
Bad Request: /api/users/register/
[13/Nov/2025 22:59:56] "POST /api/users/register/ HTTP/1.1" 400 50
Bad Request: /api/users/register/
[13/Nov/2025 22:59:56] "POST /api/users/register/ HTTP/1.1" 400 50
[13/Nov/2025 22:59:56] "GET /api/users/student-families/ HTTP/1.1" 200 2
Bad Request: /api/users/register/
[13/Nov/2025 22:59:56] "POST /api/users/register/ HTTP/1.1" 400 50
[13/Nov/2025 22:59:56] "POST /api/users/families/create_family/ HTTP/1.1" 201 512
[13/Nov/2025 22:59:56,416] - Broken pipe from ('127.0.0.1', 64997)
[13/Nov/2025 22:59:56,416] - Broken pipe from ('127.0.0.1', 65029)
[13/Nov/2025 22:59:56,584] - Broken pipe from ('127.0.0.1', 65017)
[13/Nov/2025 22:59:56,584] - Broken pipe from ('127.0.0.1', 65005)
[13/Nov/2025 22:59:56] "POST /api/users/family-memberships/add_member/ HTTP/1.1" 201 357
[13/Nov/2025 22:59:56] "POST /api/users/token/ HTTP/1.1" 200 581
[13/Nov/2025 22:59:56,958] - Broken pipe from ('127.0.0.1', 65031)
[13/Nov/2025 22:59:56,958] - Broken pipe from ('127.0.0.1', 64994)
[13/Nov/2025 22:59:56] "POST /api/users/token/ HTTP/1.1" 200 581
[13/Nov/2025 22:59:57] "POST /api/users/token/ HTTP/1.1" 200 581
[13/Nov/2025 22:59:57] "POST /api/users/token/ HTTP/1.1" 200 581
[13/Nov/2025 22:59:57] "POST /api/users/token/ HTTP/1.1" 200 578
[13/Nov/2025 22:59:57] "POST /api/users/token/ HTTP/1.1" 200 578
[13/Nov/2025 22:59:57] "GET /api/users/me/ HTTP/1.1" 200 223
[13/Nov/2025 22:59:57] "GET /api/users/me/ HTTP/1.1" 200 223
[13/Nov/2025 22:59:57] "POST /api/users/families/create_family/ HTTP/1.1" 201 484
[13/Nov/2025 22:59:57] "POST /api/users/families/create_family/ HTTP/1.1" 201 484
[13/Nov/2025 22:59:57] "GET /api/users/me/ HTTP/1.1" 200 220
[13/Nov/2025 22:59:57] "GET /api/users/me/ HTTP/1.1" 200 220
[13/Nov/2025 22:59:57] "POST /api/users/family-memberships/add_member/ HTTP/1.1" 201 337
[13/Nov/2025 22:59:57] "POST /api/users/family-memberships/add_member/ HTTP/1.1" 201 337
Internal Server Error: /api/academics/teacher-course-requests/
Traceback (most recent call last):
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 89, in _execute
    return self.cursor.execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\sqlite3\base.py", line 328, in execute
    return super().execute(query, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
sqlite3.IntegrityError: UNIQUE constraint failed: academics_teachercourserequest.teacher_id, academics_teachercourserequest.subject, academics_teachercourserequest.grade_level, academics_teachercourserequest.stream

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\core\handlers\exception.py", line 55, in inner
    response = get_response(request)
               ^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\core\handlers\base.py", line 197, in _get_response
    response = wrapped_callback(request, *callback_args, **callback_kwargs)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\views\decorators\csrf.py", line 56, in wrapper_view
    return view_func(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\viewsets.py", line 125, in view
    return self.dispatch(request, *args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 515, in dispatch
    response = self.handle_exception(exc)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 475, in handle_exception
    self.raise_uncaught_exception(exc)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 486, in raise_uncaught_exception
    raise exc
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 512, in dispatch
    response = handler(request, *args, **kwargs)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\mixins.py", line 19, in create
    self.perform_create(serializer)
  File "D:\django_project\yeneta-ai-school\yeneta_backend\academics\views.py", line 29, in perform_create
    serializer.save(teacher=self.request.user)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\serializers.py", line 210, in save
    self.instance = self.create(validated_data)
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\serializers.py", line 991, in create
    instance = ModelClass._default_manager.create(**validated_data)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\manager.py", line 87, in manager_method
    return getattr(self.get_queryset(), name)(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\query.py", line 660, in create
    obj.save(force_insert=True, using=self.db)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 814, in save
    self.save_base(
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 877, in save_base
    updated = self._save_table(
              ^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 1020, in _save_table
    results = self._do_insert(
              ^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 1061, in _do_insert
    return manager._insert(
           ^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\manager.py", line 87, in manager_method
    return getattr(self.get_queryset(), name)(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\query.py", line 1810, in _insert
    return query.get_compiler(using=using).execute_sql(returning_fields)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\sql\compiler.py", line 1822, in execute_sql
    cursor.execute(sql, params)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 102, in execute
    return super().execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 67, in execute
    return self._execute_with_wrappers(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 80, in _execute_with_wrappers
    return executor(sql, params, many, context)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 84, in _execute
    with self.db.wrap_database_errors:
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\utils.py", line 91, in __exit__
    raise dj_exc_value.with_traceback(traceback) from exc_value
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 89, in _execute
    return self.cursor.execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\sqlite3\base.py", line 328, in execute
    return super().execute(query, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
django.db.utils.IntegrityError: UNIQUE constraint failed: academics_teachercourserequest.teacher_id, academics_teachercourserequest.subject, academics_teachercourserequest.grade_level, academics_teachercourserequest.stream
[13/Nov/2025 22:59:58] "POST /api/academics/teacher-course-requests/ HTTP/1.1" 500 245014
Internal Server Error: /api/academics/teacher-course-requests/
Traceback (most recent call last):
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 89, in _execute
    return self.cursor.execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\sqlite3\base.py", line 328, in execute
    return super().execute(query, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
sqlite3.IntegrityError: UNIQUE constraint failed: academics_teachercourserequest.teacher_id, academics_teachercourserequest.subject, academics_teachercourserequest.grade_level, academics_teachercourserequest.stream

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\core\handlers\exception.py", line 55, in inner
    response = get_response(request)
               ^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\core\handlers\base.py", line 197, in _get_response
    response = wrapped_callback(request, *callback_args, **callback_kwargs)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\views\decorators\csrf.py", line 56, in wrapper_view
    return view_func(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\viewsets.py", line 125, in view
    return self.dispatch(request, *args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 515, in dispatch
    response = self.handle_exception(exc)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 475, in handle_exception
    self.raise_uncaught_exception(exc)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 486, in raise_uncaught_exception
    raise exc
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 512, in dispatch
    response = handler(request, *args, **kwargs)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\mixins.py", line 19, in create
    self.perform_create(serializer)
  File "D:\django_project\yeneta-ai-school\yeneta_backend\academics\views.py", line 29, in perform_create
    serializer.save(teacher=self.request.user)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\serializers.py", line 210, in save
    self.instance = self.create(validated_data)
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\serializers.py", line 991, in create
    instance = ModelClass._default_manager.create(**validated_data)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\manager.py", line 87, in manager_method
    return getattr(self.get_queryset(), name)(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\query.py", line 660, in create
    obj.save(force_insert=True, using=self.db)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 814, in save
    self.save_base(
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 877, in save_base
    updated = self._save_table(
              ^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 1020, in _save_table
    results = self._do_insert(
              ^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 1061, in _do_insert
    return manager._insert(
           ^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\manager.py", line 87, in manager_method
    return getattr(self.get_queryset(), name)(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\query.py", line 1810, in _insert
    return query.get_compiler(using=using).execute_sql(returning_fields)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\sql\compiler.py", line 1822, in execute_sql
    cursor.execute(sql, params)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 102, in execute
    return super().execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 67, in execute
    return self._execute_with_wrappers(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 80, in _execute_with_wrappers
    return executor(sql, params, many, context)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 84, in _execute
    with self.db.wrap_database_errors:
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\utils.py", line 91, in __exit__
    raise dj_exc_value.with_traceback(traceback) from exc_value
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 89, in _execute
    return self.cursor.execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\sqlite3\base.py", line 328, in execute
    return super().execute(query, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
django.db.utils.IntegrityError: UNIQUE constraint failed: academics_teachercourserequest.teacher_id, academics_teachercourserequest.subject, academics_teachercourserequest.grade_level, academics_teachercourserequest.stream
[13/Nov/2025 22:59:58] "POST /api/academics/teacher-course-requests/ HTTP/1.1" 500 245014   
Bad Request: /api/users/register/
[13/Nov/2025 22:59:58] "POST /api/users/register/ HTTP/1.1" 400 50
Bad Request: /api/users/register/
[13/Nov/2025 22:59:58] "POST /api/users/register/ HTTP/1.1" 400 50
Bad Request: /api/users/register/
[13/Nov/2025 22:59:58] "POST /api/users/register/ HTTP/1.1" 400 50
[13/Nov/2025 22:59:58,228] - Broken pipe from ('127.0.0.1', 65010)
[13/Nov/2025 22:59:58,228] - Broken pipe from ('127.0.0.1', 65027)
Bad Request: /api/users/register/
[13/Nov/2025 22:59:58] "POST /api/users/register/ HTTP/1.1" 400 50
[13/Nov/2025 22:59:58,235] - Broken pipe from ('127.0.0.1', 65008)
[13/Nov/2025 22:59:58,236] - Broken pipe from ('127.0.0.1', 65025)
Bad Request: /api/users/register/
[13/Nov/2025 22:59:58] "POST /api/users/register/ HTTP/1.1" 400 50
Bad Request: /api/users/register/
[13/Nov/2025 22:59:58] "POST /api/users/register/ HTTP/1.1" 400 50
[13/Nov/2025 22:59:58] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:58] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:58] "POST /api/users/token/ HTTP/1.1" 200 581
[13/Nov/2025 22:59:58] "POST /api/users/token/ HTTP/1.1" 200 581
[13/Nov/2025 22:59:58] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:58] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:58] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:58] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:58] "POST /api/users/token/ HTTP/1.1" 200 581
[13/Nov/2025 22:59:58] "POST /api/users/token/ HTTP/1.1" 200 581
[13/Nov/2025 22:59:58] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:58] "POST /api/users/token/ HTTP/1.1" 200 578
[13/Nov/2025 22:59:58] "POST /api/users/token/ HTTP/1.1" 200 578
[13/Nov/2025 22:59:58] "GET /api/users/me/ HTTP/1.1" 200 223
[13/Nov/2025 22:59:58] "GET /api/users/me/ HTTP/1.1" 200 223
[13/Nov/2025 22:59:58] "POST /api/users/families/create_family/ HTTP/1.1" 201 484
[13/Nov/2025 22:59:58] "POST /api/users/register/ HTTP/1.1" 201 143
[13/Nov/2025 22:59:59] "POST /api/users/families/create_family/ HTTP/1.1" 201 484
[13/Nov/2025 22:59:59] "GET /api/users/me/ HTTP/1.1" 200 220
[13/Nov/2025 22:59:59] "GET /api/users/me/ HTTP/1.1" 200 220
[13/Nov/2025 22:59:59] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:59] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:59] "POST /api/users/family-memberships/add_member/ HTTP/1.1" 201 337    
[13/Nov/2025 22:59:59] "POST /api/users/family-memberships/add_member/ HTTP/1.1" 201 337
[13/Nov/2025 22:59:59] "POST /api/users/token/ HTTP/1.1" 200 604
[13/Nov/2025 22:59:59] "GET /api/users/me/ HTTP/1.1" 200 241
[13/Nov/2025 22:59:59] "POST /api/users/register/ HTTP/1.1" 201 140
Internal Server Error: /api/academics/teacher-course-requests/
Traceback (most recent call last):
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 89, in _execute
    return self.cursor.execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\sqlite3\base.py", line 328, in execute
    return super().execute(query, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
sqlite3.IntegrityError: UNIQUE constraint failed: academics_teachercourserequest.teacher_id, academics_teachercourserequest.subject, academics_teachercourserequest.grade_level, academics_teachercourserequest.stream

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\core\handlers\exception.py", line 55, in inner
    response = get_response(request)
               ^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\core\handlers\base.py", line 197, in _get_response
    response = wrapped_callback(request, *callback_args, **callback_kwargs)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\views\decorators\csrf.py", line 56, in wrapper_view
    return view_func(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\viewsets.py", line 125, in view
    return self.dispatch(request, *args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 515, in dispatch
    response = self.handle_exception(exc)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 475, in handle_exception
    self.raise_uncaught_exception(exc)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 486, in raise_uncaught_exception
    raise exc
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 512, in dispatch
    response = handler(request, *args, **kwargs)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\mixins.py", line 19, in create
    self.perform_create(serializer)
  File "D:\django_project\yeneta-ai-school\yeneta_backend\academics\views.py", line 29, in perform_create
    serializer.save(teacher=self.request.user)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\serializers.py", line 210, in save
    self.instance = self.create(validated_data)
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\serializers.py", line 991, in create
    instance = ModelClass._default_manager.create(**validated_data)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\manager.py", line 87, in manager_method
    return getattr(self.get_queryset(), name)(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\query.py", line 660, in create
    obj.save(force_insert=True, using=self.db)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 814, in save
    self.save_base(
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 877, in save_base
    updated = self._save_table(
              ^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 1020, in _save_table
    results = self._do_insert(
              ^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 1061, in _do_insert
    return manager._insert(
           ^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\manager.py", line 87, in manager_method
    return getattr(self.get_queryset(), name)(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\query.py", line 1810, in _insert
    return query.get_compiler(using=using).execute_sql(returning_fields)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\sql\compiler.py", line 1822, in execute_sql
    cursor.execute(sql, params)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 102, in execute
    return super().execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 67, in execute
    return self._execute_with_wrappers(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 80, in _execute_with_wrappers
    return executor(sql, params, many, context)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 84, in _execute
    with self.db.wrap_database_errors:
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\utils.py", line 91, in __exit__
    raise dj_exc_value.with_traceback(traceback) from exc_value
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 89, in _execute
    return self.cursor.execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\sqlite3\base.py", line 328, in execute
    return super().execute(query, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
django.db.utils.IntegrityError: UNIQUE constraint failed: academics_teachercourserequest.teacher_id, academics_teachercourserequest.subject, academics_teachercourserequest.grade_level, academics_teachercourserequest.stream
[13/Nov/2025 22:59:59] "POST /api/academics/teacher-course-requests/ HTTP/1.1" 500 245014   
[13/Nov/2025 22:59:59,277] - Broken pipe from ('127.0.0.1', 65048)
[13/Nov/2025 22:59:59,277] - Broken pipe from ('127.0.0.1', 65042)
Internal Server Error: /api/academics/teacher-course-requests/
Traceback (most recent call last):
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 89, in _execute
    return self.cursor.execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\sqlite3\base.py", line 328, in execute
    return super().execute(query, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
sqlite3.IntegrityError: UNIQUE constraint failed: academics_teachercourserequest.teacher_id, academics_teachercourserequest.subject, academics_teachercourserequest.grade_level, academics_teachercourserequest.stream

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\core\handlers\exception.py", line 55, in inner
    response = get_response(request)
               ^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\core\handlers\base.py", line 197, in _get_response
    response = wrapped_callback(request, *callback_args, **callback_kwargs)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\views\decorators\csrf.py", line 56, in wrapper_view
    return view_func(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\viewsets.py", line 125, in view
    return self.dispatch(request, *args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 515, in dispatch
    response = self.handle_exception(exc)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 475, in handle_exception
    self.raise_uncaught_exception(exc)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 486, in raise_uncaught_exception
    raise exc
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\views.py", line 512, in dispatch
    response = handler(request, *args, **kwargs)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\mixins.py", line 19, in create
    self.perform_create(serializer)
  File "D:\django_project\yeneta-ai-school\yeneta_backend\academics\views.py", line 29, in perform_create
    serializer.save(teacher=self.request.user)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\serializers.py", line 210, in save
    self.instance = self.create(validated_data)
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\rest_framework\serializers.py", line 991, in create
    instance = ModelClass._default_manager.create(**validated_data)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\manager.py", line 87, in manager_method
    return getattr(self.get_queryset(), name)(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\query.py", line 660, in create
    obj.save(force_insert=True, using=self.db)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 814, in save
    self.save_base(
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 877, in save_base
    updated = self._save_table(
              ^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 1020, in _save_table
    results = self._do_insert(
              ^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\base.py", line 1061, in _do_insert
    return manager._insert(
           ^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\manager.py", line 87, in manager_method
    return getattr(self.get_queryset(), name)(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\query.py", line 1810, in _insert
    return query.get_compiler(using=using).execute_sql(returning_fields)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\models\sql\compiler.py", line 1822, in execute_sql
    cursor.execute(sql, params)
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 102, in execute
    return super().execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 67, in execute
    return self._execute_with_wrappers(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 80, in _execute_with_wrappers
    return executor(sql, params, many, context)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 84, in _execute
    with self.db.wrap_database_errors:
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\utils.py", line 91, in __exit__
    raise dj_exc_value.with_traceback(traceback) from exc_value
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\utils.py", line 89, in _execute
    return self.cursor.execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\django_project\yeneta-ai-school\venv\Lib\site-packages\django\db\backends\sqlite3\base.py", line 328, in execute
    return super().execute(query, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
django.db.utils.IntegrityError: UNIQUE constraint failed: academics_teachercourserequest.teacher_id, academics_teachercourserequest.subject, academics_teachercourserequest.grade_level, academics_teachercourserequest.stream
[13/Nov/2025 22:59:59] "POST /api/academics/teacher-course-requests/ HTTP/1.1" 500 245014   
[13/Nov/2025 22:59:59] "POST /api/users/register/ HTTP/1.1" 201 140
[13/Nov/2025 22:59:59,328] - Broken pipe from ('127.0.0.1', 65038)
[13/Nov/2025 22:59:59,328] - Broken pipe from ('127.0.0.1', 65046)
[13/Nov/2025 22:59:59] "POST /api/users/token/ HTTP/1.1" 200 601
[13/Nov/2025 22:59:59] "GET /api/users/me/ HTTP/1.1" 200 238
[13/Nov/2025 22:59:59] "GET /api/academics/student-enrollment-requests/?student__id=205 HTTP/1.1" 200 2
[13/Nov/2025 22:59:59,461] - Broken pipe from ('127.0.0.1', 65040)
[13/Nov/2025 22:59:59,461] - Broken pipe from ('127.0.0.1', 65050)
[13/Nov/2025 22:59:59] "POST /api/users/token/ HTTP/1.1" 200 601
[13/Nov/2025 22:59:59] "GET /api/users/me/ HTTP/1.1" 200 238
[13/Nov/2025 22:59:59] "GET /api/users/search-families/?q=parent1763063998115 HTTP/1.1" 200 2
[13/Nov/2025 22:59:59,521] - Broken pipe from ('127.0.0.1', 65052)
[13/Nov/2025 22:59:59,522] - Broken pipe from ('127.0.0.1', 65044)
