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

Edit `.env.local` if your backend runs somewhere other than `http://localhost:8080/api`, and fill in `NEXT_PUBLIC_GOOGLE_CLIENT_ID` with the same Client ID used on the backend (leave blank to hide the Google button).

The app starts on `http://localhost:3000`.
