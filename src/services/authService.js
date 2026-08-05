// ---------------------------------------------------------------
// DooredIn Authentication Service
// ---------------------------------------------------------------
//
// Handles:
//
// - Registration
// - OTP verification
// - OTP resend
// - Login
// - Forgot password
// - Password reset OTP verification
// - Password reset
// - JWT token storage
// - Current authenticated user
// - Complete / update profile
// - Logout
// - Institutional email validation
//
// ---------------------------------------------------------------


// ---------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------

const BACKEND_BASE =
//  "http://localhost:8080";
"https://site--mutespeak-backend--22t95wnlrvvt.code.run";
const API_BASE =
  `${BACKEND_BASE}/api/auth`;

const TOKEN_KEY =
  "cograd_token";

// ---------------------------------------------------------------
// SHARED RESPONSE HANDLER
// ---------------------------------------------------------------
//
// Safely handles:
//
// - JSON success responses
// - JSON error responses (checking multiple common keys)
// - Plain text error responses
// - Empty bodies (using HTTP status text as fallback)
//
// ---------------------------------------------------------------

async function handleResponse(
  response
) {

  let data = null;
  let rawText = "";

  try {
    // Read as text first
    rawText = await response.text();
    if (rawText) {
      data = JSON.parse(rawText);
    }
  } catch {
    // Backend response was not valid JSON
  }


  if (
    !response.ok
  ) {

    // 1. Try to extract the error from common JSON keys
    let errorMessage = 
      data?.message || 
      data?.error || 
      data?.errorMessage || 
      data?.details;

    // 2. If no JSON error was found, but we have plain text (and it's not HTML)
    if (!errorMessage && rawText && !rawText.trim().startsWith('<')) {
      errorMessage = rawText;
    }

    // 3. If the backend sent a totally blank body, use the HTTP status text (e.g. "Unauthorized")
    if (!errorMessage) {
      errorMessage = response.statusText ? `Error: ${response.statusText}` : `Error code: ${response.status}`;
    }

    // 4. Final fallback
    throw new Error(
      errorMessage || "Something went wrong. Please try again."
    );

  }


  return data;

}

// ---------------------------------------------------------------
// JWT TOKEN MANAGEMENT
// ---------------------------------------------------------------

export function saveToken(
  token
) {

  localStorage.setItem(

    TOKEN_KEY,

    token

  );

}


export function getToken() {

  return localStorage.getItem(
    TOKEN_KEY
  );

}


export function removeToken() {

  localStorage.removeItem(
    TOKEN_KEY
  );

  // Clear the splash screen memory so it plays again on the next login
  sessionStorage.removeItem(
    "mutespeak_splash_shown"
  );

}


export function isLoggedIn() {

  return Boolean(
    getToken()
  );

}


// ---------------------------------------------------------------
// REGISTER
//
// POST /api/auth/register
// ---------------------------------------------------------------

export async function register({

  name,

  email,

  password,

}) {

  const response =
    await fetch(

      `${API_BASE}/register`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

        },

        body:
          JSON.stringify({

            name,

            email,

            password,

          }),

      }

    );


  return handleResponse(
    response
  );

}


// ---------------------------------------------------------------
// VERIFY REGISTRATION OTP
//
// POST /api/auth/verify-otp
// ---------------------------------------------------------------

export async function verifyOtp(

  email,

  otp

) {

  const response =
    await fetch(

      `${API_BASE}/verify-otp`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

        },

        body:
          JSON.stringify({

            email,

            otp,

          }),

      }

    );


  return handleResponse(
    response
  );

}


// ---------------------------------------------------------------
// RESEND REGISTRATION OTP
//
// POST /api/auth/resend-otp
// ---------------------------------------------------------------

export async function resendOtp(
  email
) {

  const response =
    await fetch(

      `${API_BASE}/resend-otp`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

        },

        body:
          JSON.stringify({

            email,

          }),

      }

    );


  return handleResponse(
    response
  );

}


// ---------------------------------------------------------------
// LOGIN
//
// POST /api/auth/login
//
// Expected response:
//
// {
//   token: "eyJ...",
//   tokenType: "Bearer"
// }
//
// ---------------------------------------------------------------

export async function login({

  email,

  password,

}) {

  const response =
    await fetch(

      `${API_BASE}/login`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

        },

        body:
          JSON.stringify({

            email,

            password,

          }),

      }

    );


  return handleResponse(
    response
  );

}


// ---------------------------------------------------------------
// FORGOT PASSWORD
//
// POST /api/auth/forgot-password
//
// Request:
//
// {
//   email: "user@example.com"
// }
//
// Backend intentionally returns the same generic response
// whether or not the email exists.
//
// This prevents account enumeration.
// ---------------------------------------------------------------

export async function requestPasswordReset(
  email
) {

  const cleanEmail =
    email
      .trim()
      .toLowerCase();


  if (
    !cleanEmail
  ) {

    throw new Error(
      "Email is required."
    );

  }


  const response =
    await fetch(

      `${API_BASE}/forgot-password`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

        },

        body:
          JSON.stringify({

            email:
              cleanEmail,

          }),

      }

    );


  return handleResponse(
    response
  );

}


// ---------------------------------------------------------------
// VERIFY PASSWORD RESET OTP
//
// POST /api/auth/verify-reset-otp
//
// Request:
//
// {
//   email: "user@example.com",
//   otp: "123456"
// }
//
// Successful response:
//
// {
//   resetToken: "secure-random-token"
// }
//
// IMPORTANT:
//
// The returned resetToken is temporary.
// It should NOT be stored in localStorage.
//
// ForgotPassword.jsx should keep it only in component state
// until the password reset is completed.
// ---------------------------------------------------------------

export async function verifyResetOtp(

  email,

  otp

) {

  const cleanEmail =
    email
      .trim()
      .toLowerCase();


  const cleanOtp =
    otp
      .trim();


  if (
    !cleanEmail
  ) {

    throw new Error(
      "Email is required."
    );

  }


  if (
    !cleanOtp
  ) {

    throw new Error(
      "Verification code is required."
    );

  }


  const response =
    await fetch(

      `${API_BASE}/verify-reset-otp`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

        },

        body:
          JSON.stringify({

            email:
              cleanEmail,

            otp:
              cleanOtp,

          }),

      }

    );


  return handleResponse(
    response
  );

}


// ---------------------------------------------------------------
// RESET PASSWORD
//
// POST /api/auth/reset-password
//
// Request:
//
// {
//   resetToken: "...",
//   newPassword: "..."
// }
//
// The backend determines which account belongs to the
// validated reset token.
//
// Email and user ID are intentionally NOT sent here.
// ---------------------------------------------------------------

export async function resetPassword(

  resetToken,

  newPassword

) {

  const cleanResetToken =
    resetToken
      ?.trim();


  if (
    !cleanResetToken
  ) {

    throw new Error(

      "Your password reset session is invalid or has expired."

    );

  }


  if (
    !newPassword
  ) {

    throw new Error(
      "New password is required."
    );

  }


  const response =
    await fetch(

      `${API_BASE}/reset-password`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

        },

        body:
          JSON.stringify({

            resetToken:
              cleanResetToken,

            newPassword,

          }),

      }

    );


  return handleResponse(
    response
  );

}


// ---------------------------------------------------------------
// GET CURRENT LOGGED-IN USER
//
// GET /api/users/me
//
// Requires JWT:
//
// Authorization: Bearer <token>
// ---------------------------------------------------------------

export async function getCurrentUser() {

  const token =
    getToken();


  if (
    !token
  ) {

    throw new Error(

      "No authentication token found."

    );

  }


  const response =
    await fetch(

      `${BACKEND_BASE}/api/users/me`,

      {

        method:
          "GET",

        headers: {

          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,

        },

      }

    );


  /*
   * 401 / 403 means the stored token
   * can no longer authenticate the user.
   */

  if (

    response.status === 401 ||

    response.status === 403

  ) {

    removeToken();


    throw new Error(

      "Your session has expired. Please log in again."

    );

  }


  return handleResponse(
    response
  );

}


// ---------------------------------------------------------------
// COMPLETE / UPDATE PROFILE
//
// PUT /api/users/me/profile
//
// Used for:
//
// 1. First-time profile completion
// 2. Editing profile later
//
// Requires JWT.
// ---------------------------------------------------------------

export async function updateProfile({

  name,

  department,

  course,

  batchYear,

  bio,

}) {

  const token =
    getToken();


  if (
    !token
  ) {

    throw new Error(

      "No authentication token found."

    );

  }


  const response =
    await fetch(

      `${BACKEND_BASE}/api/users/me/profile`,

      {

        method:
          "PUT",

        headers: {

          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,

        },

        body:
          JSON.stringify({

            name,

            department,

            course,

            batchYear,

            bio,

          }),

      }

    );


  /*
   * Authentication failure.
   *
   * Remove the unusable token so the user
   * can authenticate again.
   */

  if (

    response.status === 401 ||

    response.status === 403

  ) {

    removeToken();


    throw new Error(

      "Your session has expired. Please log in again."

    );

  }


  return handleResponse(
    response
  );

}


// ---------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------

export function logout() {

  removeToken();

}


// ---------------------------------------------------------------
// INSTITUTIONAL EMAIL VALIDATION
// ---------------------------------------------------------------
//
// Frontend validation improves UX only.
//
// Spring Boot must independently enforce
// the institutional email restriction.
//
// NOTE:
//
// This validation is primarily relevant to registration.
//
// Forgot-password should generally send the email to the backend
// and allow the backend to return its generic response.
//
// ---------------------------------------------------------------

export function isInstitutionalEmail(
  email
) {

  return /^[a-zA-Z0-9._%+-]+@loyolacollege\.edu$/

    .test(

      email.trim()

    );

}