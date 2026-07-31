import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Button
  from "../components/Button";

import CreativeLoader 
  from "../components/CreativeLoader";

import AppShell
  from "../components/AppShell";

import CommentPanel
  from "../components/CommentPanel";

import UserAvatar
  from "../components/UserAvatar";

import {
  getCurrentUser,
  updateProfile,
  logout,
} from "../services/authService";

import {
  uploadProfilePicture,
  deleteProfilePicture,
} from "../services/userService";

import {
  getMyPosts,
  deletePost,
  updatePost,
  toggleLike,
} from "../services/postService";

// WebSocket Imports
import {
  connectWebSocket,
  disconnectWebSocket,
  subscribe,
} from "../services/websocketService";


const POST_PAGE_SIZE = 10;
const MAX_POST_LENGTH = 2000;
const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;
const ALLOWED_PROFILE_PICTURE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];


export default function Profile() {
  const navigate = useNavigate();

  // -------------------------------------------------------------
  // PROFILE STATE
  // -------------------------------------------------------------

  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // -------------------------------------------------------------
  // PROFILE PICTURE STATE
  // -------------------------------------------------------------

  const fileInputRef = useRef(null);
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  const [profilePictureError, setProfilePictureError] = useState("");
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [deletingProfilePicture, setDeletingProfilePicture] = useState(false);
  
  // AVATAR MODAL STATE
  const [showAvatarModal, setShowAvatarModal] = useState(false);


  // -------------------------------------------------------------
  // MY POSTS STATE
  // -------------------------------------------------------------

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [postsPage, setPostsPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // -------------------------------------------------------------
  // POST EDIT STATE
  // -------------------------------------------------------------

  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [savingPostEdit, setSavingPostEdit] = useState(false);
  const [postEditError, setPostEditError] = useState("");

  // -------------------------------------------------------------
  // LIKE STATE
  // -------------------------------------------------------------

  const [likingPosts, setLikingPosts] = useState(new Set());

  // -------------------------------------------------------------
  // DELETE POST STATE
  // -------------------------------------------------------------

  const [deletingPosts, setDeletingPosts] = useState(new Set());

  // -------------------------------------------------------------
  // COMMENT PANEL STATE
  // -------------------------------------------------------------

  const [selectedPost, setSelectedPost] = useState(null);


  // -------------------------------------------------------------
  // LOAD PROFILE
  // -------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const currentUser = await getCurrentUser();

        if (cancelled) return;

        if (!currentUser.profileCompleted) {
          navigate("/complete-profile", { replace: true });
          return;
        }

        setUser(currentUser);
        fillForm(currentUser);
      } catch {
        if (cancelled) return;
        
        logout();
        navigate("/", {
          replace: true,
          state: { message: "Please log in to continue." },
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [navigate]);


  // -------------------------------------------------------------
  // CLEAN UP LOCAL IMAGE PREVIEW
  // -------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (profilePicturePreview) {
        URL.revokeObjectURL(profilePicturePreview);
      }
    };
  }, [profilePicturePreview]);


  // -------------------------------------------------------------
  // LOAD MY POSTS
  // -------------------------------------------------------------

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadInitialPosts() {
      setPostsLoading(true);
      setPostsError("");

      try {
        const result = await getMyPosts(0, POST_PAGE_SIZE);
        if (cancelled) return;

        const safePosts = Array.isArray(result) ? result : [];
        setPosts(safePosts);
        setPostsPage(0);
        setHasMorePosts(safePosts.length === POST_PAGE_SIZE);
      } catch (error) {
        if (cancelled) return;
        setPostsError(error.message || "Couldn't load your posts.");
      } finally {
        if (!cancelled) setPostsLoading(false);
      }
    }

    loadInitialPosts();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);


  // -------------------------------------------------------------
  // WEBSOCKET INTEGRATION (LIVE UPDATES)
  // -------------------------------------------------------------

  useEffect(() => {
    if (!user?.id) return;

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
  }, [user?.id]);


  // -------------------------------------------------------------
  // COPY USER DATA INTO EDIT FORM
  // -------------------------------------------------------------

  function fillForm(currentUser) {
    setName(currentUser.name || "");
    setDepartment(currentUser.department || "");
    setCourse(currentUser.course || "");
    setBatchYear(currentUser.batchYear?.toString() || "");
    setBio(currentUser.bio || "");
  }


  // -------------------------------------------------------------
  // START PROFILE EDITING
  // -------------------------------------------------------------

  function handleEdit() {
    fillForm(user);
    setError("");
    setSuccess("");
    setEditing(true);
  }


  // -------------------------------------------------------------
  // CANCEL PROFILE EDITING
  // -------------------------------------------------------------

  function handleCancel() {
    fillForm(user);
    setError("");
    setEditing(false);
  }


  // -------------------------------------------------------------
  // SAVE PROFILE
  // -------------------------------------------------------------

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!department.trim()) {
      setError("Department is required.");
      return;
    }
    if (!course.trim()) {
      setError("Course is required.");
      return;
    }

    const year = Number(batchYear);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setError("Enter a valid graduation year.");
      return;
    }

    if (bio.length > 500) {
      setError("Bio cannot exceed 500 characters.");
      return;
    }

    setSaving(true);

    try {
      const updatedUser = await updateProfile({
        name: name.trim(),
        department: department.trim(),
        course: course.trim(),
        batchYear: year,
        bio: bio.trim(),
      });

      setUser(updatedUser);
      fillForm(updatedUser);
      synchronizeUserWithPosts(updatedUser);
      setEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (error) {
      setError(error.message || "Couldn't update your profile.");
    } finally {
      setSaving(false);
    }
  }


  // -------------------------------------------------------------
  // OPEN PROFILE PICTURE PICKER
  // -------------------------------------------------------------

  function handleChooseProfilePicture() {
    if (uploadingProfilePicture || deletingProfilePicture) return;
    setProfilePictureError("");
    fileInputRef.current?.click();
  }


  // -------------------------------------------------------------
  // PROFILE PICTURE SELECTED
  // -------------------------------------------------------------

  function handleProfilePictureSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // Allows selecting the same file again later.

    if (!file) return;

    setProfilePictureError("");
    setSuccess("");

    if (!ALLOWED_PROFILE_PICTURE_TYPES.includes(file.type)) {
      setProfilePictureError("Only JPG, PNG and WebP images are allowed.");
      return;
    }

    if (file.size > MAX_PROFILE_PICTURE_SIZE) {
      setProfilePictureError("Profile picture cannot exceed 5 MB.");
      return;
    }

    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedProfilePicture(file);
    setProfilePicturePreview(previewUrl);
  }


  // -------------------------------------------------------------
  // CANCEL PROFILE PICTURE SELECTION
  // -------------------------------------------------------------

  function handleCancelProfilePicture() {
    if (uploadingProfilePicture) return;
    
    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview);
    }

    setSelectedProfilePicture(null);
    setProfilePicturePreview("");
    setProfilePictureError("");
  }


  // -------------------------------------------------------------
  // SAVE PROFILE PICTURE
  // -------------------------------------------------------------

  async function handleSaveProfilePicture() {
    if (!selectedProfilePicture || uploadingProfilePicture) return;

    setUploadingProfilePicture(true);
    setProfilePictureError("");
    setSuccess("");

    try {
      const updatedUser = await uploadProfilePicture(selectedProfilePicture);
      setUser(updatedUser);
      fillForm(updatedUser);
      synchronizeUserWithPosts(updatedUser);

      if (profilePicturePreview) {
        URL.revokeObjectURL(profilePicturePreview);
      }

      setSelectedProfilePicture(null);
      setProfilePicturePreview("");
      setSuccess("Profile picture updated successfully.");
    } catch (error) {
      setProfilePictureError(error.message || "Couldn't update profile picture.");
    } finally {
      setUploadingProfilePicture(false);
    }
  }


  // -------------------------------------------------------------
  // REMOVE PROFILE PICTURE
  // -------------------------------------------------------------

  async function handleDeleteProfilePicture() {
    if (deletingProfilePicture || uploadingProfilePicture) return;

    const confirmed = window.confirm("Remove your profile picture?");
    if (!confirmed) return;

    setDeletingProfilePicture(true);
    setProfilePictureError("");
    setSuccess("");

    try {
      const updatedUser = await deleteProfilePicture();
      setUser(updatedUser);
      fillForm(updatedUser);
      synchronizeUserWithPosts(updatedUser);
      handleCancelProfilePicture();
      setSuccess("Profile picture removed.");
    } catch (error) {
      setProfilePictureError(error.message || "Couldn't remove profile picture.");
    } finally {
      setDeletingProfilePicture(false);
    }
  }


  // -------------------------------------------------------------
  // SYNCHRONIZE CURRENT USER WITH LOADED POSTS
  // -------------------------------------------------------------

  function synchronizeUserWithPosts(updatedUser) {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        const authorId = post.author?.id;
        if (authorId && authorId !== updatedUser.id) return post;

        return {
          ...post,
          author: {
            ...(post.author || {}),
            id: updatedUser.id,
            name: updatedUser.name,
            department: updatedUser.department,
            course: updatedUser.course,
            batchYear: updatedUser.batchYear,
            profilePictureUrl: updatedUser.profilePictureUrl,
          },
        };
      })
    );

    setSelectedPost((currentPost) => {
      if (!currentPost) return currentPost;
      
      const authorId = currentPost.author?.id;
      if (authorId && authorId !== updatedUser.id) return currentPost;

      return {
        ...currentPost,
        author: {
          ...(currentPost.author || {}),
          id: updatedUser.id,
          name: updatedUser.name,
          department: updatedUser.department,
          course: updatedUser.course,
          batchYear: updatedUser.batchYear,
          profilePictureUrl: updatedUser.profilePictureUrl,
        },
      };
    });
  }


  // -------------------------------------------------------------
  // LOAD MORE POSTS
  // -------------------------------------------------------------

  async function handleLoadMore() {
    if (loadingMore || !hasMorePosts) return;

    const nextPage = postsPage + 1;
    setLoadingMore(true);
    setPostsError("");

    try {
      const result = await getMyPosts(nextPage, POST_PAGE_SIZE);
      const newPosts = Array.isArray(result) ? result : [];

      setPosts((currentPosts) => {
        const existingIds = new Set(currentPosts.map((post) => post.id));
        const uniquePosts = newPosts.filter((post) => !existingIds.has(post.id));
        return [...currentPosts, ...uniquePosts];
      });

      setPostsPage(nextPage);
      if (newPosts.length < POST_PAGE_SIZE) {
        setHasMorePosts(false);
      }
    } catch (error) {
      setPostsError(error.message || "Couldn't load more posts.");
    } finally {
      setLoadingMore(false);
    }
  }


  // -------------------------------------------------------------
  // START POST EDIT
  // -------------------------------------------------------------

  function handleStartPostEdit(post) {
    if (savingPostEdit) return;
    setEditingPostId(post.id);
    setEditPostContent(post.content || "");
    setPostEditError("");
  }


  // -------------------------------------------------------------
  // CANCEL POST EDIT
  // -------------------------------------------------------------

  function handleCancelPostEdit() {
    if (savingPostEdit) return;
    setEditingPostId(null);
    setEditPostContent("");
    setPostEditError("");
  }


  // -------------------------------------------------------------
  // SAVE POST EDIT
  // -------------------------------------------------------------

  async function handleSavePostEdit(postId) {
    const cleanContent = editPostContent.trim();

    if (!cleanContent) {
      setPostEditError("Post cannot be empty.");
      return;
    }

    if (cleanContent.length > MAX_POST_LENGTH) {
      setPostEditError(`Post cannot exceed ${MAX_POST_LENGTH} characters.`);
      return;
    }

    if (savingPostEdit) return;

    setSavingPostEdit(true);
    setPostEditError("");

    try {
      const updatedPost = await updatePost(postId, cleanContent);

      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            ...(updatedPost || {}),
            content: updatedPost?.content ?? cleanContent,
          };
        })
      );

      setSelectedPost((currentPost) => {
        if (!currentPost || currentPost.id !== postId) return currentPost;
        return {
          ...currentPost,
          ...(updatedPost || {}),
          content: updatedPost?.content ?? cleanContent,
        };
      });

      setEditingPostId(null);
      setEditPostContent("");
      setPostEditError("");
    } catch (error) {
      setPostEditError(error.message || "Couldn't update this post.");
    } finally {
      setSavingPostEdit(false);
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
          return {
            ...post,
            likeCount: result.likeCount,
            likedByMe: result.likedByMe,
          };
        })
      );

      setSelectedPost((currentPost) => {
        if (!currentPost || currentPost.id !== postId) return currentPost;
        return {
          ...currentPost,
          likeCount: result.likeCount,
          likedByMe: result.likedByMe,
        };
      });
    } catch (error) {
      setPostsError(error.message || "Couldn't update like.");
    } finally {
      setLikingPosts((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
    }
  }


  // -------------------------------------------------------------
  // COMMENT ADDED
  // -------------------------------------------------------------

  function handleCommentAdded(postId) {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          commentCount: (post.commentCount || 0) + 1,
        };
      })
    );

    setSelectedPost((currentPost) => {
      if (!currentPost || currentPost.id !== postId) return currentPost;
      return {
        ...currentPost,
        commentCount: (currentPost.commentCount || 0) + 1,
      };
    });
  }


  // -------------------------------------------------------------
  // COMMENT DELETED
  // -------------------------------------------------------------

  function handleCommentDeleted(postId) {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          commentCount: Math.max((post.commentCount || 0) - 1, 0),
        };
      })
    );

    setSelectedPost((currentPost) => {
      if (!currentPost || currentPost.id !== postId) return currentPost;
      return {
        ...currentPost,
        commentCount: Math.max((currentPost.commentCount || 0) - 1, 0),
      };
    });
  }


  // -------------------------------------------------------------
  // DELETE POST
  // -------------------------------------------------------------

  async function handleDeletePost(postId) {
    const confirmed = window.confirm("Delete this post? This action cannot be undone.");
    if (!confirmed) return;
    if (deletingPosts.has(postId)) return;

    setPostsError("");
    setDeletingPosts((current) => {
      const next = new Set(current);
      next.add(postId);
      return next;
    });

    try {
      await deletePost(postId);
      
      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
      setSelectedPost((currentPost) => (currentPost?.id === postId ? null : currentPost));

      if (editingPostId === postId) {
        setEditingPostId(null);
        setEditPostContent("");
        setPostEditError("");
      }
    } catch (error) {
      setPostsError(error.message || "Couldn't delete the post.");
    } finally {
      setDeletingPosts((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
    }
  }


  // -------------------------------------------------------------
  // LOGOUT
  // -------------------------------------------------------------

  function handleLogout() {
    logout();
    navigate("/", {
      replace: true,
      state: { message: "You have been logged out." },
    });
  }


  // -------------------------------------------------------------
  // LOADING
  // -------------------------------------------------------------

  if (loading) {
    return (
      
        <main className="profile-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CreativeLoader message="Loading profile..." />
        </main>
    
    );
  }

  if (!user) return null;

  // -------------------------------------------------------------
  // PROFILE UI
  // -------------------------------------------------------------

  const displayedAvatarUrl = profilePicturePreview || user.profilePictureUrl;

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

        .premium-avatar-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.25rem;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
        }

        /* Buttons */
        .btn-premium {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 30px; /* Pill shape for premium feel */
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

        .btn-accent {
          background-color: var(--brand-accent);
          color: var(--brand-primary);
          box-shadow: 0 4px 12px rgba(182, 195, 36, 0.25);
        }
        
        .btn-accent:hover:not(:disabled) {
          background-color: var(--brand-accent-hover);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background-color: #f3f4f6;
          color: #374151;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background-color: #e5e7eb;
        }

        .btn-danger {
          background-color: #fef2f2;
          color: #ef4444;
        }
        
        .btn-danger:hover:not(:disabled) {
          background-color: #fee2e2;
        }
        
        .btn-outline {
          border: 1px solid #e5e7eb;
          background-color: #ffffff;
          color: var(--text-main);
          border-radius: 12px;
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

        .mini-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background-color: transparent;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .mini-icon-btn:hover:not(:disabled) {
          background-color: #f3f4f6;
          color: var(--brand-primary);
        }

        /* Forms & Inputs */
        .premium-form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        
        .premium-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .premium-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #4b5563;
          letter-spacing: 0.02em;
        }

        .premium-input {
          padding: 14px 16px;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          background-color: #f9fafb;
          font-size: 1rem;
          color: var(--text-main);
          outline: none;
          transition: all 0.2s ease;
          width: 100%;
          box-sizing: border-box;
        }
        
        .premium-input:focus {
          border-color: var(--brand-primary);
          background-color: #ffffff;
          box-shadow: 0 0 0 4px rgba(2, 61, 32, 0.05);
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

        /* Notifications / Banners */
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
        
        .premium-banner-success {
          background-color: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
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
          .profile-header-actions { flex-direction: row; }
          .feed-action-btn { flex: none; justify-content: flex-start; }
        }
      `}</style>

      <main className="premium-container">
        
        {/* =====================================================
            HERO / PROFILE HEADER CARD
        ====================================================== */}
        <section className="premium-card">
          <div className="premium-banner"></div>
          
          <div className="premium-header-content">
            
            {/* AVATAR UPLOAD & DISPLAY AREA */}
            <div className="premium-avatar-wrapper">
              <button
                type="button"
                className={`premium-avatar-btn ${!displayedAvatarUrl ? 'default-cursor' : ''}`}
                onClick={() => {
                  if (displayedAvatarUrl) setShowAvatarModal(true);
                }}
                aria-label={displayedAvatarUrl ? "View profile picture full size" : "Profile picture"}
              >
                <UserAvatar
                  name={user.name}
                  profilePictureUrl={displayedAvatarUrl}
                  size="large"
                />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleProfilePictureSelected}
                hidden
              />

              {/* PROFILE PIC ACTION BUTTONS */}
              <div className="premium-avatar-actions">
                {!selectedProfilePicture && (
                  <button
                    type="button"
                    onClick={handleChooseProfilePicture}
                    disabled={uploadingProfilePicture || deletingProfilePicture}
                    className="btn-premium btn-secondary"
                  >
                    <CameraIcon />
                    {user.profilePictureUrl ? "Change photo" : "Add photo"}
                  </button>
                )}

                {!selectedProfilePicture && user.profilePictureUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteProfilePicture}
                    disabled={uploadingProfilePicture || deletingProfilePicture}
                    className="btn-premium btn-danger"
                  >
                    <TrashIcon />
                    {deletingProfilePicture ? "Removing..." : "Remove"}
                  </button>
                )}

                {selectedProfilePicture && (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveProfilePicture}
                      disabled={uploadingProfilePicture}
                      className="btn-premium btn-primary"
                    >
                      {uploadingProfilePicture ? "Uploading..." : "Save photo"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelProfilePicture}
                      disabled={uploadingProfilePicture}
                      className="btn-premium btn-secondary"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            <div>
              <h1 style={{ margin: "0.5rem 0", fontSize: "1.85rem", color: "var(--brand-primary)", fontWeight: "800", letterSpacing: "-0.02em" }}>
                {user.name}
              </h1>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "1rem", fontWeight: "500" }}>
                {[user.course, user.batchYear].filter(Boolean).join(" · ")}
              </p>
            </div>
            
          </div>
        </section>

        {/* FEEDBACK BANNERS */}
        {profilePictureError && (
          <div className="premium-banner-msg premium-banner-error">
            {profilePictureError}
          </div>
        )}
        {error && (
          <div className="premium-banner-msg premium-banner-error">
            {error}
          </div>
        )}
        {success && (
          <div className="premium-banner-msg premium-banner-success">
            {success}
          </div>
        )}


        {/* =====================================================
            PROFILE DETAILS / EDIT FORM
        ====================================================== */}
        
        <section className="premium-card" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={{ fontSize: "1.35rem", margin: 0, color: "var(--text-main)", fontWeight: "700" }}>About Me</h2>
            
            {!editing && (
              <div style={{ display: "flex", gap: "0.75rem", width: "100%", justifyContent: "flex-end" }} className="profile-header-actions">
                <button type="button" onClick={handleEdit} className="btn-premium btn-outline" style={{ flex: 1, padding: "8px 16px" }}>
                  <EditIcon /> <span>Edit</span>
                </button>
                <button type="button" onClick={handleLogout} className="btn-premium btn-outline" style={{ color: "#ef4444", flex: 1, padding: "8px 16px" }}>
                  <LogOutIcon /> <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            <div className="premium-form-grid">
              <ProfileDetail label="Email" value={user.email} />
              <ProfileDetail label="Department" value={user.department} />
              <ProfileDetail label="Course" value={user.course} />
              <ProfileDetail label="Graduation year" value={user.batchYear} />
              <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}>
                <ProfileDetail label="Bio" value={user.bio || "No bio yet."} isBio />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="premium-form-grid">
                <label className="premium-input-group">
                  <span className="premium-label">Name</span>
                  <input className="premium-input" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="premium-input-group">
                  <span className="premium-label">Department</span>
                  <input className="premium-input" value={department} onChange={(e) => setDepartment(e.target.value)} />
                </label>
                <label className="premium-input-group">
                  <span className="premium-label">Course</span>
                  <input className="premium-input" value={course} onChange={(e) => setCourse(e.target.value)} />
                </label>
                <label className="premium-input-group">
                  <span className="premium-label">Graduation year</span>
                  <input className="premium-input" type="number" inputMode="numeric" value={batchYear} onChange={(e) => setBatchYear(e.target.value)} />
                </label>
              </div>

              <label className="premium-input-group">
                <span className="premium-label">Bio</span>
                <textarea 
                  className="premium-input"
                  style={{ resize: "vertical" }} 
                  rows={4} 
                  maxLength={500} 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                />
                <small style={{ alignSelf: "flex-end", color: "#9ca3af", marginTop: "6px", fontWeight: "500" }}>
                  {bio.length}/500
                </small>
              </label>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <button type="submit" disabled={saving} className="btn-premium btn-primary" style={{ flex: 2 }}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button type="button" onClick={handleCancel} disabled={saving} className="btn-premium btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>


        {/* =====================================================
            MY POSTS
        ====================================================== */}
        
        <section>
          <div style={{ marginBottom: "2rem", paddingLeft: "0.5rem" }}>
            <h2 style={{ fontSize: "1.35rem", margin: 0, color: "var(--text-main)", fontWeight: "700" }}>My Posts</h2>
            <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>Posts you've shared with your community.</p>
          </div>

          {postsError && (
             <div className="premium-banner-msg premium-banner-error">
               {postsError}
             </div>
          )}
          {postsLoading && <CreativeLoader message="Loading posts..." />}
          
          {!postsLoading && posts.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem 2rem", backgroundColor: "#ffffff", borderRadius: "20px", border: "2px dashed #e5e7eb", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
              <strong style={{ display: "block", color: "var(--brand-primary)", fontSize: "1.2rem", marginBottom: "0.5rem" }}>No posts yet</strong>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>Your posts will appear here after you publish them.</p>
            </div>
          )}

          <div>
            {posts.map((post) => {
              const isEditingPost = editingPostId === post.id;
              const postAuthor = post.author || user;

              return (
                <article key={post.id} className="premium-post-card">
                  
                  {/* POST HEADER */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                    
                    <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
                      <UserAvatar
                        name={postAuthor.name || user.name}
                        profilePictureUrl={postAuthor.profilePictureUrl ?? user.profilePictureUrl}
                        size="medium"
                      />
                      <div>
                        <strong style={{ display: "block", color: "var(--text-main)", lineHeight: 1.2, fontSize: "1.05rem" }}>
                          {postAuthor.name || user.name}
                        </strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500" }}>
                          {formatAuthorDetails(postAuthor)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <time dateTime={post.createdAt} style={{ fontSize: "0.85rem", color: "#9ca3af", marginRight: "0.5rem", fontWeight: "500" }}>
                        {formatPostTime(post.createdAt)}
                      </time>

                      {!isEditingPost && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartPostEdit(post)}
                            disabled={savingPostEdit || editingPostId !== null}
                            className="mini-icon-btn"
                            title="Edit Post"
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            disabled={deletingPosts.has(post.id) || isEditingPost}
                            className="mini-icon-btn"
                            style={{ color: "#ef4444" }}
                            title="Delete Post"
                          >
                            {deletingPosts.has(post.id) ? "..." : <TrashIcon />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>


                  {/* POST CONTENT / EDITOR */}
                  {isEditingPost ? (
                    <div style={{ marginTop: "1rem" }}>
                      <textarea
                        className="premium-input"
                        style={{ resize: "vertical", minHeight: "120px" }}
                        rows={3}
                        maxLength={MAX_POST_LENGTH}
                        value={editPostContent}
                        onChange={(event) => setEditPostContent(event.target.value)}
                        autoFocus
                        aria-label="Edit post"
                      />
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                        <small style={{ color: "#9ca3af", fontWeight: "500" }}>
                          {editPostContent.length} / {MAX_POST_LENGTH}
                        </small>
                        
                        <div style={{ display: "flex", gap: "0.75rem", width: "100%", justifyContent: "flex-end" }} className="profile-header-actions">
                          <button
                            type="button"
                            disabled={savingPostEdit}
                            onClick={handleCancelPostEdit}
                            className="btn-premium btn-secondary"
                            style={{ flex: 1 }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={savingPostEdit || !editPostContent.trim()}
                            onClick={() => handleSavePostEdit(post.id)}
                            className="btn-premium btn-primary"
                            style={{ flex: 1 }}
                          >
                            {savingPostEdit ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                      {postEditError && (
                         <div className="premium-banner-msg premium-banner-error" style={{ marginTop: "1rem", marginBottom: 0 }}>
                           {postEditError}
                         </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ margin: "0 0 1.25rem 0", color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap", fontSize: "1rem" }}>
                      {post.content}
                    </p>
                  )}

                  {/* POST ACTIONS */}
                  {!isEditingPost && (
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
                        {post.likeCount > 0 && <span>{post.likeCount}</span>}
                      </button>

                      <button
                        type="button"
                        className="feed-action-btn"
                        onClick={() => setSelectedPost(post)}
                      >
                        <CommentIcon />
                        <span>Comment</span>
                        {post.commentCount > 0 && <span>{post.commentCount}</span>}
                      </button>
                    </div>
                  )}

                </article>
              );
            })}
          </div>

          {!postsLoading && hasMorePosts && posts.length > 0 && (
            <div style={{ textAlign: "center", marginTop: "3rem", marginBottom: "2rem" }}>
              <button
                type="button"
                disabled={loadingMore}
                onClick={handleLoadMore}
                className="btn-premium btn-outline"
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
          currentUser={user}
          onClose={() => setSelectedPost(null)}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
        />
      )}

      {/* =========================================================
          FULL-SCREEN AVATAR MODAL
      ========================================================== */}
      {showAvatarModal && displayedAvatarUrl && (
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
            src={displayedAvatarUrl}
            alt={`${user.name}'s profile full view`}
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

function ProfileDetail({ label, value, isBio = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#6b7280", letterSpacing: "0.02em" }}>{label}</span>
      <span style={{ color: "var(--text-main)", fontSize: "1rem", lineHeight: isBio ? 1.6 : 1.2, fontWeight: "500" }}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------
// UTILITIES
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  );
}