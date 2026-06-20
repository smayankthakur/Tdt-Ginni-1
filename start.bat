@echo off
REM Ginni Ki Baatein — local launcher
REM Double-click this file to serve the preview on http://localhost:5500
setlocal
cd /d "%~dp0preview"

set PORT=5500
echo Starting Ginni Ki Baatein on http://localhost:%PORT% ...
start "" http://localhost:%PORT%

where python >nul 2>&1 && ( python -m http.server %PORT% & goto :end )
where py >nul 2>&1 && ( py -m http.server %PORT% & goto :end )
where npx >nul 2>&1 && ( npx --yes serve -l %PORT% & goto :end )

echo.
echo Could not find Python or Node.js to start a local server.
echo Easiest fix: just double-click  preview\index.html  to open it directly,
echo or install Python (python.org) / Node.js (nodejs.org) and re-run this file.
pause
:end
endlocal
