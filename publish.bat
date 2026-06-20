@echo off
REM Publish this folder to https://github.com/smayankthakur/Tdt-Ginni
REM Double-click to run. Uses your existing GitHub login (Git Credential Manager).
setlocal
cd /d "%~dp0"

echo ============================================
echo  Publishing Ginni Ki Baatein to GitHub
echo  Repo: https://github.com/smayankthakur/Tdt-Ginni
echo ============================================
echo.

REM Remove any previous/corrupt git metadata so we start clean.
if exist ".git" (
  echo Clearing previous .git ...
  rmdir /s /q ".git"
)

git --version >nul 2>&1 || (echo Git is not installed. Install from https://git-scm.com/download/win & pause & exit /b 1)

git init
git add -A
git commit -m "Ginni Ki Baatein - tarot chat replica (app, edge functions, preview, scripts)"
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin https://github.com/smayankthakur/Tdt-Ginni-1.git

echo.
echo Pushing to GitHub (you may be asked to sign in)...
git push -u origin main
if errorlevel 1 (
  echo.
  echo Push was rejected. If the repo already has commits you want to overwrite, run:
  echo     git push -u origin main --force
)

echo.
echo Done.
pause
endlocal
