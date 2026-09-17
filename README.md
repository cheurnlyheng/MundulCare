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

The browser only ever talks to `http://localhost:3000`. `frontend/next.config.ts` rewrites `/api/*` and `/uploads/*` requests to the Spring Boot backend (`http://localhost:8080` by default, override with a `BACKEND_URL` env var). This keeps everything on one origin during development, so the backend's CORS config never comes into play.
