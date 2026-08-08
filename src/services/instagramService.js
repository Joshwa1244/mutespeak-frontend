import {
  getToken,
  removeToken,
} from "./authService";

const BACKEND_BASE = 
//"http://localhost:8080"; // Or your production URL
"https://site--mutespeak-backend--22t95wnlrvvt.code.run";

const INSTAGRAM_API = `${BACKEND_BASE}/api/users/instagram`;

// ---------------------------------------------------------------
// SHARED AUTHENTICATED REQUEST
// ---------------------------------------------------------------
async function authenticatedFetch(url, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("You are not logged in.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  return handleResponse(response);
}

// ---------------------------------------------------------------
// SHARED RESPONSE HANDLER
// ---------------------------------------------------------------
async function handleResponse(response) {
  // Session Expired / Invalid JWT
  if (response.status === 401) {
    removeToken();
    throw new Error("Your session has expired. Please log in again.");
  }

  // 204 No Content (e.g., successful delete)
  if (response.status === 204) {
    return null;
  }

  // Read Response Body
  let data = null;
  const text = await response.text();

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  // Request Failed
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        data?.message || "You are not allowed to perform this action."
      );
    }

    throw new Error(data?.message || "Something went wrong.");
  }

  return data;
}

// ---------------------------------------------------------------
// GET INSTAGRAM PROFILE
//
// GET /api/users/instagram/{userId}
// ---------------------------------------------------------------
export async function getInstagramProfile(userId) {
  return authenticatedFetch(
    `${INSTAGRAM_API}/${encodeURIComponent(userId)}`,
    {
      method: "GET",
    }
  );
}

// ---------------------------------------------------------------
// LINK INSTAGRAM PROFILE
//
// POST /api/users/instagram
// ---------------------------------------------------------------
export async function linkInstagramProfile(handle) {
  return authenticatedFetch(INSTAGRAM_API, {
    method: "POST",
    body: JSON.stringify({
      handle: handle.trim(),
    }),
  });
}

// ---------------------------------------------------------------
// UNLINK INSTAGRAM PROFILE
//
// DELETE /api/users/instagram
// ---------------------------------------------------------------
export async function unlinkInstagramProfile() {
  return authenticatedFetch(INSTAGRAM_API, {
    method: "DELETE",
  });
}