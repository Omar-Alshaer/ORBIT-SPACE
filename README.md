# ORBIT

ORBIT is split into two independent workspaces:

- `frontend/`: Next.js App Router client application.
- `backend/`: future Node.js + Express API service.

Environment files stay inside the workspace that uses them:

- Frontend: `frontend/.env.local`
- Backend: `backend/.env`

Never commit real environment files. Use `frontend/.env.example` as the safe template for Firebase public web config.

## Commands

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
npm run dev
```

Backend health check:

```bash
curl http://localhost:4000/api/health
```

Protected backend auth check:

```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <firebase-id-token>"
```

Firebase Admin credentials live in `backend/.env`. Use a Firebase service account and store the private key with escaped newlines:

```bash
FIREBASE_PROJECT_ID=orbit-498ee
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@orbit-498ee.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
