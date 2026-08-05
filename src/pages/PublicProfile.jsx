import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import AppShell
  from "../components/AppShell";

import CommentPanel
  from "../components/CommentPanel";

import UserAvatar
  from "../components/UserAvatar";

import {
  getCurrentUser,
} from "../services/authService";

import {
  getPublicProfile,
} from "../services/userService";

import {
  getUserPosts,
  toggleLike,
} from "../services/postService";

import {
  pokeUser,
} from "../services/notificationService";

import CreativeLoader from "../components/CreativeLoader";

// WebSocket Imports
import {
  connectWebSocket,
  disconnectWebSocket,
  subscribe,
} from "../services/websocketService";

// Instagram Integration
import {
  getInstagramProfile,
} from "../services/instagramService";


const POST_PAGE_SIZE = 10;


export default function PublicProfile() {

  const navigate =
    useNavigate();

  const { userId } =
    useParams();


  // -------------------------------------------------------------
  // PUBLIC PROFILE STATE
  //
  // user = person whose profile is being viewed
  // -------------------------------------------------------------

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // AVATAR MODAL STATE
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showInstaAvatarModal, setShowInstaAvatarModal] = useState(false);

  const [isPoking, setIsPoking] = useState(false);
  
  // SOCIAL HANDLES STATE
  const [instaProfile, setInstaProfile] = useState(null);


  // -------------------------------------------------------------
  // AUTHENTICATED USER STATE
  //
  // currentUser = person logged in with JWT
  //
  // This is intentionally separate from "user".
  // CommentPanel needs currentUser for deletion permissions.
  // -------------------------------------------------------------

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);


  // -------------------------------------------------------------
  // POSTS STATE
  // -------------------------------------------------------------

  const [posts, setPosts] =
    useState([]);

  const [
    postsLoading,
    setPostsLoading,
  ] = useState(true);

  const [
    postsError,
    setPostsError,
  ] = useState("");

  const [
    postsPage,
    setPostsPage,
  ] = useState(0);

  const [
    hasMorePosts,
    setHasMorePosts,
  ] = useState(true);

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false);


  // -------------------------------------------------------------
  // LIKE STATE
  // -------------------------------------------------------------

  const [
    likingPosts,
    setLikingPosts,
  ] = useState(
    new Set()
  );


  // -------------------------------------------------------------
  // COMMENT PANEL
  // -------------------------------------------------------------

  const [
    selectedPost,
    setSelectedPost,
  ] = useState(null);


  // -------------------------------------------------------------
  // LOAD AUTHENTICATED USER
  // -------------------------------------------------------------

  useEffect(() => {

    let cancelled =
      false;


    async function loadCurrentUser() {

      try {

        const authenticatedUser =
          await getCurrentUser();


        if (
          cancelled
        ) {

          return;

        }


        setCurrentUser(
          authenticatedUser
        );


      } catch (error) {

        if (
          !cancelled
        ) {

          console.error(
            "Couldn't load authenticated user:",
            error
          );

        }

      }

    }


    loadCurrentUser();


    return () => {

      cancelled = true;

    };

  }, []);


  // -------------------------------------------------------------
  // LOAD PUBLIC PROFILE
  // -------------------------------------------------------------

  useEffect(() => {

    let cancelled =
      false;


    async function loadProfile() {

      setLoading(
        true
      );

      setError(
        ""
      );


      try {

        const profile =
          await getPublicProfile(
            userId
          );

        if (
          cancelled
        ) {
          return;
        }

        setUser(
          profile
        );
        
        // Fetch Instagram Profile for the public user
        try {
          const iProfile = await getInstagramProfile(userId);
          if (!cancelled) setInstaProfile(iProfile);
        } catch (err) {
          console.warn("Could not fetch user's social accounts");
        }


      } catch (error) {

        if (
          cancelled
        ) {

          return;

        }

        setUser(
          null
        );

        setError(

          error.message ||
          "Couldn't load this profile."

        );


      } finally {

        if (
          !cancelled
        ) {

          setLoading(
            false
          );

        }

      }

    }


    if (
      userId
    ) {

      loadProfile();

    }


    return () => {

      cancelled = true;

    };

  }, [userId]);


  // -------------------------------------------------------------
  // LOAD USER POSTS
  // -------------------------------------------------------------

  useEffect(() => {

    let cancelled =
      false;


    async function loadInitialPosts() {

      if (
        !userId
      ) {

        return;

      }


      setPostsLoading(
        true
      );

      setPostsError(
        ""
      );


      try {

        const result =
          await getUserPosts(

            userId,

            0,

            POST_PAGE_SIZE

          );


        if (
          cancelled
        ) {

          return;

        }


        const safePosts =
          Array.isArray(result)
            ? result
            : [];


        setPosts(
          safePosts
        );


        setPostsPage(
          0
        );


        setHasMorePosts(

          safePosts.length ===
          POST_PAGE_SIZE

        );


      } catch (error) {

        if (
          cancelled
        ) {

          return;

        }


        setPosts(
          []
        );


        setPostsError(

          error.message ||
          "Couldn't load this user's posts."

        );


      } finally {

        if (
          !cancelled
        ) {

          setPostsLoading(
            false
          );

        }

      }

    }


    loadInitialPosts();


    return () => {

      cancelled = true;

    };

  }, [userId]);


  // -------------------------------------------------------------
  // WEBSOCKET INTEGRATION (LIVE UPDATES)
  // -------------------------------------------------------------

  useEffect(() => {
    if (!userId) return;

    let postUpdateSubscription = null;
    let postDeleteSubscription = null;
    let likeSubscription = null;
    let commentSubscription = null;
    let commentDeleteSubscription = null;

    connectWebSocket(() => {
      postUpdateSubscription = subscribe("/topic/feed/update", (event) => {
        const updatedPost = event.post || event;
        setPosts((current) =>
          current.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
        );
      });

      postDeleteSubscription = subscribe("/topic/feed/delete", (event) => {
        const deletedId = event.postId || event.id;
        setPosts((current) => current.filter((p) => p.id !== deletedId));
      });

      likeSubscription = subscribe("/topic/likes", (event) => {
        setPosts((current) =>
          current.map((p) => (p.id === event.postId ? { ...p, likeCount: event.likeCount } : p))
        );
        setSelectedPost((current) => {
          if (current && current.id === event.postId) {
            return { ...current, likeCount: event.likeCount };
          }
          return current;
        });
      });

      commentSubscription = subscribe("/topic/comments", (event) => {
        setPosts((current) =>
          current.map((p) =>
            p.id === event.postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
          )
        );
        setSelectedPost((current) => {
          if (current && current.id === event.postId) {
            return { ...current, commentCount: (current.commentCount || 0) + 1 };
          }
          return current;
        });
      });

      commentDeleteSubscription = subscribe("/topic/comments/delete", (event) => {
        setPosts((current) =>
          current.map((p) =>
            p.id === event.postId
              ? { ...p, commentCount: Math.max((p.commentCount || 0) - 1, 0) }
              : p
          )
        );
        setSelectedPost((current) => {
          if (current && current.id === event.postId) {
            return { ...current, commentCount: Math.max((current.commentCount || 0) - 1, 0) };
          }
          return current;
        });
      });
    });

    return () => {
      if (postUpdateSubscription) postUpdateSubscription.unsubscribe();
      if (postDeleteSubscription) postDeleteSubscription.unsubscribe();
      if (likeSubscription) likeSubscription.unsubscribe();
      if (commentSubscription) commentSubscription.unsubscribe();
      if (commentDeleteSubscription) commentDeleteSubscription.unsubscribe();
      disconnectWebSocket();
    };
  }, [userId]);


  // -------------------------------------------------------------
  // LOAD MORE POSTS
  // -------------------------------------------------------------

  async function handleLoadMore() {

    if (
      loadingMore ||
      !hasMorePosts
    ) {

      return;

    }


    const nextPage =
      postsPage + 1;


    setLoadingMore(
      true
    );

    setPostsError(
      ""
    );


    try {

      const result =
        await getUserPosts(

          userId,

          nextPage,

          POST_PAGE_SIZE

        );


      const newPosts =
        Array.isArray(result)
          ? result
          : [];


      /*
       * Avoid duplicates if the post list changes
       * while pagination is active.
       */

      setPosts(
        (currentPosts) => {

          const existingIds =
            new Set(

              currentPosts.map(
                (post) =>
                  post.id
              )

            );


          const uniquePosts =
            newPosts.filter(

              (post) =>
                !existingIds.has(
                  post.id
                )

            );


          return [

            ...currentPosts,

            ...uniquePosts,

          ];

        }
      );


      setPostsPage(
        nextPage
      );


      if (
        newPosts.length <
        POST_PAGE_SIZE
      ) {

        setHasMorePosts(
          false
        );

      }


    } catch (error) {

      setPostsError(

        error.message ||
        "Couldn't load more posts."

      );


    } finally {

      setLoadingMore(
        false
      );

    }

  }


  // -------------------------------------------------------------
  // TOGGLE LIKE
  // -------------------------------------------------------------

  async function handleToggleLike(
    postId
  ) {

    if (
      likingPosts.has(
        postId
      )
    ) {

      return;

    }


    setLikingPosts(
      (current) => {

        const next =
          new Set(
            current
          );


        next.add(
          postId
        );


        return next;

      }
    );


    try {

      const result =
        await toggleLike(
          postId
        );


      setPosts(
        (currentPosts) =>

          currentPosts.map(
            (post) => {

              if (
                post.id !== postId
              ) {

                return post;

              }


              return {

                ...post,

                likeCount:
                  result.likeCount,

                likedByMe:
                  result.likedByMe,

              };

            }
          )

      );


      /*
       * Keep the open CommentPanel synchronized.
       */

      setSelectedPost(
        (currentPost) => {

          if (
            !currentPost ||
            currentPost.id !== postId
          ) {

            return currentPost;

          }


          return {

            ...currentPost,

            likeCount:
              result.likeCount,

            likedByMe:
              result.likedByMe,

          };

        }
      );


    } catch (error) {

      setPostsError(

        error.message ||
        "Couldn't update like."

      );


    } finally {

      setLikingPosts(
        (current) => {

          const next =
            new Set(
              current
            );


          next.delete(
            postId
          );


          return next;

        }
      );

    }

  }


  // -------------------------------------------------------------
  // COMMENT ADDED
  // -------------------------------------------------------------

  function handleCommentAdded(
    postId
  ) {

    setPosts(
      (currentPosts) =>

        currentPosts.map(
          (post) => {

            if (
              post.id !== postId
            ) {

              return post;

            }


            return {

              ...post,

              commentCount:
                (post.commentCount || 0) + 1,

            };

          }
        )

    );


    setSelectedPost(
      (currentPost) => {

        if (
          !currentPost ||
          currentPost.id !== postId
        ) {

          return currentPost;

        }


        return {

          ...currentPost,

          commentCount:
            (currentPost.commentCount || 0) + 1,

        };

      }
    );

  }


  // -------------------------------------------------------------
  // COMMENT DELETED
  // -------------------------------------------------------------

  function handleCommentDeleted(
    postId
  ) {

    setPosts(
      (currentPosts) =>

        currentPosts.map(
          (post) => {

            if (
              post.id !== postId
            ) {

              return post;

            }


            return {

              ...post,

              commentCount:
                Math.max(

                  (post.commentCount || 0) - 1,

                  0

                ),

            };

          }
        )

    );


    setSelectedPost(
      (currentPost) => {

        if (
          !currentPost ||
          currentPost.id !== postId
        ) {

          return currentPost;

        }


        return {

          ...currentPost,

          commentCount:
            Math.max(

              (currentPost.commentCount || 0) - 1,

              0

            ),

        };

      }
    );

  }


  // -------------------------------------------------------------
  // POKE USER
  // -------------------------------------------------------------
  async function handlePoke() {

    if (isPoking) {
      return;
    }

    setIsPoking(true);

    try {

      await pokeUser(userId);

      alert("Poke sent successfully.");

    } catch (error) {

      alert(
        error.message ||
        "Failed to send poke."
      );

    } finally {

      setIsPoking(false);

    }

  }


  // -------------------------------------------------------------
  // LOADING
  // -------------------------------------------------------------

  if (loading) {
    return (
        <main className="public-profile-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CreativeLoader message="Fetching profile..." />
        </main>
    );
  }

  // -------------------------------------------------------------
  // ERROR
  // -------------------------------------------------------------

  if (
    error ||
    !user
  ) {

    return (
        <div className="public-profile-page" style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" }}>

          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "10px 20px", borderRadius: "30px", border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff", color: "#374151", fontSize: "0.9rem", fontWeight: "600",
              cursor: "pointer", transition: "all 0.2s", marginBottom: "2rem"
            }}
          >
            <BackIcon />
            <span>Back</span>
          </button>

          <section style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "3rem 2rem", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <h1 style={{ color: "#111827", fontSize: "1.5rem", marginBottom: "1rem" }}>
              Profile unavailable
            </h1>
            <p style={{ color: "#6b7280" }}>
              {error || "This profile could not be found."}
            </p>
          </section>

        </div>
    );

  }


  // -------------------------------------------------------------
  // PUBLIC PROFILE
  // -------------------------------------------------------------

  return (

   <>
      {/* 
        PREMIUM RESPONSIVE STYLES
        Mutespeak Brand Colors:
        - Primary Dark Green: #023d20
        - Accent Olive Green: #b6c324
      */}
      <style>{`
        :root {
          --brand-primary: #023d20;
          --brand-primary-hover: #03522b;
          --brand-accent: #b6c324;
          --brand-accent-hover: #c9d532;
          --brand-shadow: rgba(2, 61, 32, 0.08);
          --text-main: #111827;
          --text-muted: #6b7280;
        }

        /* Base Layout */
        .premium-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          animation: fadeIn 0.4s ease-out forwards;
        }

        /* Cards */
        .premium-card {
          background-color: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px var(--brand-shadow);
          border: 1px solid rgba(0,0,0,0.03);
          margin-bottom: 2rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        /* Banner & Header */
        .premium-banner {
          height: 140px;
          background: linear-gradient(135deg, var(--brand-primary) 0%, #066b3b 100%);
          position: relative;
        }
        
        .premium-banner::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at top right, rgba(182, 195, 36, 0.2), transparent);
        }

        .premium-header-content {
          padding: 0 1.5rem 2rem 1.5rem;
          position: relative;
          text-align: center;
        }

        .premium-avatar-wrapper {
          margin-top: -60px;
          margin-bottom: 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 10;
        }

        .premium-avatar-btn {
          background: #ffffff;
          border: 6px solid #ffffff;
          border-radius: 50%;
          padding: 0;
          cursor: pointer;
          box-shadow: 0 8px 24px var(--brand-shadow);
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .premium-avatar-btn:hover:not(.default-cursor) {
          transform: scale(1.05);
        }
        
        .premium-avatar-btn.default-cursor {
          cursor: default;
        }

        /* Buttons */
        .btn-premium {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 30px;
          border: none;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
        }

        .btn-primary {
          background-color: var(--brand-primary);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(2, 61, 32, 0.2);
        }
        
        .btn-primary:hover:not(:disabled) {
          background-color: var(--brand-primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(2, 61, 32, 0.3);
        }

        .btn-secondary {
          background-color: #f3f4f6;
          color: #374151;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background-color: #e5e7eb;
        }
        
        .btn-outline {
          border: 1px solid #e5e7eb;
          background-color: #ffffff;
          color: var(--text-main);
          border-radius: 30px;
        }
        
        .btn-outline:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #d1d5db;
        }

        .btn-premium:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        /* Grid */
        .premium-form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        
        /* Social Handles */
        .social-handle-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 16px;
          border: 1px solid #f3f4f6;
          background-color: #fafafa;
          transition: all 0.2s;
        }
        
        .social-handle-container:hover {
          border-color: #e5e7eb;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        
        .social-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          color: white;
          flex-shrink: 0;
        }
        
        .insta-bg {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
        }
        
        .social-content {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        /* Post Styles */
        .premium-post-card {
          background-color: #ffffff;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0,0,0,0.02);
          margin-bottom: 1.25rem;
          transition: box-shadow 0.2s ease;
        }
        
        .premium-post-card:hover {
          box-shadow: 0 8px 25px var(--brand-shadow);
        }

        .post-action-row {
          display: flex;
          gap: 0.5rem;
          border-top: 1px solid #f3f4f6;
          padding-top: 1rem;
          flex-wrap: wrap;
        }

        .feed-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 12px;
          border: none;
          background-color: transparent;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          flex: 1;
        }
        
        .feed-action-btn:hover:not(:disabled) {
          background-color: #f9fafb;
          color: var(--brand-primary);
        }
        
        .feed-action-btn.liked {
          color: var(--brand-accent);
          background-color: rgba(182, 195, 36, 0.05);
        }

        .premium-banner-msg {
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
        }
        
        .premium-banner-error {
          background-color: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Responsive Breakpoints */
        @media (min-width: 640px) {
          .premium-container { padding: 2rem 1.5rem; }
          .premium-banner { height: 180px; }
          .premium-header-content { padding: 0 2.5rem 2.5rem 2.5rem; }
          .premium-avatar-wrapper { margin-top: -75px; }
          .premium-form-grid { grid-template-columns: repeat(2, 1fr); }
          .btn-premium { width: auto; }
          .feed-action-btn { flex: none; justify-content: flex-start; }
        }
      `}</style>

      <main className="premium-container">

        {/* =======================================================
            BACK
        ======================================================== */}
        <div style={{ marginBottom: "1.5rem" }}>
          <button
            type="button"
            className="btn-premium btn-outline"
            onClick={() => navigate(-1)}
          >
            <BackIcon />
            <span>Back</span>
          </button>
        </div>


        {/* =======================================================
            PROFILE HEADER CARD
        ======================================================== */}
        <section className="premium-card">

          <div className="premium-banner"></div>

          <div className="premium-header-content">
            
            {/* PUBLIC USER PROFILE PICTURE */}
            <div className="premium-avatar-wrapper">
              <button
                type="button"
                className={`premium-avatar-btn ${!user.profilePictureUrl ? 'default-cursor' : ''}`}
                onClick={() => {
                  if (user.profilePictureUrl) {
                    setShowAvatarModal(true);
                  }
                }}
                aria-label={user.profilePictureUrl ? "View profile picture full size" : "Profile picture"}
              >
                <UserAvatar
                  name={user.name}
                  profilePictureUrl={user.profilePictureUrl}
                  size="large"
                />
              </button>
            </div>

            <div>
              <h1 style={{ margin: "0.5rem 0", fontSize: "1.85rem", color: "var(--brand-primary)", fontWeight: "800", letterSpacing: "-0.02em" }}>
                {user.name}
              </h1>

              {(user.course || user.batchYear) && (
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "1rem", fontWeight: "500" }}>
                  {[user.course, user.batchYear].filter(Boolean).join(" · ")}
                </p>
              )}

              {currentUser && currentUser.id !== user.id && (
                <div style={{ marginTop: "1.25rem" }}>
                  <button
                    type="button"
                    className="btn-premium btn-primary"
                    onClick={handlePoke}
                    disabled={isPoking}
                    style={{ padding: "10px 24px" }}
                  >
                    {isPoking ? "Poking..." : "Poke"}
                  </button>
                </div>
              )}
            </div>

          </div>
        </section>


        {/* =======================================================
            ABOUT (ACADEMIC DETAILS & BIO)
        ======================================================== */}
        <section className="premium-card" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "1.35rem", margin: "0 0 1.5rem 0", color: "var(--text-main)", fontWeight: "700" }}>
            About
          </h2>

          <div className="premium-form-grid">
            {user.department && (
              <ProfileDetail label="Department" value={user.department} />
            )}

            {user.course && (
              <ProfileDetail label="Course" value={user.course} />
            )}

            {user.batchYear && (
              <ProfileDetail label="Graduation year" value={user.batchYear} />
            )}

            <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}>
              <ProfileDetail 
                label="Bio" 
                value={user.bio || "No bio added yet."} 
                isBio={true}
              />
            </div>
          </div>
        </section>


        {/* =======================================================
            SOCIAL HANDLES (Only visible if linked)
        ======================================================== */}
        {instaProfile && (
          <section className="premium-card" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.35rem", margin: "0 0 1.5rem 0", color: "var(--text-main)", fontWeight: "700" }}>
              Social Handles
            </h2>
            <div className="social-handle-container">
              <div className="social-icon-wrapper insta-bg">
                <InstagramIcon />
              </div>
              <div className="social-content" style={{ justifyContent: 'flex-start', gap: '1.5rem' }}>
                {instaProfile.profilePicUrl && (
                  <img 
                    src={instaProfile.profilePicUrl} 
                    alt="Instagram profile"
                    onClick={() => setShowInstaAvatarModal(true)} 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e5e7eb', cursor: 'pointer' }} 
                  />
                )}
                <div>
                  <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-main)' }}>@{instaProfile.handle}</strong>
                  <a href={`https://instagram.com/${instaProfile.handle}`} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    View on Instagram
                    <ExternalLinkIcon />
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}


        {/* =======================================================
            USER POSTS
        ======================================================== */}
        <section>
          
          <div style={{ marginBottom: "2rem", paddingLeft: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.35rem", margin: 0, color: "var(--text-main)", fontWeight: "700" }}>
                Posts
              </h2>
              <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>
                Shared by {user.name}
              </p>
            </div>
            
            {!postsLoading && (
              <span style={{ background: "rgba(2, 61, 32, 0.08)", color: "var(--brand-primary)", padding: "6px 16px", borderRadius: "30px", fontSize: "0.9rem", fontWeight: "700" }}>
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </span>
            )}
          </div>

          {postsError && (
            <div className="premium-banner-msg premium-banner-error">
              {postsError}
            </div>
          )}

          {postsLoading && (
            <CreativeLoader message="Loading posts..." />
          )}

          {!postsLoading && !postsError && posts.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem 2rem", backgroundColor: "#ffffff", borderRadius: "20px", border: "2px dashed #e5e7eb", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
              <strong style={{ display: "block", color: "var(--brand-primary)", fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                No posts yet
              </strong>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>
                {user.name} hasn't shared any posts yet.
              </p>
            </div>
          )}

          <div>
            {posts.map((post) => {
              /*
               * Prefer the author information returned inside PostResponse.
               * Fall back to the public-profile user because every post 
               * on this page belongs to this user.
               */
              const postAuthor = {
                ...user,
                ...(post.author || {}),
                name: post.author?.name || user.name,
                profilePictureUrl: post.author?.profilePictureUrl ?? user.profilePictureUrl,
              };

              return (
                <article key={post.id} className="premium-post-card">
                  
                  {/* ===========================================
                      POST HEADER
                  ============================================ */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                    
                    <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
                      <UserAvatar
                        name={postAuthor.name}
                        profilePictureUrl={postAuthor.profilePictureUrl}
                        size="medium"
                      />
                      <div>
                        <strong style={{ display: "block", color: "var(--text-main)", lineHeight: 1.2, fontSize: "1.05rem" }}>
                          {postAuthor.name}
                        </strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500" }}>
                          {formatAuthorDetails(postAuthor)}
                        </span>
                      </div>
                    </div>

                    <time dateTime={post.createdAt} style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: "500" }}>
                      {formatPostTime(post.createdAt)}
                    </time>
                  </div>

                  {/* ===========================================
                      POST CONTENT
                  ============================================ */}
                  <p style={{ margin: "0 0 1.25rem 0", color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap", fontSize: "1rem" }}>
                    {post.content}
                  </p>

                  {/* ===========================================
                      POST ACTIONS
                  ============================================ */}
                  <div className="post-action-row">
                    
                    {/* LIKE */}
                    <button
                      type="button"
                      className={`feed-action-btn ${post.likedByMe ? 'liked' : ''}`}
                      disabled={likingPosts.has(post.id)}
                      onClick={() => handleToggleLike(post.id)}
                      aria-pressed={post.likedByMe}
                    >
                      <LikeIcon filled={post.likedByMe} />
                      <span>{post.likedByMe ? "Liked" : "Like"}</span>
                      {post.likeCount > 0 && <span style={{ marginLeft: "4px" }}>{post.likeCount}</span>}
                    </button>

                    {/* COMMENT */}
                    <button
                      type="button"
                      className="feed-action-btn"
                      onClick={() =>
                        setSelectedPost({
                          ...post,
                          author: postAuthor,
                        })
                      }
                    >
                      <CommentIcon />
                      <span>Comment</span>
                      {post.commentCount > 0 && <span style={{ marginLeft: "4px" }}>{post.commentCount}</span>}
                    </button>

                  </div>
                </article>
              );
            })}
          </div>

          {/* =====================================================
              LOAD MORE
          ====================================================== */}
          {!postsLoading && hasMorePosts && posts.length > 0 && (
            <div style={{ textAlign: "center", marginTop: "3rem", marginBottom: "2rem" }}>
              <button
                type="button"
                className="btn-premium btn-outline"
                disabled={loadingMore}
                onClick={handleLoadMore}
                style={{ padding: "12px 30px", border: "2px solid #e5e7eb" }}
              >
                {loadingMore ? "Loading..." : "Load more posts"}
              </button>
            </div>
          )}

          {!postsLoading && !hasMorePosts && posts.length > 0 && (
            <p style={{ textAlign: "center", color: "#9ca3af", marginTop: "3rem", marginBottom: "2rem", fontSize: "0.95rem", fontWeight: "500" }}>
              — You've reached the end —
            </p>
          )}

        </section>

      </main>


      {/* =========================================================
          COMMENT PANEL
      ========================================================== */}
      {selectedPost && (
        <CommentPanel
          post={selectedPost}
          currentUser={currentUser}
          onClose={() => setSelectedPost(null)}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
        />
      )}

      {/* =========================================================
          FULL-SCREEN AVATAR MODAL
      ========================================================== */}
      {showAvatarModal && user?.profilePictureUrl && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(2, 61, 32, 0.95)", zIndex: 9999,
            display: "flex", justifyContent: "center", alignItems: "center", padding: "1.5rem",
            backdropFilter: "blur(8px)"
          }}
          onClick={() => setShowAvatarModal(false)}
        >
          <button
            onClick={() => setShowAvatarModal(false)}
            style={{
              position: "absolute", top: "1.5rem", right: "1.5rem",
              background: "rgba(255,255,255,0.1)", border: "none", color: "white",
              cursor: "pointer", padding: "0.75rem", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            aria-label="Close image"
          >
            <CloseIcon />
          </button>
          
          <img
            src={user.profilePictureUrl}
            alt={`${user.name}'s profile full view`}
            style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {/* =========================================================
          FULL-SCREEN INSTAGRAM AVATAR MODAL
      ========================================================== */}
      {showInstaAvatarModal && instaProfile?.profilePicUrl && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(2, 61, 32, 0.95)", zIndex: 9999,
            display: "flex", justifyContent: "center", alignItems: "center", padding: "1.5rem",
            backdropFilter: "blur(8px)"
          }}
          onClick={() => setShowInstaAvatarModal(false)}
        >
          <button
            onClick={() => setShowInstaAvatarModal(false)}
            style={{
              position: "absolute", top: "1.5rem", right: "1.5rem",
              background: "rgba(255,255,255,0.1)", border: "none", color: "white",
              cursor: "pointer", padding: "0.75rem", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            aria-label="Close image"
          >
            <CloseIcon />
          </button>
          
          <img
            src={instaProfile.profilePicUrl}
            alt={`@${instaProfile.handle}'s Instagram profile full view`}
            style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

    </>
  );
}


// ---------------------------------------------------------------
// PROFILE DETAIL COMPONENT
// ---------------------------------------------------------------

function ProfileDetail({
  label,
  value,
  isBio = false
}) {

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#6b7280", letterSpacing: "0.02em" }}>
        {label}
      </span>
      <span style={{ color: "var(--text-main)", fontSize: "1rem", lineHeight: isBio ? 1.6 : 1.2, fontWeight: "500" }}>
        {value}
      </span>
    </div>
  );

}


// ---------------------------------------------------------------
// AUTHOR DETAILS
// ---------------------------------------------------------------

function formatAuthorDetails(
  author
) {

  return [

    author?.course,

    author?.batchYear,

  ]

    .filter(
      Boolean
    )

    .join(
      " · "
    );

}


// ---------------------------------------------------------------
// POST TIME
// ---------------------------------------------------------------

function formatPostTime(
  createdAt
) {

  if (
    !createdAt
  ) {

    return "";

  }


  const date =
    new Date(
      createdAt
    );


  const seconds =
    Math.floor(

      (
        Date.now() -
        date.getTime()
      ) / 1000

    );


  if (
    seconds < 60
  ) {

    return "Just now";

  }


  const minutes =
    Math.floor(
      seconds / 60
    );


  if (
    minutes < 60
  ) {

    return `${minutes}m`;

  }


  const hours =
    Math.floor(
      minutes / 60
    );


  if (
    hours < 24
  ) {

    return `${hours}h`;

  }


  const days =
    Math.floor(
      hours / 24
    );


  if (
    days < 7
  ) {

    return `${days}d`;

  }


  return date.toLocaleDateString(

    undefined,

    {

      day:
        "numeric",

      month:
        "short",

    }

  );

}


// ---------------------------------------------------------------
// ICONS
// ---------------------------------------------------------------
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style={{ verticalAlign: "middle" }}>
      <path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LikeIcon({
  filled = false,
}) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M7.5 21H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3.5l3.2-6.1c.4-.8 1.4-1.2 2.2-.8c.8.4 1.2 1.3 1 2.2L13 9h5.1c2 0 3.3 1.9 2.7 3.8l-1.5 5.5c-.4 1.6-1.9 2.7-3.5 2.7H7.5Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M20 15a4 4 0 0 1-4 4H9l-5 3v-7a4 4 0 0 1-1-2.7V8a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M18 6L6 18M6 6l12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}