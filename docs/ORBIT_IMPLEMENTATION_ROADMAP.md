# ORBIT Implementation Roadmap

Version: 1.0  
Date: May 7, 2026

## Product Principle
ORBIT should always answer one user question clearly: "What should I do next today to keep progressing?"

## Current Foundation

Implemented foundation includes:
- Next.js frontend.
- Express backend.
- Firebase Auth.
- Firebase Admin verification.
- Firestore-based user data.
- Cloudinary proof upload.
- Dashboard.
- Focus sessions.
- Health tracking.
- Daily missions.
- Profile edit.
- Activity timeline.
- Community with Orbits and Galaxies.
- Challenge join and claim flow.

## Immediate Priorities

### 1. Loading and Empty State UX
Goal: Make the app feel fast and friendly even while data loads.

Tasks:
- Add skeletons to dashboard, community, profile, focus history.
- Replace generic error messages with user-friendly retry states.
- Add lightweight optimistic UI where safe.
- Avoid technical labels in user-facing UI.

### 2. Onboarding
Goal: Personalize the first experience.

Tasks:
- Add `/onboarding`.
- Ask goal type: study, work, health, balanced.
- Ask preferred focus style.
- Ask whether user wants to create/join Orbit.
- Save preferences.
- Use preferences on dashboard.

### 3. Reward Ledger
Goal: Make HP auditable and safe.

Tasks:
- Create server-side reward ledger.
- Ensure every HP award has unique source.
- Prevent duplicate claims.
- Show reward history from ledger.

### 4. Notification Center
Goal: Improve retention without annoying users.

Tasks:
- Add notification model.
- Add in-app notification center.
- Add reminder preferences.
- Add daily mission reminder.
- Add Orbit nudge notification.

### 5. Admin MVP
Goal: Prepare for real users and community safety.

Tasks:
- Add admin role.
- Add admin layout.
- Manage Galaxy challenges.
- View reports.
- Suspend abusive users.
- Add audit logs.

## Phase 1: MVP Stabilization

Timeline: 4-6 weeks

Deliverables:
- Stable auth and profile.
- Clean dashboard.
- Focus, health, missions reliable.
- Proof upload robust.
- Community challenge flow stable.
- Loading/error states polished.
- Basic analytics events.
- Basic admin challenge management.

Success Metrics:
- Day 1 activation above 50%.
- At least one completed action per new user.
- Proof upload success above 95%.
- API error rate below 1%.

## Phase 2: Engagement and Monetization

Timeline: 8-12 weeks

Deliverables:
- Premium plan.
- Subscription billing.
- Advanced analytics.
- AI daily recommendation beta.
- Custom Orbit challenges.
- Notification center.
- Weekly recap.
- Referral rewards.

Success Metrics:
- Week 1 retention above 20%.
- Challenge participation above 30%.
- Free-to-premium conversion target 3-5%.

## Phase 3: Scale and Enterprise

Timeline: 4-9 months

Deliverables:
- Organization accounts.
- Enterprise admin dashboard.
- SSO.
- Aggregate reporting.
- Data export/delete.
- Moderation queue.
- Wearable integrations.
- PostgreSQL migration plan.
- Redis caching.
- Queue workers.

Success Metrics:
- Support thousands of concurrent users.
- Dashboard p95 latency under 500ms for cached summaries.
- Admin moderation SLA under 24 hours.

## Engineering Priorities

### Frontend
- Extract reusable UI primitives.
- Add server state library.
- Improve accessibility.
- Add Playwright test coverage.
- Reduce client bundle size.

### Backend
- Add route-level schemas.
- Add rate limiting.
- Add reward ledger.
- Add audit logs.
- Add structured logging.
- Introduce repository layer before database migration.

### Data
- Define canonical date/timezone strategy.
- Track reward events.
- Store dashboard aggregates.
- Add analytics event schema.
- Prepare PostgreSQL schema.

### Security
- Admin MFA.
- File validation and scanning.
- Strict CORS.
- Rate limits.
- Audit logs.
- Privacy policy and data deletion workflow.

### DevOps
- Add CI checks.
- Add preview deployments.
- Add production env separation.
- Add monitoring and error tracking.
- Add backup and restore process.

## Suggested Sprint Plan

### Sprint 1
- Loading states.
- Error states.
- Dashboard simplification.
- Profile activity polish.
- API response consistency.

### Sprint 2
- Onboarding.
- Preference model.
- Recommended dashboard action.
- Focus recommendation rules.

### Sprint 3
- Reward ledger.
- Challenge claim hardening.
- Streak logic.
- Reward history from ledger.

### Sprint 4
- Notification center.
- Orbit nudges.
- Weekly recap.
- User preferences.

### Sprint 5
- Admin MVP.
- Reports.
- Challenge management.
- Audit logs.

### Sprint 6
- Billing foundation.
- Premium feature gates.
- Analytics dashboard.
- Beta launch readiness.

## Production Readiness Checklist

### Product
- Clear onboarding.
- Clear daily next action.
- Empty states complete.
- No technical labels visible to users.
- Mobile UX tested.

### Engineering
- Typecheck passes.
- Lint passes.
- Unit tests for reward logic.
- E2E tests for core flows.
- API validation complete.
- Rate limits active.

### Security
- Secrets are not committed.
- Admin routes protected.
- File uploads validated.
- Privacy policy ready.
- Audit logs for sensitive actions.

### Operations
- CI/CD ready.
- Staging environment ready.
- Monitoring active.
- Error tracking active.
- Backups configured.
- Incident response process written.

## Final Recommendation
The next development step should be "MVP polish and trust layer": loading states, onboarding, reward ledger, admin basics, and notifications. These features make ORBIT feel real, reliable, and ready for external users before adding large AI or enterprise functionality.
