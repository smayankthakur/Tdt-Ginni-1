@echo off
REM ===========================================================================
REM Checks edge-function SECRETS and runs a quick live SMOKE TEST.
REM Part 1 (authoritative): lists the secrets actually set on the project.
REM Part 2/3 (live probes): hit the deployed functions and read the response,
REM         which also reveals whether the Razorpay secrets are configured.
REM Writes everything to check-log.txt next to this file.
REM
REM Optional: to also probe the JWT-protected function, paste your PUBLIC
REM anon key between the quotes on the next line (safe to expose). Leave blank to skip.
set "ANON="
REM ===========================================================================
setlocal
set "REF=agwpfisykktphrrmnnzu"
set "BASE=https://%REF%.supabase.co/functions/v1"
set "LOG=%~dp0check-log.txt"
call :run > "%LOG%" 2>&1
echo.
type "%LOG%"
echo.
echo ============================================================
echo  Full log saved to: %LOG%
echo  Paste it back to me and I'll interpret anything unclear.
echo ============================================================
pause
endlocal
exit /b

:run
echo ===========================================================================
echo [1/3] SECRETS set on project %REF%  (authoritative)
echo ---------------------------------------------------------------------------
echo Expect to see: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_ID,
echo   RAZORPAY_TOTAL_COUNT, RAZORPAY_WEBHOOK_SECRET, and (for tarot-chat)
echo   LOVABLE_API_KEY or OPENAI_API_KEY. Optional: DAILY_LIMIT, ALLOWED_ORIGIN.
echo   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-provided (may not list).
echo ---------------------------------------------------------------------------
call npx -y supabase secrets list --project-ref %REF%
echo.

echo ===========================================================================
echo [2/3] LIVE PROBE: razorpay-webhook   (no auth / no key needed)
echo ---------------------------------------------------------------------------
echo   HTTP 401 "invalid signature" = RAZORPAY_WEBHOOK_SECRET IS set  (good)
echo   HTTP 500 "not configured"    = RAZORPAY_WEBHOOK_SECRET is MISSING
echo ---------------------------------------------------------------------------
curl -s -m 20 -w "\nHTTP %%{http_code}\n" -X POST "%BASE%/razorpay-webhook" -H "Content-Type: application/json" -d "{}"
echo.

echo ===========================================================================
echo [3/3] LIVE PROBE: create-razorpay-subscription
echo ---------------------------------------------------------------------------
echo   HTTP 401 auth_required  = Razorpay key/secret/plan ARE set  (good)
echo   HTTP 500 "not configured" = RAZORPAY_KEY_ID/SECRET/PLAN_ID MISSING
echo   HTTP 401 "Missing authorization header" = needs anon key (set ANON above)
echo ---------------------------------------------------------------------------
if "%ANON%"=="" (
  echo Probing without anon key ^(gateway may block before the function runs^)...
  curl -s -m 20 -w "\nHTTP %%{http_code}\n" -X POST "%BASE%/create-razorpay-subscription" -H "Content-Type: application/json" -d "{}"
) else (
  curl -s -m 20 -w "\nHTTP %%{http_code}\n" -X POST "%BASE%/create-razorpay-subscription" -H "Authorization: Bearer %ANON%" -H "apikey: %ANON%" -H "Content-Type: application/json" -d "{}"
)
echo.
echo DONE.
exit /b 0
