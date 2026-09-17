# MundulCare - Hospital Appointment Management

A hospital appointment management system with a Next.js frontend and a Spring Boot backend.

## Project structure

- `frontend/` - Next.js app (TypeScript)
- `backend/` - Spring Boot app (Java 17, Maven, PostgreSQL)

## Prerequisites

- Node.js 18+
- Java 17
- PostgreSQL running locally, with a database named `hospital` (or update the URL below)

## Backend setup

```bash
cd backend
cp src/main/resources/application.properties.example src/main/resources/application.properties
```

Edit `src/main/resources/application.properties` and fill in:

- `spring.datasource.username` / `spring.datasource.password` - your local PostgreSQL credentials
- `spring.mail.username` / `spring.mail.password` - a Gmail address and an [App Password](https://myaccount.google.com/apppasswords) (used to send OTP/reset emails)
- `jwt.secret` - any long random string (e.g. `openssl rand -hex 32`)
- `gemini.api.key` - a [Google Gemini API key](https://aistudio.google.com/apikey)
- `google.client.id` - an OAuth Client ID from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (Authorized JavaScript origin: `http://localhost:3000`); leave blank to hide the Google Sign-In button

Then run it:

```bash
./mvnw spring-boot:run
```

The API starts on `http://localhost:8080`.

## Frontend setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Fill in `NEXT_PUBLIC_GOOGLE_CLIENT_ID` with the same Client ID used on the backend (leave blank to hide the Google button). Leave `NEXT_PUBLIC_API_URL` as `/api` - the Next.js dev server proxies it to the backend (see "Reverse proxy" below); only change it if the backend isn't running at `http://localhost:8080`, in which case set `BACKEND_URL` instead.

The app starts on `http://localhost:3000`. Open only this URL in the browser - the frontend and backend are both reachable through it.

## Reverse proxy (local dev)

The browser only ever talks to `http://localhost:3000`. `frontend/next.config.ts` rewrites `/api/*` and `/uploads/*` requests to the Spring Boot backend (`http://localhost:8080` by default, override with a `BACKEND_URL` env var). This keeps everything on one origin during development, so the backend's CORS config never comes into play. The same rewrite works in production too - it's not a dev-only trick, just set `BACKEND_URL` to the deployed backend's URL.

## Deploying (Render)

### 1. Database

Create a Render **PostgreSQL** instance. Render gives you the connection details individually (host, port, database, user, password) - use those to build a JDBC URL: `jdbc:postgresql://<host>:<port>/<database>`.

### 2. Backend (Web Service, Docker)

`backend/Dockerfile` builds and runs the jar - no build/start command needed, Render just needs to be pointed at it (root directory: `backend`).

There's no `application.properties` inside the image on purpose (it's gitignored, so it isn't even in the git history Render builds from) - every setting instead comes from an environment variable, using Spring Boot's relaxed binding (`spring.datasource.url` → `SPRING_DATASOURCE_URL`, dots become underscores). Set all of these in the service's Environment tab:

`application.properties` is gitignored, so it isn't in the image at all - **every single line of `application.properties.example` needs an equivalent env var below**, not just the secret-looking ones. Anything left unset falls back to Spring Boot's own generic default, which for several of these (mail, multipart size) isn't what the app actually needs to function correctly.

| Env var | Value |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<host>:<port>/<database>` from step 1 |
| `SPRING_DATASOURCE_USERNAME` | from step 1 |
| `SPRING_DATASOURCE_PASSWORD` | from step 1 |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `validate` |
| `SPRING_MAIL_HOST` | `smtp.gmail.com` |
| `SPRING_MAIL_PORT` | `587` |
| `SPRING_MAIL_USERNAME` | Gmail address |
| `SPRING_MAIL_PASSWORD` | Gmail [App Password](https://myaccount.google.com/apppasswords) |
| `SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH` | `true` |
| `SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE` | `true` |
| `JWT_SECRET` | a fresh long random string - **don't reuse your local dev secret** |
| `JWT_EXPIRATION` | `86400000` (24 hours, in milliseconds) |
| `GEMINI_API_KEY` | from [Google AI Studio](https://aistudio.google.com/apikey) |
| `SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE` | `5MB` |
| `SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE` | `5MB` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID (add the deployed frontend URL as an Authorized JavaScript origin too) |
| `APP_CORS_ALLOWED_ORIGINS` | your deployed frontend URL, e.g. `https://your-frontend.example.com` |

(`spring.flyway.*` and `app.upload.dir` aren't in this table - they're read directly by this app's own code with safe built-in defaults, not by Spring Boot's own auto-configuration, so they work correctly even unset.)

`PORT` is injected by Render automatically - `server.port=${PORT:8080}` already reads it, don't set it yourself.

**Uploaded photos**: Render's filesystem is ephemeral on redeploy/restart unless you attach a paid-tier **persistent disk**. If you add one, mount it (e.g. at `/var/data/uploads`) and set `APP_UPLOAD_DIR=/var/data/uploads`. Without a disk, uploaded doctor/profile photos will be lost on every redeploy - acceptable for a demo, not for real production use.

### 3. Frontend

Any Next.js host works (Vercel is the zero-config option; Render can also run it as a Node web service). Set:

- `BACKEND_URL` - the backend's Render URL (e.g. `https://your-backend.onrender.com`)
- `NEXT_PUBLIC_API_URL=/api` - unchanged, still routes through the rewrite proxy
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - same Client ID as the backend, with this frontend URL also added as an Authorized JavaScript origin
