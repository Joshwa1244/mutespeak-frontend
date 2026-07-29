# CoGrad — Frontend (Auth flow)

React + Vite frontend for CoGrad, currently covering the auth flow only
(Login, Register, OTP verification, Forgot Password), per the design
document. Home feed, Atti panel, Spotted, and Crush Wall come next.

## Run it

```bash
npm install
npm run dev
```

Visit http://localhost:5173

## What's mocked right now

There's no backend yet, so `src/services/authService.js` mocks every
call (register, sendOtp, verifyOtp, login, requestPasswordReset).
Each function is written to match what the real Spring Boot API call
will look like — when the backend is ready, replace the body of each
function with a `fetch()` to `API_BASE`, and nothing else in the app
needs to change.

Because there's no real email server yet, `sendOtp()` prints the OTP
to the browser console and also returns it as `devOtp`, which the
Verify OTP screen shows in a "DEV MODE" banner so you can test the
flow end-to-end. Remove that banner and the `devOtp` return value
once real email sending exists on the backend.

## Structure

```
src/
  pages/          Login, Register, VerifyOtp, ForgotPassword, Home
  components/      AuthWindow (shared chrome frame), FormField, Button
  services/        authService.js — mocked API layer
  styles/          global.css — CoGrad design tokens (colors, fonts)
```

## Design system

Matches the CoGrad Design Document: institutional blue (#1B3A6B) and
Loyola gold (#E8AC1F), Windows-98-style chrome frame, VT323 for
titlebar/pixel text, Inter for body copy, JetBrains Mono for data.

## Next steps

- Wire `authService.js` to the real Spring Boot endpoints
- Add JWT storage + route protection once login returns a real token
- Build the home feed (Atti panel, Spotted, Crush Wall, Daily Poll)
