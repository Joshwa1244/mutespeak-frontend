import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
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
    setIsComposerExpanded(true); // Auto-expand if they trigger file select from compact view
  }

  function handleCancelImage() {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview("");
  }

  function handleCancelComposer() {
    setIsComposerExpanded(false);
    setContent("");
    handleCancelImage();
    setPostError("");
  }

  // -------------------------------------------------------------
  // CREATE POST
  // -------------------------------------------------------------
  async function handleCreatePost(event) {
    event.preventDefault();

    const cleanContent = content.trim();

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
      handleCancelImage();
      setIsComposerExpanded(false);
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
          --text-main: #111827;
          --text-muted: #6b7280;
          
          --space-1: 4px;
          --space-2: 8px;
          --space-3: 12px;
          --space-4: 16px;
          --space-5: 24px;
          
          --radius-sm: 10px;
          --radius-md: 14px;
          --radius-pill: 30px;
          
          --hairline: 0.5px solid #e5e7eb;
        }

        .premium-container {
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          animation: fadeIn 0.4s ease-out forwards;
        }

        .premium-card {
          background-color: #ffffff;
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0,0,0,0.04);
        }

        .btn-premium {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-pill);
          border: none;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-primary {
          background-color: var(--brand-primary);
          color: #ffffff;
        }
        .btn-primary:hover:not(:disabled) { background-color: var(--brand-primary-hover); }
        .btn-secondary { background-color: #f3f4f6; color: #374151; }
        .btn-secondary:hover:not(:disabled) { background-color: #e5e7eb; }
        .btn-premium:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Composer Styles */
        .composer-wrapper {
          border-bottom: var(--hairline);
          padding: var(--space-4);
          background: #ffffff;
        }

        .composer-collapsed {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          cursor: text;
        }

        .composer-pill {
          flex: 1;
          height: 40px;
          border-radius: var(--radius-pill);
          background-color: #f9fafb;
          border: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          padding: 0 16px;
          color: var(--text-muted);
          font-size: 0.95rem;
          transition: background-color 0.2s;
        }
        .composer-pill:hover { background-color: #f3f4f6; }

        .premium-input {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 1rem;
          color: var(--text-main);
          outline: none;
          resize: none;
          font-family: inherit;
        }

        /* Post Item Styles (Edge-to-Edge) */
        .feed-post {
          border-bottom: var(--hairline);
          padding: var(--space-4) 0 var(--space-3) 0;
          background-color: #ffffff;
        }
        
        .feed-post-header, .feed-post-content, .feed-post-actions {
          padding: 0 var(--space-4);
        }

        .feed-post-image {
          margin: var(--space-3) 0;
          width: 100%;
          cursor: zoom-in;
          background: #f9fafb;
        }
        
        .feed-post-image img {
          width: 100%;
          max-height: 600px;
          object-fit: cover;
          display: block;
        }

        /* Action Cluster */
        .action-cluster {
          display: flex;
          align-items: center;
          gap: var(--space-5);
          margin-top: var(--space-2);
        }

        .feed-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          padding: 4px 0;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
        }
        .feed-action-btn:hover:not(:disabled) { color: var(--brand-primary); }
        .feed-action-btn.liked { color: var(--brand-accent); }

        .premium-badge-container {
          position: sticky;
          top: var(--space-2);
          z-index: 50;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }

        .premium-badge-btn {
          pointer-events: auto;
          background-color: var(--brand-accent);
          color: var(--brand-primary);
          padding: 8px 20px;
          border-radius: var(--radius-pill);
          font-weight: 700;
          font-size: 0.9rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border: none;
          cursor: pointer;
        }

        .premium-banner-msg {
          padding: var(--space-3);
          border-radius: var(--radius-md);
          font-size: 0.9rem;
          margin-bottom: var(--space-3);
        }
        .premium-banner-error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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
              <div className="premium-container">
                
                {/* NEW POSTS BADGE */}
                {pendingPosts.length > 0 && (
                  <div className="premium-badge-container">
                    <button type="button" className="premium-badge-btn" onClick={handleRevealNewPosts}>
                      ↑ {pendingPosts.length} New
                    </button>
                  </div>
                )}

                {/* COMPOSER ROW */}
                <div className="composer-wrapper">
                  {!isComposerExpanded ? (
                    <div className="composer-collapsed" onClick={() => setIsComposerExpanded(true)}>
                      <UserAvatar name={user.name} profilePictureUrl={user.profilePictureUrl} size="small" />
                      <div className="composer-pill">Share something with your community...</div>
                      <button 
                        type="button" 
                        style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', padding: '4px' }}
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      >
                        <ImageIcon size={22} />
                      </button>
                    </div>
                  ) : (
                    <form className="premium-card" style={{ padding: "var(--space-3)" }} onSubmit={handleCreatePost}>
                      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
                        <div style={{ flexShrink: 0 }}>
                          <UserAvatar name={user.name} profilePictureUrl={user.profilePictureUrl} size="small" />
                        </div>
                        <textarea
                          className="premium-input"
                          style={{ minHeight: "80px", paddingTop: "6px" }}
                          value={content}
                          onChange={(event) => setContent(event.target.value)}
                          placeholder="What's on your mind?"
                          maxLength={MAX_POST_LENGTH}
                          rows="3"
                          autoFocus
                        />
                      </div>

                      {imagePreview && (
                        <div style={{ margin: "0 0 var(--space-3) 44px", position: "relative", display: "inline-block" }}>
                          <img 
                            src={imagePreview} 
                            alt="Upload preview" 
                            style={{ borderRadius: "var(--radius-sm)", maxHeight: "200px", maxWidth: "100%", objectFit: "cover", border: "1px solid #e5e7eb" }} 
                          />
                          <button 
                            type="button" 
                            onClick={handleCancelImage} 
                            disabled={posting}
                            style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >
                            <CloseIcon size={14} />
                          </button>
                        </div>
                      )}

                      {postError && (
                        <div className="premium-banner-msg premium-banner-error" style={{ marginLeft: "44px" }}>
                          {postError}
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginLeft: "44px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                          <button 
                            type="button" 
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={posting}
                          >
                            <ImageIcon size={20} />
                          </button>
                          <small style={{ color: "#9ca3af", fontWeight: "500", fontSize: "0.85rem" }}>
                            {content.length}/{MAX_POST_LENGTH}
                          </small>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" className="btn-premium btn-secondary" onClick={handleCancelComposer} disabled={posting}>
                            Cancel
                          </button>
                          <button type="submit" className="btn-premium btn-primary" disabled={posting || (!content.trim() && !selectedImage)}>
                            {posting ? "Posting..." : "Post"}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                  <input type="file" accept="image/jpeg, image/png, image/webp" hidden ref={fileInputRef} onChange={handleImageSelected} />
                </div>

                {/* FEED */}
                <div>
                  {feedLoading && posts.length === 0 && !isInitialSessionLoad && (
                    <div style={{ padding: "2rem 0" }}><CreativeLoader message="Loading posts..." /></div>
                  )}

                  {posts.map((post, index) => {
                    const isLastPost = index === posts.length - 1;
                    return (
                      <article key={post.id} className="feed-post" ref={isLastPost ? lastPostRef : null}>

                        {/* POST HEADER */}
                        <div className="feed-post-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <button
                            type="button"
                            onClick={() => navigate(`/profile/${post.author.id}`)}
                            style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", display: "flex", gap: "10px", alignItems: "center" }}
                          >
                            <UserAvatar name={post.author.name} profilePictureUrl={post.author.profilePictureUrl} size="small" />
                            <div>
                              <strong style={{ display: "block", color: "var(--text-main)", lineHeight: 1.2, fontSize: "0.95rem" }}>{post.author.name}</strong>
                              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{formatAuthorDetails(post.author)}</span>
                            </div>
                          </button>
                          <time dateTime={post.createdAt} style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "2px" }}>{formatPostTime(post.createdAt)}</time>
                        </div>

                        {/* POST CONTENT */}
                        <div className="feed-post-content">
                          <p style={{ margin: "0 0 10px 0", color: "#111827", lineHeight: 1.5, whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>
                            {post.content}
                          </p>
                        </div>

                        {/* POST IMAGE (FULL BLEED) */}
                        {post.imageUrl && (
                          <div className="feed-post-image" onClick={() => setFullScreenImage(post.imageUrl)}>
                            <img src={post.imageUrl} alt="Post attachment" loading="lazy" />
                          </div>
                        )}

                        {/* POST ACTIONS */}
                        <div className="feed-post-actions">
                          <div className="action-cluster">
                            <button
                              type="button"
                              className={`feed-action-btn ${post.likedByMe ? 'liked' : ''}`}
                              disabled={likingPosts.has(post.id)}
                              onClick={() => handleToggleLike(post.id)}
                            >
                              <LikeIcon filled={post.likedByMe} />
                              {post.likeCount > 0 && <span>{post.likeCount}</span>}
                            </button>

                            <button type="button" className="feed-action-btn" onClick={() => setSelectedPost(post)}>
                              <CommentIcon />
                              {post.commentCount > 0 && <span>{post.commentCount}</span>}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {loadingMore && (
                    <div style={{ padding: "2rem 0" }}><CreativeLoader message="Loading more posts..." /></div>
                  )}

                  {feedError && (
                    <div style={{ padding: "1rem" }}><div className="premium-banner-msg premium-banner-error">{feedError}</div></div>
                  )}

                  {!feedLoading && !feedError && posts.length === 0 && (
                    <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
                      <strong style={{ display: "block", color: "var(--text-main)", fontSize: "1.1rem" }}>No posts yet</strong>
                      <p style={{ color: "var(--text-muted)", margin: "4px 0 0 0", fontSize: "0.9rem" }}>Be the first to start the conversation.</p>
                    </div>
                  )}
                </div>
              </div>

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
                  style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.9)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}
                  onClick={() => setFullScreenImage(null)}
                >
                  <button
                    onClick={() => setFullScreenImage(null)}
                    style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.1)", border: "none", color: "white", cursor: "pointer", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <CloseIcon size={24} />
                  </button>
                  <img
                    src={fullScreenImage}
                    alt="Post view full size"
                    style={{ maxWidth: "100%", maxHeight: "100vh", objectFit: "contain" }}
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
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M7.5 21H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3.5l3.2-6.1c.4-.8 1.4-1.2 2.2-.8c.8.4 1.2 1.3 1 2.2L13 9h5.1c2 0 3.3 1.9 2.7 3.8l-1.5 5.5c-.4 1.6-1.9 2.7-3.5 2.7H7.5Z" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M20 15a4 4 0 0 1-4 4H9l-5 3v-7a4 4 0 0 1-1-2.7V8a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ImageIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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