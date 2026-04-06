@echo off
cd /d C:\Projects\fieldsync-app
set PATH=C:\Program Files\Git\cmd;%PATH%
git log --oneline -3
echo ---
git status --short
echo ---
git branch