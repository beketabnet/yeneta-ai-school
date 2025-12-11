@echo off
REM Kill any existing npm processes
echo Killing existing npm processes...
taskkill /F /IM node.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak

REM Clear npm cache
echo Clearing npm cache...
call npm cache clean --force

REM Clear node_modules cache
echo Clearing node_modules...
rmdir /s /q node_modules 2>nul

REM Reinstall dependencies
echo Installing dependencies...
call npm install

REM Start the dev server
echo Starting dev server...
call npm start
