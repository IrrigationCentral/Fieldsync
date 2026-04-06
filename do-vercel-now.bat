@echo off
cd /d C:\Projects\fieldsync-app
npx vercel --prod --yes > vercel-output4.log 2>&1
echo EXITCODE=%ERRORLEVEL% >> vercel-output4.log