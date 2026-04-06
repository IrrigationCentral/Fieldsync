@echo off
cd /d C:\Projects\fieldsync-app
npx vercel --prod --yes 2>&1
echo VERCEL DONE