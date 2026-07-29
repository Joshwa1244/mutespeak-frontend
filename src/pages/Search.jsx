import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import AppShell
  from "../components/AppShell";

import UserAvatar
  from "../components/UserAvatar";

import CommentPanel 
  from "../components/CommentPanel";

import {
  searchUsers,
} from "../services/userService";

import { 
  getCurrentUser 
} from "../services/authService";

import CreativeLoader from "../components/CreativeLoader";
import { 
  getTrendingPosts, 
  toggleLike 
} from "../services/postService";

import {
  connectWebSocket,
  disconnectWebSocket,
  subscribe,
} from "../services/websocketService";


export default function Search() {

  const navigate =
    useNavigate();

  // -------------------------------------------------------------
  // USER STATE
  // -------------------------------------------------------------
  
  const [user, setUser] = 
    useState(null);

  // -------------------------------------------------------------
  // SEARCH STATE
  // -------------------------------------------------------------

  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    hasSearched,
    setHasSearched,
  ] = useState(false);


  // -------------------------------------------------------------
  // TRENDING / LEADERBOARD STATE
  // -------------------------------------------------------------

  const [trendingPosts, setTrendingPosts] = 
    useState([]);
    
  const [trendingLoading, setTrendingLoading] = 
    useState(true);
    
  const [trendingError, setTrendingError] = 
    useState("");

  const [likingPosts, setLikingPosts] = 
    useState(new Set());

  const [selectedPost, setSelectedPost] = 
    useState(null);

  const refreshTimerRef = useRef(null);


  // -------------------------------------------------------------
  // FETCH CURRENT USER
  // -------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (!cancelled) setUser(currentUser);
      } catch (err) {
        console.error("Could not load current user for search interactives.");
      }
    }

    loadUser();
    return () => { cancelled = true; };
  }, []);

  // -------------------------------------------------------------
  // FETCH TRENDING POSTS LOGIC
  // -------------------------------------------------------------
  
  const fetchTrending = useCallback(async (isSilent = false) => {
    if (!isSilent) setTrendingLoading(true);
    if (!isSilent) setTrendingError("");

    try {
      const result = await getTrendingPosts();
      const posts = Array.isArray(result) ? result.slice(0, 7) : [];
      setTrendingPosts(posts);
    } catch (err) {
      if (!isSilent) {
        setTrendingError(err.message || "Couldn't load Trending posts.");
      }
    } finally {
      if (!isSilent) setTrendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending(false);
  }, [fetchTrending]);


  // -------------------------------------------------------------
  // SEARCH WITH DEBOUNCE
  // -------------------------------------------------------------

  useEffect(() => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setResults([]);
      setError("");
      setLoading(false);
      setHasSearched(false);
      return;
    }

    let cancelled = false;

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const users = await searchUsers(cleanQuery);
        if (cancelled) return;
        setResults(Array.isArray(users) ? users : []);
        setHasSearched(true);
      } catch (error) {
        if (cancelled) return;
        setResults([]);
        setHasSearched(true);
        setError(error.message || "Couldn't search users.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);


  // -------------------------------------------------------------
  // TRUE LEADERBOARD: LIVE WEBSOCKET INTEGRATION
  // -------------------------------------------------------------

  useEffect(() => {
    if (!user?.id) return;

    let postUpdateSubscription = null;
    let postDeleteSubscription = null;
    let likeSubscription = null;
    let commentSubscription = null;
    let commentDeleteSubscription = null;

    const debouncedBackgroundRefresh = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        fetchTrending(true); 
      }, 1500); 
    };

    connectWebSocket(() => {
      postUpdateSubscription = subscribe("/topic/feed/update", (event) => {
        const updatedPost = event.post || event;
        setTrendingPosts((current) => current.map((p) => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
        debouncedBackgroundRefresh();
      });

      postDeleteSubscription = subscribe("/topic/feed/delete", (event) => {
        const deletedId = event.postId || event.id;
        setTrendingPosts((current) => current.filter((p) => p.id !== deletedId));
        debouncedBackgroundRefresh();
      });

      likeSubscription = subscribe("/topic/likes", (event) => {
        setTrendingPosts((current) => current.map((p) => p.id === event.postId ? { ...p, likeCount: event.likeCount } : p));
        debouncedBackgroundRefresh();
      });

      commentSubscription = subscribe("/topic/comments", (event) => {
        setTrendingPosts((current) => current.map((p) => p.id === event.postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
        debouncedBackgroundRefresh();
      });

      commentDeleteSubscription = subscribe("/topic/comments/delete", (event) => {
        setTrendingPosts((current) => current.map((p) => p.id === event.postId ? { ...p, commentCount: Math.max((p.commentCount || 0) - 1, 0) } : p));
        debouncedBackgroundRefresh();
      });
    });

    return () => {
      if (postUpdateSubscription) postUpdateSubscription.unsubscribe();
      if (postDeleteSubscription) postDeleteSubscription.unsubscribe();
      if (likeSubscription) likeSubscription.unsubscribe();
      if (commentSubscription) commentSubscription.unsubscribe();
      if (commentDeleteSubscription) commentDeleteSubscription.unsubscribe();
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      disconnectWebSocket();
    };
  }, [user?.id, fetchTrending]);


  // -------------------------------------------------------------
  // OPEN PUBLIC PROFILE
  // -------------------------------------------------------------

  function openProfile(userId) {
    if (!userId) return;
    navigate(`/profile/${userId}`);
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
      setTrendingPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            likeCount: result.likeCount,
            likedByMe: result.likedByMe,
          };
        })
      );
    } catch (err) {
      console.error("Couldn't update like:", err);
    } finally {
      setLikingPosts((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
    }
  }


  // -------------------------------------------------------------
  // LIVE RANKING / SORTING
  // -------------------------------------------------------------
  
  const rankedTrendingPosts = useMemo(() => {
    return [...trendingPosts].sort((a, b) => {
      const engagementA = (a.likeCount || 0) + (a.commentCount || 0);
      const engagementB = (b.likeCount || 0) + (b.commentCount || 0);
      
      if (engagementB !== engagementA) return engagementB - engagementA;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [trendingPosts]);

  // -------------------------------------------------------------
  // HELPER FOR POST MEDAL STYLES
  // -------------------------------------------------------------
  
  function getMedalStyles(index) {
    if (index === 0) {
      return { 
        border: "2px solid #D4AF37", 
        backgroundColor: "rgba(212, 175, 55, 0.02)", 
        boxShadow: "0 8px 24px rgba(212, 175, 55, 0.15)" 
      };
    }
    if (index === 1) {
      return { 
        border: "2px solid #C0C0C0", 
        backgroundColor: "rgba(192, 192, 192, 0.02)", 
        boxShadow: "0 8px 24px rgba(192, 192, 192, 0.15)" 
      };
    }
    if (index === 2) {
      return { 
        border: "2px solid #CD7F32", 
        backgroundColor: "rgba(205, 127, 50, 0.02)", 
        boxShadow: "0 8px 24px rgba(205, 127, 50, 0.15)" 
      };
    }
    return {}; // No special styles for posts 4-7
  }


  // -------------------------------------------------------------
  // UI
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

        /* Inputs & Search Wrapper */
        .search-box-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .search-icon-wrapper {
          position: absolute;
          left: 18px;
          color: #9ca3af;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .premium-input {
          padding: 16px 16px 16px 48px;
          border-radius: 20px;
          border: 1.5px solid #e5e7eb;
          background-color: #ffffff;
          font-size: 1.05rem;
          color: var(--text-main);
          outline: none;
          transition: all 0.2s ease;
          width: 100%;
          box-sizing: border-box;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
          font-family: inherit;
        }
        
        .premium-input:focus {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 4px rgba(2, 61, 32, 0.05), 0 4px 15px rgba(0, 0, 0, 0.03);
        }

        /* Dropdown Overlay */
        .search-dropdown-overlay {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 0.5rem;
          background-color: #ffffff;
          border: 1px solid rgba(0,0,0,0.03);
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
          max-height: 60vh;
          overflow-y: auto;
        }

        .user-result {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          width: 100%;
          border: none;
          border-bottom: 1px solid #f3f4f6;
          background: transparent;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s;
        }

        .user-result:last-child {
          border-bottom: none;
        }

        .user-result:hover {
          background: #f9fafb;
        }

        .user-result-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .user-result-info strong {
          color: var(--text-main);
          font-size: 1.05rem;
        }

        .user-result-info span {
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 500;
        }

        .user-result-department {
          color: var(--brand-primary) !important;
          font-weight: 600 !important;
        }

        /* Post Styles */
        .premium-post-card {
          background-color: #ffffff;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0,0,0,0.02);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
          width: 100%;
          box-sizing: border-box;
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
          .feed-action-btn { flex: none; justify-content: flex-start; }
        }
      `}</style>

      <section className="premium-container">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}
        <header style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "2.25rem", fontWeight: "800", color: "var(--brand-primary)", letterSpacing: "-0.02em", margin: "0 0 0.5rem 0" }}>
            Search
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", margin: 0, fontWeight: "500" }}>
            Find students across your college community.
          </p>
        </header>

        {/* =====================================================
            SEARCH INPUT & OVERLAY DROPDOWN
        ====================================================== */}
        <div style={{ position: "relative", zIndex: 50 }}>
          
          {/* SEARCH INPUT */}
          <div className="search-box-wrapper">
            <div className="search-icon-wrapper">
              <SearchIcon />
            </div>
            <input
              className="premium-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name"
              aria-label="Search students"
              autoComplete="off"
            />
          </div>

          {/* ABSOLUTE OVERLAY RESULTS */}
          {query.trim() && (
            <div className="search-dropdown-overlay">
              {loading && <p style={{ padding: "1.5rem", color: "var(--text-muted)", textAlign: "center", fontWeight: "500", margin: 0 }}>Searching...</p>}
              
              {error && (
                <div style={{ padding: "1rem" }}>
                  <p className="premium-banner-msg premium-banner-error" style={{ margin: 0 }}>{error}</p>
                </div>
              )}

              {!loading && !error && results.length > 0 && (
                <div>
                  {results.map((resultUser) => (
                    <button
                      key={resultUser.id}
                      type="button"
                      className="user-result"
                      onClick={() => openProfile(resultUser.id)}
                    >
                      <UserAvatar
                        name={resultUser.name}
                        profilePictureUrl={resultUser.profilePictureUrl}
                        size="medium"
                      />
                      <div className="user-result-info">
                        <strong>{resultUser.name}</strong>
                        <span>
                          {[resultUser.course, resultUser.batchYear].filter(Boolean).join(" · ")}
                        </span>
                        {resultUser.department && (
                          <span className="user-result-department">{resultUser.department}</span>
                        )}
                      </div>
                      <div style={{ color: "#d1d5db" }}>
                        <ChevronIcon />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!loading && !error && hasSearched && results.length === 0 && (
                <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
                  <strong style={{ display: "block", color: "var(--brand-primary)", fontSize: "1.1rem", marginBottom: "0.5rem" }}>No students found</strong>
                  <p style={{ color: "var(--text-muted)", margin: 0 }}>Try another name or check the spelling.</p>
                </div>
              )}
            </div>
          )}
        </div>


        {/* =====================================================
            TRENDING LEADERBOARD
        ====================================================== */}
        <div style={{ marginTop: "3.5rem" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1.5rem", paddingLeft: "0.5rem" }}>
            Trending Leaderboard
          </h2>

          {trendingLoading && (
            <CreativeLoader message="Loading Leaderboard..." />
          )}

          {trendingError && (
            <div className="premium-banner-msg premium-banner-error">
              {trendingError}
            </div>
          )}

          {!trendingLoading && !trendingError && rankedTrendingPosts.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem 2rem", backgroundColor: "#ffffff", borderRadius: "20px", border: "2px dashed #e5e7eb" }}>
              <p style={{ color: "var(--text-muted)", margin: 0, fontWeight: "500" }}>No trending posts right now.</p>
            </div>
          )}

          {rankedTrendingPosts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {rankedTrendingPosts.map((post, index) => (
                <div 
                  key={post.id} 
                  style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}
                >
                  
                  {/* RANK INDICATOR */}
                  <div 
                    style={{ 
                      fontSize: index < 3 ? "1.5rem" : "1.25rem", 
                      fontWeight: "800", 
                      color: 
                        index === 0 ? "#D4AF37" : // Gold
                        index === 1 ? "#C0C0C0" : // Silver
                        index === 2 ? "#CD7F32" : // Bronze
                        "var(--text-muted)",
                      textShadow: index < 3 ? "0px 2px 4px rgba(0,0,0,0.15)" : "none",
                      minWidth: "2.5rem",
                      textAlign: "right",
                      paddingTop: "1.1rem" 
                    }}
                  >
                    #{index + 1}
                  </div>

                  {/* FEED POST - WITH MEDAL STYLING */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <article 
                      className="premium-post-card" 
                      style={getMedalStyles(index)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                        <button
                          type="button"
                          onClick={() => openProfile(post.author.id)}
                          style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", display: "flex", gap: "0.85rem", alignItems: "center" }}
                        >
                          <UserAvatar
                            name={post.author.name}
                            profilePictureUrl={post.author.profilePictureUrl}
                            size="medium"
                          />
                          <div>
                            <strong style={{ display: "block", color: "var(--text-main)", lineHeight: 1.2, fontSize: "1.05rem" }}>{post.author.name}</strong>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500" }}>{formatAuthorDetails(post.author)}</span>
                          </div>
                        </button>
                        <time dateTime={post.createdAt} style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: "500" }}>
                          {formatPostTime(post.createdAt)}
                        </time>
                      </div>

                      <p style={{ margin: "0 0 1.25rem 0", color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap", fontSize: "1.05rem" }}>
                        {post.content}
                      </p>

                      <div className="post-action-row">
                        <button
                          type="button"
                          className={`feed-action-btn ${post.likedByMe ? "liked" : ""}`}
                          disabled={likingPosts.has(post.id) || !user}
                          onClick={() => handleToggleLike(post.id)}
                          aria-pressed={post.likedByMe}
                        >
                          <LikeIcon filled={post.likedByMe} />
                          <span>{post.likedByMe ? "Liked" : "Like"}</span>
                          {post.likeCount > 0 && <span style={{ marginLeft: "4px" }}>{post.likeCount}</span>}
                        </button>

                        <button
                          type="button"
                          className="feed-action-btn"
                          onClick={() => { if (user) setSelectedPost(post); }}
                        >
                          <CommentIcon />
                          <span>Comment</span>
                          {post.commentCount > 0 && <span style={{ marginLeft: "4px" }}>{post.commentCount}</span>}
                        </button>
                      </div>
                    </article>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          COMMENT PANEL MODAL
      ========================================================== */}
      {selectedPost && (
        <CommentPanel
          post={selectedPost}
          currentUser={user}
          onClose={() => setSelectedPost(null)}
          // Real-time updates are handled by WebSocket subscriptions, 
          // but optimistic updates can be passed here if required by the CommentPanel
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------
// HELPER FUNCTIONS 
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

// ---------------------------------------------------------------
// ICONS
// ---------------------------------------------------------------

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m15.5 15.5 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LikeIcon({ filled = false }) {
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