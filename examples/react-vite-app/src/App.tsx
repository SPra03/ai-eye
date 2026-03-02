import { useState } from 'react';
import './App.css';

function App() {
  const [activeFeature, setActiveFeature] = useState('colors');

  return (
    <div className="app">
      {/* Global Apple Nav */}
      <nav className="globalnav" aria-label="Global">
        <div className="globalnav-inner">
          <div className="globalnav-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 14 18" fill="currentColor">
              <path d="M13.07 10.41a4.04 4.04 0 0 1 .77-2.38 4.15 4.15 0 0 1 .53-.56c-.55-.65-1.35-1.04-2.13-1.1-.9-.1-1.78.54-2.24.54-.47 0-1.18-.53-1.95-.51a2.87 2.87 0 0 0-2.42 1.48c-1.04 1.79-.26 4.43.73 5.89.5.71 1.08 1.51 1.85 1.48.75-.03 1.03-.48 1.93-.48.9 0 1.16.48 1.94.46.8-.01 1.3-.72 1.78-1.44.36-.51.63-1.08.8-1.68a3.64 3.64 0 0 1-1.59-3.2ZM11.56 5.3a3.32 3.32 0 0 0 .78-2.38 3.38 3.38 0 0 0-2.19 1.13 3.17 3.17 0 0 0-.8 2.3c.86.06 1.69-.4 2.21-1.05Z" transform="translate(-3.5, -2.5)" />
            </svg>
          </div>
          <ul className="globalnav-links">
            <li><a href="#">Store</a></li>
            <li><a href="#">Mac</a></li>
            <li><a href="#">iPad</a></li>
            <li><a href="#">iPhone</a></li>
            <li><a href="#">Watch</a></li>
            <li><a href="#">Vision</a></li>
            <li><a href="#">AirPods</a></li>
            <li><a href="#">TV &amp; Home</a></li>
            <li><a href="#">Entertainment</a></li>
            <li><a href="#">Accessories</a></li>
            <li><a href="#">Support</a></li>
          </ul>
          <div className="globalnav-actions">
            <button className="globalnav-icon" aria-label="Search">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="6" cy="6" r="5" />
                <line x1="10" y1="10" x2="14" y2="14" />
              </svg>
            </button>
            <button className="globalnav-icon" aria-label="Bag">
              <svg width="13" height="15" viewBox="0 0 13 15" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M1.5 4.5h10l.5 10H1l.5-10Z" />
                <path d="M4 4.5V3a2.5 2.5 0 1 1 5 0v1.5" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Trade-in Banner */}
      <div className="tradein-banner">
        <p>Get up to $180–$650 in credit toward iPhone 17 Pro when you trade in iPhone 13 or higher.<sup>1</sup></p>
      </div>

      {/* Hero */}
      <header className="hero">
        <h1 className="hero-title">
          <span className="hero-title-line1">iPhone 17</span>
          <span className="hero-title-line2">PRO</span>
        </h1>
        <div className="hero-phone">
          <div className="hero-phone-body">
            <div className="hero-camera-island">
              <div className="hero-camera-lens hero-camera-lens-large" />
              <div className="hero-camera-lens hero-camera-lens-large" />
              <div className="hero-camera-lens hero-camera-lens-small" />
              <div className="hero-camera-flash" />
              <div className="hero-camera-mic" />
            </div>
          </div>
        </div>
      </header>

      {/* Buy CTA */}
      <section className="buy-cta">
        <a href="#" className="buy-btn">Buy</a>
        <p className="buy-price">From $1099 or $45.79/mo. for 24 mo.<sup>1</sup></p>
      </section>

      {/* Get the highlights */}
      <section className="highlights-intro">
        <div className="highlights-intro-inner">
          <h2 className="highlights-title">Get the highlights.</h2>
          <a href="#" className="highlights-film-link">
            Watch the film
            <span className="play-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="8.5" stroke="currentColor" strokeWidth="1" />
                <polygon points="7.5,5.5 13,9 7.5,12.5" fill="currentColor" />
              </svg>
            </span>
          </a>
        </div>
      </section>

      {/* Phone Carousel */}
      <section className="carousel-section">
        <div className="carousel-card">
          <p className="carousel-text">
            Heat-forged aluminum unibody design for<br />exceptional pro capability.
          </p>
          <div className="carousel-phones">
            <div className="phone-model phone-silver">
              <div className="phone-chassis">
                <div className="phone-camera-block phone-camera-silver">
                  <div className="cam-lens" />
                  <div className="cam-lens" />
                  <div className="cam-lens cam-lens-sm" />
                  <div className="cam-flash" />
                </div>
                <div className="phone-apple-logo">
                  <svg width="20" height="24" viewBox="0 0 14 18" fill="rgba(255,255,255,0.15)">
                    <path d="M13.07 10.41a4.04 4.04 0 0 1 .77-2.38 4.15 4.15 0 0 1 .53-.56c-.55-.65-1.35-1.04-2.13-1.1-.9-.1-1.78.54-2.24.54-.47 0-1.18-.53-1.95-.51a2.87 2.87 0 0 0-2.42 1.48c-1.04 1.79-.26 4.43.73 5.89.5.71 1.08 1.51 1.85 1.48.75-.03 1.03-.48 1.93-.48.9 0 1.16.48 1.94.46.8-.01 1.3-.72 1.78-1.44.36-.51.63-1.08.8-1.68a3.64 3.64 0 0 1-1.59-3.2ZM11.56 5.3a3.32 3.32 0 0 0 .78-2.38 3.38 3.38 0 0 0-2.19 1.13 3.17 3.17 0 0 0-.8 2.3c.86.06 1.69-.4 2.21-1.05Z" transform="translate(-3.5, -2.5)" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="phone-model phone-orange phone-center">
              <div className="phone-chassis">
                <div className="phone-camera-block phone-camera-orange">
                  <div className="cam-lens" />
                  <div className="cam-lens" />
                  <div className="cam-lens cam-lens-sm" />
                  <div className="cam-flash" />
                </div>
                <div className="phone-apple-logo">
                  <svg width="20" height="24" viewBox="0 0 14 18" fill="rgba(0,0,0,0.15)">
                    <path d="M13.07 10.41a4.04 4.04 0 0 1 .77-2.38 4.15 4.15 0 0 1 .53-.56c-.55-.65-1.35-1.04-2.13-1.1-.9-.1-1.78.54-2.24.54-.47 0-1.18-.53-1.95-.51a2.87 2.87 0 0 0-2.42 1.48c-1.04 1.79-.26 4.43.73 5.89.5.71 1.08 1.51 1.85 1.48.75-.03 1.03-.48 1.93-.48.9 0 1.16.48 1.94.46.8-.01 1.3-.72 1.78-1.44.36-.51.63-1.08.8-1.68a3.64 3.64 0 0 1-1.59-3.2ZM11.56 5.3a3.32 3.32 0 0 0 .78-2.38 3.38 3.38 0 0 0-2.19 1.13 3.17 3.17 0 0 0-.8 2.3c.86.06 1.69-.4 2.21-1.05Z" transform="translate(-3.5, -2.5)" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="phone-model phone-navy">
              <div className="phone-chassis">
                <div className="phone-camera-block phone-camera-navy">
                  <div className="cam-lens" />
                  <div className="cam-lens" />
                  <div className="cam-lens cam-lens-sm" />
                  <div className="cam-flash" />
                </div>
                <div className="phone-apple-logo">
                  <svg width="20" height="24" viewBox="0 0 14 18" fill="rgba(255,255,255,0.1)">
                    <path d="M13.07 10.41a4.04 4.04 0 0 1 .77-2.38 4.15 4.15 0 0 1 .53-.56c-.55-.65-1.35-1.04-2.13-1.1-.9-.1-1.78.54-2.24.54-.47 0-1.18-.53-1.95-.51a2.87 2.87 0 0 0-2.42 1.48c-1.04 1.79-.26 4.43.73 5.89.5.71 1.08 1.51 1.85 1.48.75-.03 1.03-.48 1.93-.48.9 0 1.16.48 1.94.46.8-.01 1.3-.72 1.78-1.44.36-.51.63-1.08.8-1.68a3.64 3.64 0 0 1-1.59-3.2ZM11.56 5.3a3.32 3.32 0 0 0 .78-2.38 3.38 3.38 0 0 0-2.19 1.13 3.17 3.17 0 0 0-.8 2.3c.86.06 1.69-.4 2.21-1.05Z" transform="translate(-3.5, -2.5)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="carousel-dots">
            <span className="carousel-dot carousel-dot-active" />
            <span className="carousel-dot" />
            <span className="carousel-dot" />
            <span className="carousel-dot" />
            <span className="carousel-dot" />
            <span className="carousel-dot" />
          </div>
          <button className="carousel-play" aria-label="Play">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <polygon points="7,4 17,10 7,16" />
            </svg>
          </button>
        </div>
      </section>

      {/* Sticky Sub-Nav */}
      <nav className="subnav" aria-label="iPhone 17 Pro">
        <div className="subnav-inner">
          <span className="subnav-title">iPhone 17 Pro</span>
          <div className="subnav-actions">
            <a href="#design" className="subnav-btn subnav-btn-outline">Explore</a>
            <a href="#" className="subnav-btn subnav-btn-fill">Buy</a>
          </div>
        </div>
      </nav>

      <main>
        {/* Design Section */}
        <section className="section-design" id="design">
          <div className="section-container">
            <p className="design-eyebrow">Design</p>
            <h2 className="design-headline">
              Unibody enclosure.<br />
              Makes a strong case<br className="br-mobile" /> for itself.
            </h2>
            <p className="design-intro">
              Introducing iPhone 17 Pro and iPhone 17 Pro Max, designed from the inside out to be the
              most powerful iPhone models ever made. At the core of the new design is a heat-forged
              aluminum unibody enclosure that maximizes performance, battery capacity,
              and durability.
            </p>
            <button className="compare-btn">
              Compare iPhone design
              <span className="compare-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="#2997ff" strokeWidth="1.5" fill="#2997ff" />
                  <line x1="10" y1="6" x2="10" y2="14" stroke="#fff" strokeWidth="1.5" />
                  <line x1="6" y1="10" x2="14" y2="10" stroke="#fff" strokeWidth="1.5" />
                </svg>
              </span>
            </button>
          </div>
        </section>

        {/* Internal Design Visual */}
        <section className="section-internals">
          <div className="section-container">
            <div className="internal-phone">
              <div className="internal-phone-body">
                <div className="internal-top-section">
                  <div className="internal-component internal-speaker" />
                  <div className="internal-component internal-camera-module" />
                </div>
                <div className="internal-battery">
                  <div className="internal-battery-cell" />
                </div>
                <div className="internal-bottom-section">
                  <div className="internal-component internal-taptic" />
                  <div className="internal-ports">
                    <span /><span /><span /><span />
                  </div>
                  <div className="internal-component internal-board" />
                </div>
              </div>
            </div>
            <button className="compare-btn">
              Compare iPhone design
              <span className="compare-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="#2997ff" strokeWidth="1.5" fill="#2997ff" />
                  <line x1="10" y1="6" x2="10" y2="14" stroke="#fff" strokeWidth="1.5" />
                  <line x1="6" y1="10" x2="14" y2="10" stroke="#fff" strokeWidth="1.5" />
                </svg>
              </span>
            </button>
          </div>
        </section>

        {/* Take a Closer Look */}
        <section className="section-closer-look">
          <div className="section-container">
            <h2 className="closer-look-title">Take a closer look.</h2>
            <div className="closer-look-card">
              <div className="closer-look-features">
                <button
                  className={`feature-pill ${activeFeature === 'colors' ? 'feature-pill-active' : ''}`}
                  onClick={() => setActiveFeature('colors')}
                >
                  <span className="feature-pill-icon feature-pill-icon-color" />
                  Colors
                </button>
                <button
                  className={`feature-pill ${activeFeature === 'aluminum' ? 'feature-pill-active' : ''}`}
                  onClick={() => setActiveFeature('aluminum')}
                >
                  <span className="feature-pill-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <circle cx="8" cy="8" r="6" />
                      <line x1="8" y1="2" x2="8" y2="14" />
                      <line x1="2" y1="8" x2="14" y2="8" />
                    </svg>
                  </span>
                  Aluminum unibody
                </button>
                <button
                  className={`feature-pill ${activeFeature === 'vapor' ? 'feature-pill-active' : ''}`}
                  onClick={() => setActiveFeature('vapor')}
                >
                  <span className="feature-pill-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <circle cx="8" cy="8" r="6" />
                      <line x1="8" y1="2" x2="8" y2="14" />
                      <line x1="2" y1="8" x2="14" y2="8" />
                    </svg>
                  </span>
                  Vapor chamber
                </button>
                <button
                  className={`feature-pill ${activeFeature === 'ceramic' ? 'feature-pill-active' : ''}`}
                  onClick={() => setActiveFeature('ceramic')}
                >
                  <span className="feature-pill-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <circle cx="8" cy="8" r="6" />
                      <line x1="8" y1="2" x2="8" y2="14" />
                      <line x1="2" y1="8" x2="14" y2="8" />
                    </svg>
                  </span>
                  Ceramic Shield
                </button>
                <button
                  className={`feature-pill ${activeFeature === 'display' ? 'feature-pill-active' : ''}`}
                  onClick={() => setActiveFeature('display')}
                >
                  <span className="feature-pill-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <circle cx="8" cy="8" r="6" />
                      <line x1="8" y1="2" x2="8" y2="14" />
                      <line x1="2" y1="8" x2="14" y2="8" />
                    </svg>
                  </span>
                  Immersive pro display
                </button>
                <button
                  className={`feature-pill ${activeFeature === 'camera-control' ? 'feature-pill-active' : ''}`}
                  onClick={() => setActiveFeature('camera-control')}
                >
                  <span className="feature-pill-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <circle cx="8" cy="8" r="6" />
                      <line x1="8" y1="2" x2="8" y2="14" />
                      <line x1="2" y1="8" x2="14" y2="8" />
                    </svg>
                  </span>
                  Camera Control
                </button>
                <button
                  className={`feature-pill ${activeFeature === 'action' ? 'feature-pill-active' : ''}`}
                  onClick={() => setActiveFeature('action')}
                >
                  <span className="feature-pill-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <circle cx="8" cy="8" r="6" />
                      <line x1="8" y1="2" x2="8" y2="14" />
                      <line x1="2" y1="8" x2="14" y2="8" />
                    </svg>
                  </span>
                  Action button
                </button>
              </div>
              <div className="closer-look-visual">
                <div className="closer-look-phone">
                  <div className="closer-look-phone-frame">
                    <div className="closer-look-phone-notch" />
                    <div className="closer-look-phone-screen">
                      <div className="closer-look-status-bar">
                        <span className="status-signal">
                          <svg width="16" height="12" viewBox="0 0 16 12" fill="#fff">
                            <rect x="0" y="8" width="3" height="4" rx="0.5" />
                            <rect x="4.5" y="5" width="3" height="7" rx="0.5" />
                            <rect x="9" y="2" width="3" height="10" rx="0.5" />
                            <rect x="13.5" y="0" width="2.5" height="12" rx="0.5" opacity="0.3" />
                          </svg>
                        </span>
                        <span className="status-wifi">
                          <svg width="14" height="10" viewBox="0 0 14 10" fill="#fff">
                            <path d="M7 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                            <path d="M4.5 7a3.5 3.5 0 0 1 5 0" fill="none" stroke="#fff" strokeWidth="1.2" />
                            <path d="M2 4.5a7 7 0 0 1 10 0" fill="none" stroke="#fff" strokeWidth="1.2" />
                          </svg>
                        </span>
                        <span className="status-battery">
                          <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
                            <rect x="0.5" y="0.5" width="19" height="9" rx="2" stroke="#fff" strokeWidth="1" />
                            <rect x="2" y="2" width="16" height="6" rx="1" fill="#fff" />
                            <rect x="20.5" y="3" width="1.5" height="4" rx="0.5" fill="#fff" opacity="0.4" />
                          </svg>
                        </span>
                      </div>
                      <div className="closer-look-screen-content">
                        <p className="screen-date">Tue Apr 1</p>
                        <p className="screen-time">9:41</p>
                        <div className="screen-wallpaper" />
                      </div>
                      <div className="closer-look-dock">
                        <span className="dock-icon" />
                        <span className="dock-icon" />
                        <span className="dock-icon" />
                        <span className="dock-icon dock-icon-camera">
                          <svg width="16" height="14" viewBox="0 0 16 14" fill="rgba(255,255,255,0.8)">
                            <path d="M2 4a2 2 0 0 1 2-2h1l1-1.5h4L11 2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Z" transform="translate(1,0.5)" />
                            <circle cx="8" cy="7.5" r="2.5" fill="rgba(0,0,0,0.3)" />
                          </svg>
                        </span>
                      </div>
                    </div>
                    {/* Side button */}
                    <div className="closer-look-phone-side-btn closer-look-phone-side-btn-top" />
                    <div className="closer-look-phone-side-btn closer-look-phone-side-btn-bottom" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-directory">
            <div className="footer-col">
              <h3>Shop and Learn</h3>
              <ul>
                <li><a href="#">Store</a></li>
                <li><a href="#">Mac</a></li>
                <li><a href="#">iPad</a></li>
                <li><a href="#">iPhone</a></li>
                <li><a href="#">Watch</a></li>
                <li><a href="#">AirPods</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h3>Services</h3>
              <ul>
                <li><a href="#">Apple Music</a></li>
                <li><a href="#">Apple TV+</a></li>
                <li><a href="#">Apple Arcade</a></li>
                <li><a href="#">iCloud</a></li>
                <li><a href="#">Apple One</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h3>Apple Store</h3>
              <ul>
                <li><a href="#">Find a Store</a></li>
                <li><a href="#">Genius Bar</a></li>
                <li><a href="#">Today at Apple</a></li>
                <li><a href="#">Financing</a></li>
                <li><a href="#">Trade In</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-legal">
              Copyright © 2025 Apple Inc. All rights reserved.
            </p>
            <ul className="footer-legal-links">
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Use</a></li>
              <li><a href="#">Sales and Refunds</a></li>
              <li><a href="#">Legal</a></li>
              <li><a href="#">Site Map</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
