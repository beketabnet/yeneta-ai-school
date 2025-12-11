#!/usr/bin/env python
import subprocess
import sys
import time
import os

os.chdir('d:/django_project/yeneta-ai-school')

print('Starting Django backend server on port 8000...')
backend_proc = subprocess.Popen(
    [sys.executable, 'yeneta_backend/manage.py', 'runserver', '0.0.0.0:8000'],
    cwd='.',
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)

time.sleep(5)

print('Starting Vite frontend dev server...')
frontend_proc = subprocess.Popen(
    ['npm', 'run', 'dev'],
    cwd='.',
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)

time.sleep(3)

print('Servers started!')
print('Backend: http://localhost:8000')
print('Frontend: http://localhost:5173')
print('Press Ctrl+C to stop')

try:
    backend_proc.wait()
    frontend_proc.wait()
except KeyboardInterrupt:
    print('\nShutting down servers...')
    backend_proc.terminate()
    frontend_proc.terminate()
    backend_proc.wait()
    frontend_proc.wait()
    print('Done')
