import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import UserAvatar from "../components/UserAvatar";
import CreativeLoader from "../components/CreativeLoader";
import { createComment, getComments, deleteComment } from "../services/postService";

// 👇 IMPORT ONLY SUBSCRIBE
import { subscribe } from "../services/websocketService";

const COMMENT_PAGE_SIZE = 20;
const MAX_COMMENT_LENGTH = 1000;

export default function CommentPanel({
  post,
  currentUser,
  onClose,
}) {
  const navigate = useNavigate();

  // -------------------------------------------------------------
  // COMMENTS STATE
  // -------------------------------------------------------------
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // -------------------------------------------------------------
  // DELETE STATE
  // -------------------------------------------------------------
  const [deletingComments, setDeletingComments] = useState(new Set());

  // -------------------------------------------------------------
  // LOAD COMMENTS
  // -------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      setLoading(true);
      setError("");

      try {
        const result = await getComments(post.id, 0, COMMENT_PAGE_SIZE);

        if (cancelled) {
          return;
        }

        setComments(Array.isArray(result) ? result : []);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(error.message || "Couldn't load comments.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (post?.id) {
      loadComments();
    }

    return () => {
      cancelled = true;
    };
  }, [post?.id]);

  // -------------------------------------------------------------
  // WEBSOCKET INTEGRATION FOR LIVE COMMENTS
  // -------------------------------------------------------------
  useEffect(() => {
    if (!currentUser?.id || !post?.id) return;

    let commentSubscription = null;
    let commentDeleteSubscription = null;

    // 1. Listen for new comments
    commentSubscription = subscribe("/topic/comments", (event) => {
      // Only process comments meant for the currently open post panel
      if (event.postId !== post.id) {
        return;
      }

      const incomingComment = event.comment;

      setComments((currentComments) => {
        // Redundancy check in case of network anomalies
        if (currentComments.some((c) => c.id === incomingComment.id)) {
          return currentComments;
        }

        // Comments are displayed oldest -> newest, so append to the bottom
        return [...currentComments, incomingComment];
      });
    });

    // 2. Listen for deleted comments
    commentDeleteSubscription = subscribe("/topic/comments/delete", (event) => {
      if (event.postId !== post.id) {
        return;
      }

      // Support either event.commentId or event.id based on standard DTO structure
      const deletedCommentId = event.commentId || event.id;

      setComments((currentComments) =>
        currentComments.filter((comment) => comment.id !== deletedCommentId)
      );
    });

    return () => {
      if (commentSubscription) commentSubscription.unsubscribe();
      if (commentDeleteSubscription) commentDeleteSubscription.unsubscribe();
    };
  }, [currentUser?.id, post?.id]);

  // -------------------------------------------------------------
  // ESCAPE KEY
  // -------------------------------------------------------------
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // -------------------------------------------------------------
  // LOCK BACKGROUND SCROLL
  // -------------------------------------------------------------
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // -------------------------------------------------------------
  // CREATE COMMENT
  // -------------------------------------------------------------
  async function handleSubmit(event) {
    event.preventDefault();

    const cleanContent = content.trim();

    if (!cleanContent) {
      return;
    }

    if (cleanContent.length > MAX_COMMENT_LENGTH) {
      setError(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // We rely entirely on the WebSocket /topic/comments to receive the comment.
      await createComment(post.id, cleanContent);
      setContent("");
      
      // Removed manual onCommentAdded callback - WebSocket handles this now!
    } catch (error) {
      setError(error.message || "Couldn't post your comment.");
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------------------------------------
  // DELETE COMMENT
  // -------------------------------------------------------------
  async function handleDeleteComment(commentId) {
    if (deletingComments.has(commentId)) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this comment? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setError("");

    setDeletingComments((current) => {
      const next = new Set(current);
      next.add(commentId);
      return next;
    });

    try {
      /*
       * React only decides whether the Delete button
       * should be visible.
       *
       * Spring Boot performs the actual authorization.
       *
       * Backend allows deletion when:
       * 1. Authenticated user owns the comment
       * OR
       * 2. Authenticated user owns the post.
       */
      await deleteComment(commentId);

      // Removed manual setComments and onCommentDeleted callbacks
      // The WebSocket /topic/comments/delete will handle removing it instantly!
      
    } catch (error) {
      setError(error.message || "Couldn't delete this comment.");
    } finally {
      setDeletingComments((current) => {
        const next = new Set(current);
        next.delete(commentId);
        return next;
      });
    }
  }

  // -------------------------------------------------------------
  // CHECK COMMENT DELETE PERMISSION
  //
  // DELETE BUTTON IS SHOWN WHEN:
  //
  // 1. Logged-in user wrote the comment
  //
  // OR
  //
  // 2. Logged-in user owns the post
  //
  // Backend authorization remains authoritative.
  // -------------------------------------------------------------
  function canDeleteComment(comment) {
    if (!currentUser || !comment) {
      return false;
    }

    const currentUserId = currentUser.id;

    const commentAuthorId = comment.author?.id ?? comment.authorId;

    const postAuthorId = post.author?.id ?? post.authorId;

    const isCommentAuthor =
      currentUserId != null &&
      commentAuthorId != null &&
      String(currentUserId) === String(commentAuthorId);

    const isPostOwner =
      currentUserId != null &&
      postAuthorId != null &&
      String(currentUserId) === String(postAuthorId);

    return isCommentAuthor || isPostOwner;
  }

  // -------------------------------------------------------------
  // OPEN PUBLIC PROFILE
  // -------------------------------------------------------------
  function openProfile(userId) {
    if (!userId) {
      return;
    }

    onClose();

    navigate(`/profile/${userId}`);
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

        .comment-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(2, 61, 32, 0.4);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          animation: fadeInOverlay 0.3s ease-out;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .comment-panel {
          background-color: #ffffff;
          width: 100%;
          max-width: 680px;
          height: 90vh;
          max-height: 800px;
          border-radius: 24px 24px 0 0;
          display: flex;
          flex-direction: column;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          overflow: hidden;
        }

        .comment-panel-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #ffffff;
          z-index: 10;
        }

        .comment-panel-header h2 {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--brand-primary);
          letter-spacing: -0.02em;
        }

        .comment-panel-header span {
          display: block;
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
          margin-top: 2px;
        }

        .comment-close-button {
          background: #f3f4f6;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .comment-close-button:hover {
          background: #e5e7eb;
          color: var(--brand-primary);
          transform: rotate(90deg);
        }

        .comment-post-context {
          padding: 1.25rem 1.5rem;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .comment-post-author {
          display: flex;
          align-items: center;
          gap: 12px;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          text-align: left;
          margin-bottom: 12px;
        }

        .comment-post-author strong {
          display: block;
          color: var(--text-main);
          font-size: 0.95rem;
          line-height: 1.2;
        }

        .comment-post-author span {
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 500;
        }

        .comment-post-context p {
          margin: 0;
          color: #374151;
          font-size: 1rem;
          line-height: 1.5;
          word-break: break-word;
          padding-left: 48px; /* Aligns with avatar text */
        }

        .comment-list {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          background-color: #ffffff;
        }

        .comment-item {
          display: flex;
          gap: 12px;
          animation: fadeIn 0.3s ease-out;
        }

        .comment-avatar-button {
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          flex-shrink: 0;
          height: fit-content;
        }

        .comment-body {
          flex: 1;
          background-color: #f3f4f6;
          padding: 12px 16px;
          border-radius: 4px 18px 18px 18px; /* Chat bubble style */
          min-width: 0; /* Prevents overflow */
        }

        .comment-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .comment-meta-user {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .comment-meta-user button {
          background: transparent;
          border: none;
          padding: 0;
          font-weight: 700;
          color: var(--text-main);
          font-size: 0.9rem;
          cursor: pointer;
        }

        .comment-meta-user button:hover {
          text-decoration: underline;
          color: var(--brand-primary);
        }

        .comment-meta-user time {
          color: #9ca3af;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .comment-delete-button {
          background: transparent;
          border: none;
          padding: 0;
          color: #ef4444;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
        }

        .comment-delete-button:hover:not(:disabled) {
          color: #b91c1c;
          text-decoration: underline;
        }

        .comment-delete-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .comment-body p {
          margin: 0;
          color: #374151;
          font-size: 0.95rem;
          line-height: 1.5;
          word-break: break-word;
          white-space: pre-wrap;
        }

        .comment-empty {
          text-align: center;
          padding: 3rem 1rem;
          margin: auto;
        }

        .comment-empty strong {
          display: block;
          color: var(--text-main);
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .comment-empty p {
          margin: 0;
          color: var(--text-muted);
        }

        .comment-error {
          padding: 12px;
          border-radius: 12px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 0.9rem;
          text-align: center;
          margin: 0 1.5rem 1rem 1.5rem;
        }

        /* Composer */
        .comment-composer {
          padding: 1rem 1.5rem;
          background-color: #ffffff;
          border-top: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .comment-input-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .comment-input-row textarea {
          flex: 1;
          padding: 12px 16px;
          border-radius: 16px;
          border: 1.5px solid #e5e7eb;
          background-color: #f9fafb;
          font-size: 0.95rem;
          color: var(--text-main);
          outline: none;
          resize: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .comment-input-row textarea:focus {
          border-color: var(--brand-primary);
          background-color: #ffffff;
          box-shadow: 0 0 0 4px rgba(2, 61, 32, 0.05);
        }

        .comment-input-row button {
          background-color: var(--brand-primary);
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          border-radius: 30px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          align-self: flex-end; /* Aligns button to bottom of textarea */
        }

        .comment-input-row button:hover:not(:disabled) {
          background-color: var(--brand-primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(2, 61, 32, 0.2);
        }

        .comment-input-row button:disabled {
          background-color: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .comment-character-count {
          display: block;
          text-align: right;
          font-size: 0.8rem;
          color: #9ca3af;
          font-weight: 600;
          margin-top: 8px;
          padding-right: 80px; /* Accounts for button width */
        }

        /* Animations */
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Desktop specific adjustments */
        @media (min-width: 768px) {
          .comment-overlay {
            align-items: center; /* Center vertically on desktop */
          }
          .comment-panel {
            border-radius: 24px;
            height: 85vh;
          }
        }
      `}</style>

      <div
        className="comment-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <aside className="comment-panel" role="dialog" aria-modal="true" aria-label="Comments">
          {/* =====================================================
              HEADER
          ====================================================== */}
          <header className="comment-panel-header">
            <div>
              <h2>Comments</h2>
              <span>
                {post.commentCount || 0}{" "}
                {post.commentCount === 1 ? "comment" : "comments"}
              </span>
            </div>

            <button
              type="button"
              className="comment-close-button"
              onClick={onClose}
              aria-label="Close comments"
            >
              <CloseIcon />
            </button>
          </header>

          {/* =====================================================
              ORIGINAL POST CONTEXT
          ====================================================== */}
          <section className="comment-post-context">
            {post.author && (
              <button
                type="button"
                className="comment-post-author"
                onClick={() => openProfile(post.author.id)}
              >
                <UserAvatar
                  name={post.author.name}
                  profilePictureUrl={post.author.profilePictureUrl}
                  size="small"
                />

                <div>
                  <strong>{post.author.name}</strong>
                  <span>{formatAuthorDetails(post.author)}</span>
                </div>
              </button>
            )}

            <p>{post.content}</p>
          </section>

          {/* =====================================================
              COMMENTS
          ====================================================== */}
          <div className="comment-list">
            {loading && <CreativeLoader message="Loading comments..." />}

            {!loading && error && comments.length === 0 && (
              <p className="comment-error">{error}</p>
            )}

            {!loading && !error && comments.length === 0 && (
              <div className="comment-empty">
                <strong>No comments yet</strong>
                <p>Start the conversation.</p>
              </div>
            )}

            {comments.map((comment) => {
              const canDelete = canDeleteComment(comment);
              const isDeleting = deletingComments.has(comment.id);

              return (
                <article key={comment.id} className="comment-item">
                  {/* =============================================
                      COMMENT AUTHOR AVATAR
                  ============================================== */}
                  <button
                    type="button"
                    className="comment-avatar-button"
                    onClick={() => openProfile(comment.author?.id)}
                    aria-label={`View ${comment.author?.name || "user"}'s profile`}
                  >
                    <UserAvatar
                      name={comment.author?.name}
                      profilePictureUrl={comment.author?.profilePictureUrl}
                      size="small"
                    />
                  </button>

                  {/* =============================================
                      COMMENT BODY
                  ============================================== */}
                  <div className="comment-body">
                    <div className="comment-meta">
                      <div className="comment-meta-user">
                        <button
                          type="button"
                          onClick={() => openProfile(comment.author?.id)}
                        >
                          {comment.author?.name || "Unknown user"}
                        </button>

                        <time dateTime={comment.createdAt}>
                          {formatTime(comment.createdAt)}
                        </time>
                      </div>

                      {/* =========================================
                          DELETE COMMENT

                          Visible when:
                          - Current user owns comment
                          OR
                          - Current user owns post
                      ========================================== */}
                      {canDelete && (
                        <button
                          type="button"
                          className="comment-delete-button"
                          disabled={isDeleting}
                          onClick={() => handleDeleteComment(comment.id)}
                          aria-label="Delete comment"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>

                    <p>{comment.content}</p>
                  </div>
                </article>
              );
            })}
          </div>

          {/* ERROR WHILE COMMENTS ALREADY EXIST */}
          {!loading && error && comments.length > 0 && (
            <p className="comment-error" style={{ marginBottom: "1rem" }}>{error}</p>
          )}

          {/* =====================================================
              COMMENT COMPOSER
          ====================================================== */}
          <form className="comment-composer" onSubmit={handleSubmit}>
            <div className="comment-input-row">
              {/* CURRENT USER AVATAR */}
              <div style={{ paddingTop: "6px" }}>
                <UserAvatar
                  name={currentUser?.name}
                  profilePictureUrl={currentUser?.profilePictureUrl}
                  size="small"
                />
              </div>

              <textarea
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);

                  if (error) {
                    setError("");
                  }
                }}
                placeholder="Write a comment..."
                maxLength={MAX_COMMENT_LENGTH}
                rows="2"
                aria-label="Write a comment"
              />

              <button type="submit" disabled={submitting || !content.trim()}>
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>

            <span className="comment-character-count">
              {content.length}/{MAX_COMMENT_LENGTH}
            </span>
          </form>
        </aside>
      </div>
    </>
  );
}

// ---------------------------------------------------------------
// AUTHOR DETAILS
// ---------------------------------------------------------------
function formatAuthorDetails(author) {
  if (!author) {
    return "";
  }

  return [author.course, author.batchYear].filter(Boolean).join(" · ");
}

// ---------------------------------------------------------------
// COMMENT TIME
// ---------------------------------------------------------------
function formatTime(createdAt) {
  if (!createdAt) {
    return "";
  }

  const date = new Date(createdAt);

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d`;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

// ---------------------------------------------------------------
// CLOSE ICON
// ---------------------------------------------------------------
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}