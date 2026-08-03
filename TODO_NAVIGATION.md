# Navigation Update - Fundraising Workflow

## Information gathered
- `frontend/components/layout/app-shell.jsx` contains the complete primary navigation configuration (`PRIMARY_NAV`) used for:
  - Desktop underline nav tabs
  - Mobile drawer navigation
- The current `PRIMARY_NAV` includes: Discover, Startups, Investors, **Messages**, Matches.
- There is also a mobile-only bottom section for Notifications/Dashboard/Profile/Settings (no Messages).
- `frontend/app/messages/page.jsx` is the existing Messages page; messaging backend/components must remain.

## Edit plan (navigation-only)
1. Update `PRIMARY_NAV` in `frontend/components/layout/app-shell.jsx`:
   - Add `Home` (route `/home`) icon: use a Lucide icon appropriate for “home”.
   - Remove the `Messages` item entirely.
   - Add `Deal Rooms` (route `/dealrooms`) with a professional icon.
   - Ensure recommended order: Home, Discover, My Startups (Founders only), Matches, Deal Rooms, Notifications, Profile.
2. Implement role-based visibility in `PRIMARY_NAV` / render layer:
   - “My Startups” should be shown only for founders.
   - “Home” should be visible to all authenticated users.
   - “Deal Rooms” should be visible to both founders and investors.
3. Keep active-link highlighting using existing `isNavItemActive()`.
4. Ensure responsive behavior stays unchanged:
   - Desktop uses `PRIMARY_NAV.map(TabLink...)`
   - Mobile uses `PRIMARY_NAV.map(MobileNavRow...)`
5. Remove any remaining label/reference in navigation configuration (no route changes beyond navigation).

## Dependent files to edit
- `frontend/components/layout/app-shell.jsx`
- (Potentially) other layout/navigation components if they have additional nav items. (Not yet confirmed.)

## Followup steps
- Run frontend lint/typecheck/build if available.
- Manually verify:
  - Desktop nav tabs show correct items and order.
  - Mobile drawer shows correct items.
  - Active highlight works on `/home` and `/dealrooms`.
  - Role-based visibility for “My Startups”.

