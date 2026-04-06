@echo off
cd /d C:\Projects\fieldsync-app
set PATH=C:\Program Files\Git\cmd;%PATH%
git add src/components/StatusDropdown.js src/components/layout/AppLayout.js src/constants/statusMaps.js src/context/DataContext.js src/firebase/database.js src/firebase/index.js src/hooks/useUsers.js src/index.js src/pages/manager/SettingsPage.js src/services/pdfGenerator.js
git commit -m "chore: stage remaining modified source files"
git push origin refactor/v2-architecture
echo PUSH COMPLETE