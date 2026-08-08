import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell";
import CommentPanel from "../components/CommentPanel";
import UserAvatar from "../components/UserAvatar";

import { getCurrentUser, logout } from "../services/authService";
import { createPost, createImagePost, getFeed, toggleLike } from "../services/postService";

import CreativeLoader from "../components/CreativeLoader";
import SplashLoader from "../components/SplashLoader";
import {
  connectWebSocket,
  disconnectWebSocket,
  subscribe,
} from "../services/websocketService";

const PAGE_SIZE = 10;
const MAX_POST_LENGTH = 2000;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function Home() {
  const navigate = useNavigate();
  const observerRef = useRef(null);
  const fileInputRef = useRef(null);

  // -------------------------------------------------------------
  // USER / AUTH STATE
  // -------------------------------------------------------------
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // -------------------------------------------------------------
  // POST COMPOSER STATE
  // -------------------------------------------------------------
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  // -------------------------------------------------------------
  // FEED STATE
  // -------------------------------------------------------------
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [feedLoading, setFeedLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [hasMore, setHasMore] = useState(true);

  // -------------------------------------------------------------
  // LIKE STATE
  // -------------------------------------------------------------
  const [likingPosts, setLikingPosts] = useState(new Set());

  // -------------------------------------------------------------
  // COMMENT PANEL & MODAL STATE
  // -------------------------------------------------------------
  const [selectedPost, setSelectedPost] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  // -------------------------------------------------------------
  // PENDING POSTS QUEUE (PREVENTS LAYOUT SHIFT)
  // -------------------------------------------------------------
  const [pendingPosts, setPendingPosts] = useState([]);

  // -------------------------------------------------------------
  // SPLASH SCREEN SESSION STATE
  // -------------------------------------------------------------
  const [isInitialSessionLoad] = useState(() => {
    return sessionStorage.getItem("mutespeak_splash_shown") !== "true";
  });

  const isLoadingData = authLoading || feedLoading;

  useEffect(() => {
    if (isInitialSessionLoad && !isLoadingData) {
      sessionStorage.setItem("mutespeak_splash_shown", "true");
    }
  }, [isInitialSessionLoad, isLoadingData]);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function handleRevealNewPosts() {
    setPosts((currentPosts) => {
      const existingIds = new Set(currentPosts.map((p) => p.id));
      const uniquePending = pendingPosts.filter((p) => !existingIds.has(p.id));
      return [...uniquePending, ...currentPosts];
    });
    setPendingPosts([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY < 50 && pendingPosts.length > 0) {
        setPosts((currentPosts) => {
          const existingIds = new Set(currentPosts.map((p) => p.id));
          const uniquePending = pendingPosts.filter((p) => !existingIds.has(p.id));
          return [...uniquePending, ...currentPosts];
        });
        setPendingPosts([]);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pendingPosts]);

  // -------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const currentUser = await getCurrentUser();
        if (cancelled) return;
        if (!currentUser.profileCompleted) {
          navigate("/complete-profile", { replace: true });
          return;
        }
        setUser(currentUser);
      } catch {
        if (cancelled) return;
        logout();
        sessionStorage.removeItem("mutespeak_splash_shown");
        navigate("/", {
          replace: true,
          state: { message: "Please log in to continue." },
        });
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }
    loadCurrentUser();
    return () => { cancelled = true; };
  }, [navigate]);

  // -------------------------------------------------------------
  // INITIAL FEED
  // -------------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadInitialFeed() {
      setFeedLoading(true);
      setFeedError("");

      try {
        const result = await getFeed(0, PAGE_SIZE);
        if (cancelled) return;
        const initialPosts = Array.isArray(result) ? result : [];
        setPosts(initialPosts);
        setPage(0);
        setHasMore(initialPosts.length === PAGE_SIZE);
      } catch (error) {
        if (!cancelled) setFeedError(error.message || "Couldn't load posts.");
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    }

    loadInitialFeed();
    return () => { cancelled = true; };
  }, [user?.id]);

  // -------------------------------------------------------------
  // WEBSOCKET INTEGRATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (!user?.id) return;

    let postSubscription = null;
    let postUpdateSubscription = null;
    let postDeleteSubscription = null;
    let likeSubscription = null;
    let commentSubscription = null;
    let commentDeleteSubscription = null;

    connectWebSocket(() => {
      postSubscription = subscribe("/topic/feed", (event) => {
        const incomingPost = event.post || event;
        if (window.scrollY > 200) {
          setPendingPosts((currentPending) => {
            if (currentPending.some((p) => p.id === incomingPost.id)) return currentPending;
            return [incomingPost, ...currentPending];
          });
        } else {
          setPosts((currentPosts) => {
            if (currentPosts.some((p) => p.id === incomingPost.id)) return currentPosts;
            return [incomingPost, ...currentPosts];
          });
        }
      });

      postUpdateSubscription = subscribe("/topic/feed/update", (event) => {
        const updatedPost = event.post || event;
        setPosts((currentPosts) =>
          currentPosts.map((post) => post.id === updatedPost.id ? { ...post, ...updatedPost } : post)
        );
        setPendingPosts((currentPending) =>
          currentPending.map((post) => post.id === updatedPost.id ? { ...post, ...updatedPost } : post)
        );
        setSelectedPost((currentPost) => {
          if (currentPost && currentPost.id === updatedPost.id) return { ...currentPost, ...updatedPost };
          return currentPost;
        });
      });

      postDeleteSubscription = subscribe("/topic/feed/delete", (event) => {
        const deletedPostId = event.postId || event.id;
        setPosts((currentPosts) => currentPosts.filter((post) => post.id !== deletedPostId));
        setPendingPosts((currentPending) => currentPending.filter((post) => post.id !== deletedPostId));
        setSelectedPost((currentPost) => {
          if (currentPost && currentPost.id === deletedPostId) return null;
          return currentPost;
        });
      });

      likeSubscription = subscribe("/topic/likes", (event) => {
        setPosts((currentPosts) =>
          currentPosts.map((post) => post.id === event.postId ? { ...post, likeCount: event.likeCount } : post)
        );
        setSelectedPost((currentPost) => {
          if (!currentPost || currentPost.id !== event.postId) return currentPost;
          return { ...currentPost, likeCount: event.likeCount };
        });
      });

      commentSubscription = subscribe("/topic/comments", (event) => {
        setPosts((currentPosts) =>
          currentPosts.map((post) => post.id === event.postId ? { ...post, commentCount: (post.commentCount || 0) + 1 } : post)
        );
        setSelectedPost((currentPost) => {
          if (!currentPost || currentPost.id !== event.postId) return currentPost;
          return { ...currentPost, commentCount: (currentPost.commentCount || 0) + 1 };
        });
      });

      commentDeleteSubscription = subscribe("/topic/comments/delete", (event) => {
        setPosts((currentPosts) =>
          currentPosts.map((post) => post.id === event.postId ? { ...post, commentCount: Math.max((post.commentCount || 0) - 1, 0) } : post)
        );
        setSelectedPost((currentPost) => {
          if (!currentPost || currentPost.id !== event.postId) return currentPost;
          return { ...currentPost, commentCount: Math.max((currentPost.commentCount || 0) - 1, 0) };
        });
      });
    });

    return () => {
      if (postSubscription) postSubscription.unsubscribe();
      if (postUpdateSubscription) postUpdateSubscription.unsubscribe();
      if (postDeleteSubscription) postDeleteSubscription.unsubscribe();
      if (likeSubscription) likeSubscription.unsubscribe();
      if (commentSubscription) commentSubscription.unsubscribe();
      if (commentDeleteSubscription) commentDeleteSubscription.unsubscribe();
      disconnectWebSocket();
    };
  }, [user?.id]);

  // -------------------------------------------------------------
  // LOAD MORE POSTS
  // -------------------------------------------------------------
  const loadMorePosts = useCallback(async () => {
    if (feedLoading || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    setFeedError("");

    try {
      const result = await getFeed(nextPage, PAGE_SIZE);
      const newPosts = Array.isArray(result) ? result : [];
      setPosts((currentPosts) => {
        const existingIds = new Set(currentPosts.map((post) => post.id));
        const uniquePosts = newPosts.filter((post) => !existingIds.has(post.id));
        return [...currentPosts, ...uniquePosts];
      });
      setPage(nextPage);
      if (newPosts.length < PAGE_SIZE) setHasMore(false);
    } catch (error) {
      setFeedError(error.message || "Couldn't load more posts.");
    } finally {
      setLoadingMore(false);
    }
  }, [feedLoading, loadingMore, hasMore, page]);

  const lastPostRef = useCallback((node) => {
      if (feedLoading || loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) loadMorePosts();
        },
        { rootMargin: "300px 0px", threshold: 0 }
      );

      if (node) observerRef.current.observe(node);
    }, [feedLoading, loadingMore, hasMore, loadMorePosts]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  // -------------------------------------------------------------
  // COMPOSER IMAGE HANDLING
  // -------------------------------------------------------------
  function handleImageSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; 
    
    if (!file) return;
    setPostError("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setPostError("Only JPG, PNG and WebP images are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setPostError("Image cannot exceed 5 MB.");
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleCancelImage() {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview("");
  }

  // -------------------------------------------------------------
  // CREATE POST
  // -------------------------------------------------------------
  async function handleCreatePost(event) {
    event.preventDefault();

    const cleanContent = content.trim();

    // Ensure content is provided to match original constraints
    if (!cleanContent) {
      setPostError("Please write something to share.");
      return;
    }
    if (cleanContent.length > MAX_POST_LENGTH) {
      setPostError(`Post cannot exceed ${MAX_POST_LENGTH} characters.`);
      return;
    }

    setPosting(true);
    setPostError("");

    try {
      if (selectedImage) {
        await createImagePost(cleanContent, selectedImage);
      } else {
        await createPost(cleanContent);
      }
      setContent("");
      handleCancelImage(); // Clean up image state perfectly
    } catch (error) {
      setPostError(error.message || "Couldn't publish your post.");
    } finally {
      setPosting(false);
    }
  }

  // -------------------------------------------------------------
  // TOGGLE LIKE
  // -------------------------------------------------------------
  async function handleToggleLike(postId) {
    if (likingPosts.has(postId)) return;

    setLikingPosts((current) => {
      const next = new Set(current);
      next.add(postId);
      return next;
    });

    try {
      const result = await toggleLike(postId);

      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (post.id !== postId) return post;
          return { ...post, likeCount: result.likeCount, likedByMe: result.likedByMe };
        })
      );

      setSelectedPost((currentPost) => {
        if (!currentPost || currentPost.id !== postId) return currentPost;
        return { ...currentPost, likeCount: result.likeCount, likedByMe: result.likedByMe };
      });
    } catch (error) {
      console.error("Couldn't update like:", error);
    } finally {
      setLikingPosts((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
    }
  }

  if (!authLoading && !user) return null;

  return (
    <>
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

        .premium-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          animation: fadeIn 0.4s ease-out forwards;
        }

        .premium-card {
          background-color: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px var(--brand-shadow);
          border: 1px solid rgba(0,0,0,0.03);
          margin-bottom: 2rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .btn-premium {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 30px;
          border: none;
          font-size: 0.95rem;
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

        .btn-premium:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .premium-input {
          padding: 14px 16px;
          border-radius: 16px;
          border: 1.5px solid #e5e7eb;
          background-color: #f9fafb;
          font-size: 1rem;
          color: var(--text-main);
          outline: none;
          transition: all 0.2s ease;
          width: 100%;
          box-sizing: border-box;
          font-family: inherit;
        }
        
        .premium-input:focus {
          border-color: var(--brand-primary);
          background-color: #ffffff;
          box-shadow: 0 0 0 4px rgba(2, 61, 32, 0.05);
        }

        .premium-badge-container {
          position: sticky;
          top: 1rem;
          z-index: 50;
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .premium-badge-btn {
          background-color: var(--brand-accent);
          color: var(--brand-primary);
          padding: 10px 24px;
          border-radius: 30px;
          font-weight: 700;
          font-size: 0.95rem;
          box-shadow: 0 4px 15px rgba(182, 195, 36, 0.3);
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .premium-badge-btn:hover {
          transform: translateY(-2px);
          background-color: var(--brand-accent-hover);
          box-shadow: 0 6px 20px rgba(182, 195, 36, 0.4);
        }

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
          font-size: 0.95rem;
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

        .mini-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border-radius: 20px;
          border: none;
          background-color: #f9fafb;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mini-action-btn:hover:not(:disabled) {
          background-color: rgba(2, 61, 32, 0.05);
          color: var(--brand-primary);
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

        @media (min-width: 640px) {
          .premium-container { padding: 2rem 1.5rem; }
          .feed-action-btn { flex: none; justify-content: flex-start; }
        }
      `}</style>

      {isInitialSessionLoad && <SplashLoader isLoading={isLoadingData} />}

      <div style={{ visibility: isInitialSessionLoad && isLoadingData ? "hidden" : "visible" }}>
        
          {!isInitialSessionLoad && authLoading ? (
            <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CreativeLoader message="Authenticating..." />
            </div>
          ) : user ? (
            <>
              <section className="premium-container">
                
                {/* NEW POSTS BADGE */}
                {pendingPosts.length > 0 && (
                  <div className="premium-badge-container">
                    <button
                      type="button"
                      className="premium-badge-btn"
                      onClick={handleRevealNewPosts}
                    >
                      ↑ {pendingPosts.length} New {pendingPosts.length === 1 ? "Post" : "Posts"}
                    </button>
                  </div>
                )}

                {/* POST COMPOSER */}
                <form className="premium-card" style={{ padding: "1.5rem" }} onSubmit={handleCreatePost}>
                  
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div style={{ flexShrink: 0 }}>
                      <UserAvatar name={user.name} profilePictureUrl={user.profilePictureUrl} size="medium" />
                    </div>

                    <textarea
                      className="premium-input"
                      style={{ resize: "vertical", minHeight: "80px" }}
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      placeholder="Share something with your community"
                      maxLength={MAX_POST_LENGTH}
                      rows="3"
                      aria-label="Create a post"
                    />
                  </div>

                  {/* IMAGE PREVIEW AREA */}
                  {imagePreview && (
                    <div style={{ margin: "0 0 1rem 3.5rem", position: "relative", display: "inline-block" }}>
                      <img 
                        src={imagePreview} 
                        alt="Upload preview" 
                        style={{ borderRadius: "12px", maxHeight: "200px", maxWidth: "100%", objectFit: "cover", border: "1px solid #e5e7eb" }} 
                      />
                      <button 
                        type="button" 
                        onClick={handleCancelImage} 
                        disabled={posting}
                        style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      >
                        <CloseIcon size={16} />
                      </button>
                    </div>
                  )}

                  {postError && (
                    <div className="premium-banner-msg premium-banner-error" style={{ marginBottom: "1rem" }}>
                      {postError}
                    </div>
                  )}

                  {/* COMPOSER ACTIONS */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f3f4f6", paddingTop: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      
                      <button 
                        type="button" 
                        className="mini-action-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={posting}
                      >
                        <ImageIcon />
                        <span style={{ marginLeft: "4px" }}>Image</span>
                      </button>
                      <input 
                        type="file" 
                        accept="image/jpeg, image/png, image/webp" 
                        hidden 
                        ref={fileInputRef} 
                        onChange={handleImageSelected} 
                      />

                      <small style={{ color: "#9ca3af", fontWeight: "600", fontSize: "0.85rem" }}>
                        {content.length}/{MAX_POST_LENGTH}
                      </small>
                    </div>

                    <button
                      type="submit"
                      className="btn-premium btn-primary"
                      disabled={posting || !content.trim()}
                    >
                      {posting ? "Posting..." : "Post"}
                    </button>
                  </div>
                </form>

                {/* FEED */}
                <div>
                  {feedLoading && posts.length === 0 && !isInitialSessionLoad && (
                    <div style={{ padding: "2rem 0" }}><CreativeLoader message="Loading posts..." /></div>
                  )}

                  {posts.map((post, index) => {
                    const isLastPost = index === posts.length - 1;
                    return (
                      <article key={post.id} className="premium-post-card" ref={isLastPost ? lastPostRef : null}>

                        {/* POST HEADER */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                          <button
                            type="button"
                            onClick={() => navigate(`/profile/${post.author.id}`)}
                            style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", display: "flex", gap: "0.85rem", alignItems: "center" }}
                          >
                            <UserAvatar name={post.author.name} profilePictureUrl={post.author.profilePictureUrl} size="medium" />
                            <div>
                              <strong style={{ display: "block", color: "var(--text-main)", lineHeight: 1.2, fontSize: "1.05rem" }}>{post.author.name}</strong>
                              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500" }}>{formatAuthorDetails(post.author)}</span>
                            </div>
                          </button>
                          <time dateTime={post.createdAt} style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: "500" }}>{formatPostTime(post.createdAt)}</time>
                        </div>

                        {/* POST CONTENT */}
                        <p style={{ margin: "0 0 1.25rem 0", color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap", fontSize: "1.05rem" }}>
                          {post.content}
                        </p>

                        {/* POST IMAGE */}
                        {post.imageUrl && (
                          <div 
                            style={{ margin: "0 0 1.25rem 0", borderRadius: "16px", overflow: "hidden", cursor: "zoom-in", border: "1px solid rgba(0,0,0,0.04)" }} 
                            onClick={() => setFullScreenImage(post.imageUrl)}
                          >
                            <img 
                              src={post.imageUrl} 
                              alt="Post attachment" 
                              loading="lazy"
                              style={{ width: "100%", maxHeight: "500px", objectFit: "cover", display: "block" }} 
                            />
                          </div>
                        )}

                        {/* POST ACTIONS */}
                        <div className="post-action-row">
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

                          <button type="button" className="feed-action-btn" onClick={() => setSelectedPost(post)}>
                            <CommentIcon />
                            <span>Comment</span>
                            {post.commentCount > 0 && <span style={{ marginLeft: "4px" }}>{post.commentCount}</span>}
                          </button>
                        </div>
                      </article>
                    );
                  })}

                  {loadingMore && (
                    <div style={{ textAlign: "center", padding: "2rem 0" }}><CreativeLoader message="Loading more posts..." /></div>
                  )}

                  {feedError && (
                    <div className="premium-banner-msg premium-banner-error">{feedError}</div>
                  )}

                  {!feedLoading && !feedError && posts.length === 0 && (
                    <div style={{ textAlign: "center", padding: "4rem 2rem", backgroundColor: "#ffffff", borderRadius: "20px", border: "2px dashed #e5e7eb", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
                      <strong style={{ display: "block", color: "var(--brand-primary)", fontSize: "1.2rem", marginBottom: "0.5rem" }}>No posts yet</strong>
                      <p style={{ color: "var(--text-muted)", margin: 0 }}>Be the first person to start the conversation.</p>
                    </div>
                  )}

                  {!feedLoading && !loadingMore && !hasMore && posts.length > 0 && (
                    <p style={{ textAlign: "center", color: "#9ca3af", marginTop: "3rem", marginBottom: "2rem", fontSize: "0.95rem", fontWeight: "500" }}>
                      — You've reached the end —
                    </p>
                  )}
                </div>
              </section>

              {/* COMMENT PANEL */}
              {selectedPost && (
                <CommentPanel
                  post={selectedPost}
                  currentUser={user}
                  onClose={() => setSelectedPost(null)}
                />
              )}

              {/* FULL-SCREEN IMAGE MODAL */}
              {fullScreenImage && (
                <div
                  style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(2, 61, 32, 0.95)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "1.5rem", backdropFilter: "blur(8px)" }}
                  onClick={() => setFullScreenImage(null)}
                >
                  <button
                    onClick={() => setFullScreenImage(null)}
                    style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "rgba(255,255,255,0.1)", border: "none", color: "white", cursor: "pointer", padding: "0.75rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    aria-label="Close image"
                  >
                    <CloseIcon size={24} />
                  </button>
                  <img
                    src={fullScreenImage}
                    alt="Post view full size"
                    style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}
                    onClick={(e) => e.stopPropagation()} 
                  />
                </div>
              )}
            </>
          ) : null}
        
      </div>
    </>
  );
}

// ---------------------------------------------------------------
// UTILITIES & ICONS
// ---------------------------------------------------------------
function formatAuthorDetails(author) {
  return [author?.course, author?.batchYear].filter(Boolean).join(" · ");
}

function formatPostTime(createdAt) {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function LikeIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M7.5 21H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3.5l3.2-6.1c.4-.8 1.4-1.2 2.2-.8c.8.4 1.2 1.3 1 2.2L13 9h5.1c2 0 3.3 1.9 2.7 3.8l-1.5 5.5c-.4 1.6-1.9 2.7-3.5 2.7H7.5Z" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M20 15a4 4 0 0 1-4 4H9l-5 3v-7a4 4 0 0 1-1-2.7V8a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function CloseIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}