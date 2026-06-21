@echo off
REM ===========================================================================
REM Deploys the 5 edge functions the app calls, under their EXACT names.
REM Writes a full log to deploy-log.txt (next to this file) so issues can be
REM diagnosed. You only need Node.js (v18+). Already logged in = no prompts.
REM ===========================================================================
setlocal
cd /d "%~dp0app"
set "LOG=%~dp0deploy-log.txt"
call :run > "%LOG%" 2>&1
echo.
type "%LOG%"
echo.
echo ============================================================
echo  Full log saved to: %LOG%
echo  If it didn't fully work, just tell me and I'll read the log.
echo ============================================================
pause
endlocal
exit /b

:run
set REF=agwpfisykktphrrmnnzu
echo NODE VERSION:
call node -v
echo.
echo [1/3] Checking Supabase login...
call npx -y supabase projects list
if errorlevel 1 (
  echo Not logged in. Run "npx supabase login" once, then re-run this script.
  exit /b 1
)
echo.
echo [2/3] Ensuring project config exists...
if not exist "supabase\config.toml" (
  echo Creating supabase\config.toml via 'supabase init'...
  (echo n & echo n & echo n) | call npx -y supabase init
)
if not exist "supabase\config.toml" (
  echo *** init did not create supabase\config.toml ***
  exit /b 1
)
echo Config OK: %CD%\supabase\config.toml
echo.
echo [3/3] Deploying functions to project %REF% ...
call npx -y supabase functions deploy tarot-chat                   --project-ref %REF%
echo  tarot-chat exit: %errorlevel%
call npx -y supabase functions deploy reading-gate                 --project-ref %REF%
echo  reading-gate exit: %errorlevel%
call npx -y supabase functions deploy create-razorpay-subscription --project-ref %REF%
echo  create-razorpay-subscription exit: %errorlevel%
call npx -y supabase functions deploy verify-razorpay-payment      --project-ref %REF%
echo  verify-razorpay-payment exit: %errorlevel%
call npx -y supabase functions deploy razorpay-webhook --no-verify-jwt --project-ref %REF%
echo  razorpay-webhook exit: %errorlevel%
echo.
echo DONE. Listing deployed functions:
call npx -y supabase functions list --project-ref %REF%
exit /b 0
