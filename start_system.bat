@echo off
echo ===================================================
echo       Starting Automated Test Generation System
echo ===================================================

echo [1/2] Starting Backend Server (Node.js + Express)...
start "Backend Server" cmd /k "npm run dev"

echo [2/2] Starting Frontend Client (Vue 3 + Vite)...
cd frontend
start "Frontend Client" cmd /k "npm run dev"

echo ===================================================
echo System is running!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5175
echo.
echo Please do not close the popped-up command windows.
echo ===================================================
pause
