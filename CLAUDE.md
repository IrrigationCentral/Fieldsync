# FieldSync — Project Reference

**Path**: C:\Projects\fieldsync-app
**Status**: Production + V2 Refactor in Progress
**Firebase**: fieldsync-2768a (DB name: "hardluck")
**Deploy**: vercel --prod
**Vercel URL**: fieldsync-app.vercel.app

---

## Quick Commands

| Action | Command |
|--------|---------|
| Dev server | `npm start` |
| Build | `npm run build` |
| Deploy | `vercel --prod` |
| V2 branch | `git checkout refactor/v2-architecture` |

---

## Tech Stack

- React (Create React App)
- TailwindCSS
- Firebase (Auth, Firestore, Functions, Messaging)
- Deployed via Vercel

---

## Architecture

### Production (App.js monolith — ~3,850 lines)
Single file handles all routing, state, modals, role-based views.

### V2 (AppV2.js — branch: refactor/v2-architecture)
Decomposed into ~30 files: contexts, hooks, pages, components.
Feature flag: `REACT_APP_USE_V2=true/false` in `src/index.js`

**V2 Status**: Phases 1-5 complete, Phase 6 (gap fixes) in progress, Phase 7 (cutover) not started.
**Full v2 docs**: `C:\Projects\.claude\projects\fieldsync-v2-refactor.md`

---

## Theme Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#2D5016` | Forest green |
| Secondary | `#8FBC3B` | Light green accents |
| Accent | `#F4B942` | Wheat gold highlights |
| Danger | `#C73E1D` | Errors/warnings |

---

## User Roles

| Role | Default Tab | Access |
|------|-------------|--------|
| Farmer | Equipment | Own equipment, service history |
| Tech | Dashboard | Assigned jobs, time tracking |
| Office | Jobs | All jobs, scheduling, call-ins |
| Manager | Dashboard | Everything + analytics + settings |

---

## Critical Patterns

1. **needs-followup status**: MUST be in ALL active job status filter arrays
   ```js
   ['assigned', 'in-progress', 'needs-followup']
   ```

2. **assignedTo dual format**: Can be array OR string
   ```js
   const assignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
   ```

3. **Firebase init**: Always use try/catch or getApps() check
   ```js
   const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
   ```

4. **Equipment = "pivots"**: Legacy naming in codebase. Collection is "pivots" in Firestore.

5. **7 job statuses**: pending, assigned, in-progress, completed, ready-to-bill, billed, needs-followup

---

## File Structure

```
src/
├── App.js              # Production monolith (~3,850 lines)
├── AppV2.js            # V2 entry point (~430 lines)
├── index.js            # Feature flag switches App vs AppV2
├── components/
│   └── modals/         # 10-11 modal components
├── context/            # V2 contexts (Auth, Data, Theme, Notification)
├── hooks/              # V2 custom hooks
├── pages/              # V2 page components (16 total)
├── constants/          # V2 constants (theme, roles, statusMaps)
├── firebase/
│   └── config.js       # Firebase configuration
├── services/           # SMS, notifications, exports
└── utils/              # Formatters
```

---

## Credentials

| Credential | Location |
|------------|----------|
| Firebase Config | `src/firebase/config.js` |
| VAPID Key | Starts with `BJ4vc3C4hQ...` |
| SHA-1 | `7B:80:1D:CF:D0:3D:57:72:59:86:DC:2E:7F:C0:73:53:D1:06:E5:9C` |

---

## Recovery

- Golden build: `C:\Projects\.claude\GOLDEN_BUILD_DO_NOT_DELETE.md`
- Vercel rollback: Use Vercel dashboard
- V2 rollback: Set `REACT_APP_USE_V2=false` in Vercel env vars

---

## Knowledge Base

- Main docs: `C:\Projects\.claude\projects\fieldsync.md`
- V2 refactor: `C:\Projects\.claude\projects\fieldsync-v2-refactor.md`
- Changelog: `C:\Projects\.claude\changelogs\fieldsync.md`
- Decisions: `C:\Projects\.claude\DECISIONS.md`
