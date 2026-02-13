# FieldSync React Web Application

## Quick Reference
- **Deploy:** `vercel --prod` (REQUIRES ORCHESTRATOR APPROVAL)
- **Dev:** `npm start`
- **Build:** `npm run build`
- **Firebase:** `fieldsync-2768a`

## Architecture
- Main app: `src/App.js` (~3,855 lines)
- Modals: `src/components/modals/` (13 extracted modals)
- Context: `src/context/` (AuthContext, etc.)
- Firebase: `src/firebase/`
- Services: `src/services/`

## Theme Colors
- Primary: #2D5016 (forest green)
- Secondary: #8FBC3B (light green)
- Accent: #F4B942 (wheat gold)
- Danger: #C73E1D

## Roles
Farmer → Tech → Office → Manager (increasing permissions)

## CRITICAL
- **GOLDEN BUILD:** `fieldsync-qwni76e71-spheresdeep0322s-projects.vercel.app`
- **Recovery:** `vercel promote fieldsync-qwni76e71-spheresdeep0322s-projects.vercel.app`
- **Knowledge Base:** `C:\Projects\.claude\`
- **Worker Rules:** `C:\Projects\.claude\orchestrator\WORKER-RULES.md`

## Before Deploying
1. `npm run build` succeeds
2. `git status` is clean
3. Test critical flows locally
4. Get Lee's explicit approval
5. Then and only then: `vercel --prod`

## If You're a Subagent
You are under orchestrator control. Read the worker rules. Do not deploy.
