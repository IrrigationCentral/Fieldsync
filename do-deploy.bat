@echo off
cd /d C:\Projects\fieldsync-app
set PATH=C:\Program Files\Git\cmd;%PATH%
git push origin refactor/v2-architecture
echo PUSH DONE
npx vercel --prod --yes 2>&1
echo DEPLOY DONE