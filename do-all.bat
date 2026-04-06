@echo off
cd /d C:\Projects\fieldsync-app
set PATH=C:\Program Files\Git\cmd;%PATH%
echo === BUILDING ===
call npx react-scripts build 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo BUILD FAILED
  exit /b 1
)
echo === BUILD PASSED ===
echo === COMMITTING ===
git add -A
git commit -m "fix: remove total hours card, fix iOS scrolling and button taps"
echo === PUSHING ===
git push origin refactor/v2-architecture
echo === PUSH DONE ===