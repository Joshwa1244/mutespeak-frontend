import {
  getToken,
  removeToken,
} from "./authService";

const BACKEND_BASE =
 "http://localhost:8080";

 //"https://site--mutespeak-backend--22t95wnlrvvt.code.run";
const POST_API =
  `${BACKEND_BASE}/api/posts`;

const USER_API =
  `${BACKEND_BASE}/api/users`;

// ---------------------------------------------------------------
// SHARED AUTHENTICATED REQUEST
// ---------------------------------------------------------------

async function authenticatedFetch(
  url,
  options = {}
) {
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

  // -------------------------------------------------------------
  // UNAUTHENTICATED
  // -------------------------------------------------------------
  if (response.status === 401) {
    removeToken();
    throw new Error("Your session has expired. Please log in again.");
  }

  // -------------------------------------------------------------
  // EMPTY SUCCESS RESPONSE
  // -------------------------------------------------------------
  if (response.status === 204) {
    return null;
  }

  // -------------------------------------------------------------
  // READ RESPONSE
  // -------------------------------------------------------------
  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  // -------------------------------------------------------------
  // REQUEST FAILED
  // -------------------------------------------------------------
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        data?.message || "You are not allowed to perform this action."
      );
    }
    throw new Error(
      data?.message ||
      (typeof data === "string" ? data : "Something went wrong.")
    );
  }

  return data;
}


// ---------------------------------------------------------------
// CREATE POST (TEXT ONLY - EXISTING)
// ---------------------------------------------------------------
export async function createPost(content) {
  return authenticatedFetch(POST_API, {
    method: "POST",
    body: JSON.stringify({
      content,
    }),
  });
}

// ---------------------------------------------------------------
// CREATE POST (WITH IMAGE - NEW)
//
// POST /api/posts/with-image
// Content-Type: multipart/form-data
// ---------------------------------------------------------------
export async function createImagePost(content, file) {
  const token = getToken();

  if (!token) {
    throw new Error("You are not logged in.");
  }

  const formData = new FormData();
  formData.append("content", content);
  formData.append("file", file);

  const response = await fetch(`${POST_API}/with-image`, {
    method: "POST",
    headers: {
      // We intentionally do NOT set Content-Type here.
      // The browser automatically sets multipart/form-data and 
      // generates the correct boundary string for the payload.
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.status === 401) {
    removeToken();
    throw new Error("Your session has expired. Please log in again.");
  }

  if (response.status === 204) {
    return null;
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(data?.message || "You are not allowed to perform this action.");
    }
    throw new Error(data?.message || (typeof data === "string" ? data : "Something went wrong."));
  }

  return data;
}

// ---------------------------------------------------------------
// GET FEED
// ---------------------------------------------------------------
export async function getFeed(page = 0, size = 10) {
  return authenticatedFetch(`${POST_API}/feed?page=${page}&size=${size}`);
}

// ---------------------------------------------------------------
// UPDATE POST
// ---------------------------------------------------------------
export async function updatePost(postId, content) {
  return authenticatedFetch(`${POST_API}/${postId}`, {
    method: "PUT",
    body: JSON.stringify({
      content,
    }),
  });
}

// ---------------------------------------------------------------
// DELETE POST
// ---------------------------------------------------------------
export async function deletePost(postId) {
  return authenticatedFetch(`${POST_API}/${postId}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------
// TOGGLE LIKE
// ---------------------------------------------------------------
export async function toggleLike(postId) {
  return authenticatedFetch(`${POST_API}/${postId}/like`, {
    method: "POST",
  });
}

// ---------------------------------------------------------------
// GET COMMENTS
// ---------------------------------------------------------------
export async function getComments(postId, page = 0, size = 20) {
  return authenticatedFetch(`${POST_API}/${postId}/comments?page=${page}&size=${size}`);
}

// ---------------------------------------------------------------
// CREATE COMMENT
// ---------------------------------------------------------------
export async function createComment(postId, content) {
  return authenticatedFetch(`${POST_API}/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({
      content,
    }),
  });
}

// ---------------------------------------------------------------
// DELETE COMMENT
// ---------------------------------------------------------------
export async function deleteComment(commentId) {
  return authenticatedFetch(`${POST_API}/comments/${commentId}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------
// GET MY POSTS
// ---------------------------------------------------------------
export async function getMyPosts(page = 0, size = 10) {
  return authenticatedFetch(`${USER_API}/me/posts?page=${page}&size=${size}`);
}

// ---------------------------------------------------------------
// GET USER POSTS
// ---------------------------------------------------------------
export async function getUserPosts(userId, page = 0, size = 10) {
  return authenticatedFetch(`${USER_API}/${userId}/posts?page=${page}&size=${size}`);
}

// ---------------------------------------------------------------
// GET TRENDING POSTS
// ---------------------------------------------------------------
export async function getTrendingPosts() {
  return authenticatedFetch(`${POST_API}/trending`);
}