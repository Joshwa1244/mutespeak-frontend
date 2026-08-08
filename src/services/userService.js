import {
  getToken,
  removeToken,
} from "./authService";


const BACKEND_BASE =
 // "http://localhost:8080";
"https://site--mutespeak-backend--22t95wnlrvvt.code.run";
const USER_API =
  `${BACKEND_BASE}/api/users`;


// ---------------------------------------------------------------
// SHARED AUTHENTICATED REQUEST
//
// Used for normal JSON-based API requests.
//
// NOTE:
// Do not use this helper for multipart/form-data uploads because
// it automatically sets Content-Type to application/json.
// ---------------------------------------------------------------

async function authenticatedFetch(
  url,
  options = {}
) {

  const token =
    getToken();


  if (!token) {

    throw new Error(
      "You are not logged in."
    );

  }


  const response =
    await fetch(
      url,
      {

        ...options,

        headers: {

          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,

          ...options.headers,

        },

      }
    );


  return handleResponse(
    response
  );

}


// ---------------------------------------------------------------
// SHARED RESPONSE HANDLER
// ---------------------------------------------------------------

async function handleResponse(
  response
) {

  // -------------------------------------------------------------
  // SESSION EXPIRED / INVALID JWT
  // -------------------------------------------------------------

  if (
    response.status === 401
  ) {

    removeToken();


    throw new Error(
      "Your session has expired. Please log in again."
    );

  }


  // -------------------------------------------------------------
  // READ RESPONSE BODY
  //
  // Using text first allows us to safely handle:
  //
  // - JSON responses
  // - Plain text responses
  // - Empty responses
  // -------------------------------------------------------------

  let data = null;


  const text =
    await response.text();


  if (text) {

    try {

      data =
        JSON.parse(
          text
        );

    } catch {

      data =
        text;

    }

  }


  // -------------------------------------------------------------
  // REQUEST FAILED
  // -------------------------------------------------------------

  if (!response.ok) {


    /*
     * A 403 does not necessarily mean the JWT is invalid.
     *
     * The user may simply not have permission to perform
     * a particular action.
     *
     * Therefore we do not automatically remove the token.
     */

    if (
      response.status === 403
    ) {

      throw new Error(

        data?.message ||
        "You are not allowed to perform this action."

      );

    }


    throw new Error(

      data?.message ||
      "Something went wrong."

    );

  }


  return data;

}


// ---------------------------------------------------------------
// SEARCH USERS
//
// GET /api/users/search?q=...
// ---------------------------------------------------------------

export async function searchUsers(
  query
) {

  const cleanQuery =
    query.trim();


  if (!cleanQuery) {

    return [];

  }


  return authenticatedFetch(

    `${USER_API}/search?q=${
      encodeURIComponent(
        cleanQuery
      )
    }`

  );

}


// ---------------------------------------------------------------
// GET PUBLIC PROFILE
//
// GET /api/users/{userId}
// ---------------------------------------------------------------

export async function getPublicProfile(
  userId
) {

  return authenticatedFetch(

    `${USER_API}/${
      encodeURIComponent(
        userId
      )
    }`

  );

}


// ---------------------------------------------------------------
// UPLOAD / REPLACE PROFILE PICTURE
//
// POST /api/users/me/profile-picture
//
// Request:
// multipart/form-data
//
// Backend:
// @RequestParam("file") MultipartFile file
//
// IMPORTANT:
//
// Do NOT manually set:
//
// Content-Type: multipart/form-data
//
// The browser automatically generates the correct Content-Type
// together with the required multipart boundary.
// ---------------------------------------------------------------

export async function uploadProfilePicture(
  file
) {

  const token =
    getToken();


  if (!token) {

    throw new Error(
      "You are not logged in."
    );

  }


  // -------------------------------------------------------------
  // BASIC FRONTEND VALIDATION
  //
  // Backend validation remains authoritative.
  // This only improves user experience.
  // -------------------------------------------------------------

  if (!file) {

    throw new Error(
      "Please select a profile picture."
    );

  }


  const allowedTypes =
    [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];


  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    throw new Error(
      "Only JPG, PNG and WebP images are allowed."
    );

  }


  const MAX_FILE_SIZE =
    5 * 1024 * 1024;


  if (
    file.size >
    MAX_FILE_SIZE
  ) {

    throw new Error(
      "Profile picture cannot exceed 5 MB."
    );

  }


  // -------------------------------------------------------------
  // CREATE MULTIPART FORM DATA
  // -------------------------------------------------------------

  const formData =
    new FormData();


  /*
   * The key "file" must match:
   *
   * @RequestParam("file")
   * MultipartFile file
   *
   * in UserController.
   */

  formData.append(
    "file",
    file
  );


  // -------------------------------------------------------------
  // SEND UPLOAD
  //
  // Notice there is NO Content-Type header here.
  // -------------------------------------------------------------

  const response =
    await fetch(

      `${USER_API}/me/profile-picture`,

      {

        method:
          "POST",

        headers: {

          Authorization:
            `Bearer ${token}`,

        },

        body:
          formData,

      }

    );


  return handleResponse(
    response
  );

}


// ---------------------------------------------------------------
// DELETE PROFILE PICTURE
//
// DELETE /api/users/me/profile-picture
//
// Returns the updated UserResponse with:
//
// profilePictureUrl: null
// ---------------------------------------------------------------

export async function deleteProfilePicture() {

  const token =
    getToken();


  if (!token) {

    throw new Error(
      "You are not logged in."
    );

  }


  const response =
    await fetch(

      `${USER_API}/me/profile-picture`,

      {

        method:
          "DELETE",

        headers: {

          Authorization:
            `Bearer ${token}`,

        },

      }

    );


  return handleResponse(
    response
  );

}

// ---------------------------------------------------------------
// POKE USER
//
// POST /api/users/{userId}/poke
// ---------------------------------------------------------------
export async function pokeUser(userId) {
  return authenticatedFetch(`${USER_API}/${userId}/poke`, {
    method: "POST",
  });
}