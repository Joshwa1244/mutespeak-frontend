import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNews } from "../services/newsService";
import "./News.css";

export default function News() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Controls the 2-second cinematic intro
  const [showIntro, setShowIntro] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Unmount the intro screen exactly after the CSS animation finishes (2.2s)
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fetch data concurrently while the intro plays
    getNews()
      .then((sortedData) => {
        setItems(sortedData);
      })
      .catch((err) => {
        console.error("News fetch error:", err);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // -------------------------------------------------------------
  // 1. CINEMATIC INTRO SCREEN
  // -------------------------------------------------------------
  if (showIntro) {
    return (
      <div className="news-intro-overlay">
        <div className="news-intro-paper">
          <span className="news-intro-subtitle">Campus Announcements</span>
          <h1 className="news-intro-title">The Campus Paper</h1>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. THEMATIC PRINTING PRESS LOADING STATE
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="news-page">
        <div className="news-loading-container">
          <div className="news-press-loader">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <p className="news-loading-text">Setting the type &amp; pressing the daily edition...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. MAIN NEWSPAPER CONTENT
  // -------------------------------------------------------------
  return (
    <div className="news-page">
      <div className="news-content-wrapper">
        
        <button 
          className="news-back-button" 
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>

        <header className="news-masthead">
          <h1>THE Campus Paper</h1>
          <p className="news-dateline">Campus Announcements, Reprinted Daily</p>
        </header>

        {items.length === 0 && (
          <p className="news-body news-body--empty" style={{ textAlign: "center" }}>
            No announcements available today.
          </p>
        )}

        {items.map((item) => (
          <article key={item.id} className="news-article">
            <h2>{item.title}</h2>
            {item.bodyText ? (
              <p className="news-body">{item.bodyText}</p>
            ) : (
              <p className="news-body news-body--empty">
                Full notice available in the original PDF.
              </p>
            )}
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="news-source"
            >
              View original notice →
            </a>
          </article>
        ))}

      </div>
    </div>
  );
}