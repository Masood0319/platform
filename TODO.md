# Authentication Architecture Rewrite — TODO

> Production-grade rebuild of the authentication system (backend + frontend).
> One source of truth: JWT in localStorage. Passport = OAuth identity verification ONLY.

## Backend
- [x] 1. `backend/src/lib/auth/jwt.js` — add optional `provider` claim + minor hardening
- [x] 2. `backend/src/lib/auth/authUtils.js` — rewrite as Express-compatible token helpers (remove Next.js shim imports)
- [x] 3. `backend/src/lib/auth/getUser.js` — real `getUserFromRequest` helper
- [x] 4. `backend/src/utils/generateToken.js` — delegate to `signAuthToken`
- [x] 5. `backend/src/config/passport.js` — OAuth-only strategies, remove serialize/deserialize, Google `prompt: select_account`, shared find-or-create helper
- [x] 6. `backend/src/middleware/auth.middleware.js` — clean `protect`/`restrictTo`/`isAdmin`/`isVerified`/`isProfileComplete`, add `optionalAuth`, remove dead helpers
- [x] 7. `backend/src/controllers/auth.controller.js` — consistent response shapes, POST logout, forgot/reset password, rate-limited auth
- [x] 8. `backend/src/routes/auth.routes.js` — shared OAuth callback factory, POST /logout, add forgot/reset-password routes
- [x] 9. `backend/src/app.js` — remove express-session + passport.session(); stricter auth rate limiter
- [x] 10. `backend/src/sockets/socketHandler.js` — use shared `verifyAuthToken`

## Frontend — Core libs & providers
- [ ] 11. `frontend/lib/tokenStorage.js` — NEW single source of truth for JWT
- [ ] 12. `frontend/lib/apiClient.js` — never navigate; typed errors; single token source; no console spam
- [ ] 13. `frontend/lib/auth.js` — centralized logout (API + storage + state)
- [ ] 14. `frontend/components/providers/UserProvider.jsx` — remove polling; status lifecycle; expose `setUser`/`handleOAuthToken`
- [ ] 15. `frontend/components/auth/AuthGuard.jsx` — NEW protected-route guard (waits for init)
- [ ] 16. `frontend/components/auth/GuestGuard.jsx` — NEW guest-route guard
- [ ] 17. `frontend/components/providers/SocketProvider.jsx` — auth-driven connect/disconnect (no localStorage)
- [ ] 18. `frontend/components/providers/UnreadProvider.jsx` — only fetch when authenticated

## Frontend — Pages & components
- [ ] 19. `frontend/app/oauth/callback/page.jsx` — store token → fetch /auth/me → redirect to dashboard
- [ ] 20. `frontend/app/login/page.jsx` — email/password + OAuth only; GuestGuard
- [ ] 21. `frontend/app/page.jsx` — landing uses context; never redirects; no flash
- [ ] 22. `frontend/app/layout.jsx` — reorder providers (UserProvider outer)
- [ ] 23. `frontend/components/layout/app-shell.jsx` — guard via context; no localStorage
- [ ] 24. `frontend/components/auth/logout-button.jsx` — use context logout
- [ ] 25. `frontend/app/role/page.jsx` — AuthGuard; context update; no storage writes
- [ ] 26. `frontend/app/signup/page.jsx` — centralized storage for pending email
- [ ] 27. `frontend/app/setup/page.jsx` — AuthGuard; cleanup
- [ ] 28. `frontend/app/verify/page.jsx` — GuestGuard; use tokenStorage + context
- [ ] 29. `frontend/app/complete-profile/page.jsx` — AuthGuard; fix `setUser` usage
- [ ] 30. `frontend/app/resetPassword/page.jsx` — match new forgot/reset endpoints
- [ ] 31. `frontend/app/dashboard/investor/page.jsx` — use context user
- [ ] 32. `frontend/app/dashboard/founder/page.jsx` — use context user

## Follow-up
- [ ] Verify backend starts (no import errors) and frontend builds
- [ ] Test: landing (no flash), login, logout, OAuth account switching, protected routes, socket reconnect

