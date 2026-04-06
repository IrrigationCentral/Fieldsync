@echo off
cd /d C:\Projects\fieldsync-app
set PATH=C:\Program Files\Git\cmd;%PATH%
git status --short
git commit -m "feat: major update - exports sorting roles polish"
echo DONE