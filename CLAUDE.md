# FieldSync React Web App

## Quick Reference
| Item | Value |
|------|-------|
| Deploy | `vercel --prod` |
| Firebase | fieldsync-2768a |
| Live URL | https://fieldsync-app.vercel.app |

## What This Is
Field service management for Irrigation Central. React web app for office staff and managers. 31 service trucks, Sikeston MO.

## Key Paths
```
src/
├── App.js              # Main app (~4,900 lines)
├── components/modals/  # Extracted modal components
├── components/ui/      # Reusable UI
├── firebase/           # Firebase config
└── services/excelExport.js
```

## Patterns
- Role-based: Farmer → Tech → Office → Manager
- Theme: primary #2D5016, secondary #8FBC3B, accent #F4B942
- Extract modals when >200 lines
- Survey-style wizards for tech features

## Related
- Expo mobile: `C:\Projects\fieldsync-expo`
- Knowledge base: `C:\Projects\.claude\INDEX.md`
