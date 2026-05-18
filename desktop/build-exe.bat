@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo  Avicenna Pharmacy - Offline Windows .exe Builder
echo ============================================================
echo.

REM ---------- 1. Build the React frontend with relative paths ----------
echo [1/4] Building React frontend (offline mode)...
cd ..\frontend
if not exist node_modules (
    echo Installing frontend dependencies (this is a one-time step)...
    call yarn install
    if errorlevel 1 goto :error
)

set "PUBLIC_URL=./"
call yarn build
if errorlevel 1 goto :error
set "PUBLIC_URL="

cd ..\desktop

REM ---------- 2. Copy build into desktop/app ----------
echo.
echo [2/4] Copying frontend build into desktop\app...
if exist app rmdir /s /q app
xcopy /e /i /y "..\frontend\build" "app" >nul
if errorlevel 1 goto :error

REM ---------- 3. Install Electron tooling ----------
echo.
echo [3/4] Installing Electron dependencies...
if not exist node_modules (
    call npm install
    if errorlevel 1 goto :error
)

REM ---------- 4. Build the installer ----------
echo.
echo [4/4] Building Windows installer (.exe)...
call npm run build:installer
if errorlevel 1 goto :error

echo.
echo ============================================================
echo  SUCCESS! Installer is in:  desktop\dist\
echo.
dir /b dist\*.exe 2>nul
echo ============================================================
echo.
pause
exit /b 0

:error
echo.
echo ============================================================
echo  BUILD FAILED. Scroll up to see the error.
echo ============================================================
pause
exit /b 1
