import {
  getToken,
  removeToken,
} from "./authService";


const BACKEND_BASE =
  "http://localhost:8080";

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


  // -------------------------------------------------------------
  // UNAUTHENTICATED
  //
  // 401 means:
  //
  // - JWT is missing
  // - JWT is invalid
  // - JWT is expired
  //
  // Remove the stored token because the current
  // authentication session can no longer be used.
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
  // EMPTY SUCCESS RESPONSE
  //
  // DELETE endpoints return:
  //
  // 204 No Content
  //
  // Examples:
  //
  // DELETE /api/posts/{postId}
  // DELETE /api/posts/comments/{commentId}
  // -------------------------------------------------------------

  if (
    response.status === 204
  ) {

    return null;

  }


  // -------------------------------------------------------------
  // READ RESPONSE
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

      /*
       * Some backend responses may return
       * plain text instead of JSON.
       */

      data =
        text;

    }

  }


  // -------------------------------------------------------------
  // REQUEST FAILED
  // -------------------------------------------------------------

  if (!response.ok) {


    /*
     * 403 means:
     *
     * The user IS authenticated,
     * but does not have permission
     * to perform the requested action.
     *
     * Examples:
     *
     * - Editing another user's post
     * - Deleting another user's post
     * - Deleting another user's comment
     *
     * Do NOT remove the JWT.
     */

    if (
      response.status === 403
    ) {

      throw new Error(

        data?.message ||
        "You are not allowed to perform this action."

      );

    }


    /*
     * Other errors:
     *
     * 400 Bad Request
     * 404 Not Found
     * 409 Conflict
     * 500 Server Error
     * etc.
     */

    throw new Error(

      data?.message ||
      (
        typeof data === "string"
          ? data
          : "Something went wrong."
      )

    );

  }


  return data;

}


// ---------------------------------------------------------------
// CREATE POST
//
// POST /api/posts
//
// Body:
//
// {
//   content: "..."
// }
//
// Returns:
// PostResponse
// ---------------------------------------------------------------

export async function createPost(
  content
) {

  return authenticatedFetch(

    POST_API,

    {

      method:
        "POST",

      body:
        JSON.stringify({

          content,

        }),

    }

  );

}


// ---------------------------------------------------------------
// GET FEED
//
// GET /api/posts/feed?page=0&size=10
//
// Used by:
// Home.jsx
//
// Supports:
// Infinite scrolling
// ---------------------------------------------------------------

export async function getFeed(

  page = 0,

  size = 10

) {

  return authenticatedFetch(

    `${POST_API}/feed?page=${page}&size=${size}`

  );

}


// ---------------------------------------------------------------
// UPDATE POST
//
// PUT /api/posts/{postId}
//
// Body:
//
// {
//   content: "..."
// }
//
// Backend security:
//
// Only the authenticated post author
// can edit the post.
//
// Returns:
// Updated PostResponse
// ---------------------------------------------------------------

export async function updatePost(

  postId,

  content

) {

  return authenticatedFetch(

    `${POST_API}/${postId}`,

    {

      method:
        "PUT",

      body:
        JSON.stringify({

          content,

        }),

    }

  );

}


// ---------------------------------------------------------------
// DELETE POST
//
// DELETE /api/posts/{postId}
//
// Backend security:
//
// post.author.id
// must equal
// authenticatedUser.id
//
// Successful response:
//
// 204 No Content
// ---------------------------------------------------------------

export async function deletePost(
  postId
) {

  return authenticatedFetch(

    `${POST_API}/${postId}`,

    {

      method:
        "DELETE",

    }

  );

}


// ---------------------------------------------------------------
// TOGGLE LIKE
//
// POST /api/posts/{postId}/like
//
// Backend determines whether the current
// authenticated user has already liked
// the post.
//
// Usually returns:
//
// {
//   likeCount,
//   likedByMe
// }
// ---------------------------------------------------------------

export async function toggleLike(
  postId
) {

  return authenticatedFetch(

    `${POST_API}/${postId}/like`,

    {

      method:
        "POST",

    }

  );

}


// ---------------------------------------------------------------
// GET COMMENTS
//
// GET /api/posts/{postId}/comments?page=0&size=20
//
// Used by:
// CommentPanel.jsx
// ---------------------------------------------------------------

export async function getComments(

  postId,

  page = 0,

  size = 20

) {

  return authenticatedFetch(

    `${POST_API}/${postId}/comments?page=${page}&size=${size}`

  );

}


// ---------------------------------------------------------------
// CREATE COMMENT
//
// POST /api/posts/{postId}/comments
//
// Body:
//
// {
//   content: "..."
// }
//
// Backend gets the comment author from
// the authenticated JWT user.
// ---------------------------------------------------------------

export async function createComment(

  postId,

  content

) {

  return authenticatedFetch(

    `${POST_API}/${postId}/comments`,

    {

      method:
        "POST",

      body:
        JSON.stringify({

          content,

        }),

    }

  );

}


// ---------------------------------------------------------------
// DELETE COMMENT
//
// DELETE /api/posts/comments/{commentId}
//
// commentId is globally unique (UUID),
// therefore postId is not required.
//
// Backend security:
//
// comment.author.id
// must equal
// authenticatedUser.id
//
// Successful response:
//
// 204 No Content
// ---------------------------------------------------------------

export async function deleteComment(
  commentId
) {

  return authenticatedFetch(

    `${POST_API}/comments/${commentId}`,

    {

      method:
        "DELETE",

    }

  );

}


// ---------------------------------------------------------------
// GET MY POSTS
//
// GET /api/users/me/posts?page=0&size=10
//
// Returns only posts belonging to the
// currently authenticated user.
//
// Used by:
// Profile.jsx
// ---------------------------------------------------------------

export async function getMyPosts(

  page = 0,

  size = 10

) {

  return authenticatedFetch(

    `${USER_API}/me/posts?page=${page}&size=${size}`

  );

}


// ---------------------------------------------------------------
// GET USER POSTS
//
// GET /api/users/{userId}/posts?page=0&size=10
//
// Returns posts belonging to another
// user's public profile.
//
// Used by:
// PublicProfile.jsx
// ---------------------------------------------------------------

export async function getUserPosts(

  userId,

  page = 0,

  size = 10

) {

  return authenticatedFetch(

    `${USER_API}/${userId}/posts?page=${page}&size=${size}`

  );

}
// ---------------------------------------------------------------
// GET TRENDING POSTS
//
// GET /api/posts/trending
//
// Returns the top posts by engagement.
// Used by: Search.jsx
// ---------------------------------------------------------------
export async function getTrendingPosts() {
  return authenticatedFetch(`${POST_API}/trending`);
}