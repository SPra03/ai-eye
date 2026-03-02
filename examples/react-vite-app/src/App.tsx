import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

/* ── Custom Hooks ── */

function useScrolled(threshold = 10) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);
  return scrolled;
}

function useScrollReveal() {
  const ref = useRef(null as unknown as HTMLDivElement);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );
    const children = el.querySelectorAll('.reveal');
    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── SVG Icons ── */

const StarIcon = () => (
  <svg className="testimonial-star" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

/* ═══════════════════════════════════════════
   SECTION 1: Navigation
   ═══════════════════════════════════════════ */

function Nav() {
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = useCallback((e: React.MouseEvent) => {
    const href = e.currentTarget.getAttribute('href');
    if (href?.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setMobileOpen(false);
      }
    }
  }, []);

  return (
    <>
      <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <div className="nav-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3L2 9l10 6 10-6-10-6z" />
                <path d="M2 17l10 6 10-6" />
                <path d="M2 13l10 6 10-6" />
              </svg>
            </div>
            <span>Unrealize<span className="nav-logo-x">X</span></span>
          </a>

          <ul className="nav-links">
            <li><a href="#features" onClick={handleNavClick}>Features</a></li>
            <li><a href="#how-it-works" onClick={handleNavClick}>How It Works</a></li>
            <li><a href="#showcase" onClick={handleNavClick}>Showcase</a></li>
            <li><a href="#pricing" onClick={handleNavClick}>Pricing</a></li>
            <li><a href="#faq" onClick={handleNavClick}>FAQ</a></li>
          </ul>

          <div className="nav-actions">
            <a href="#" className="btn-secondary">Log In</a>
            <a href="#" className="btn-primary">Start Free</a>
          </div>

          <button className="nav-hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <a href="#features" onClick={handleNavClick}>Features</a>
        <a href="#how-it-works" onClick={handleNavClick}>How It Works</a>
        <a href="#showcase" onClick={handleNavClick}>Showcase</a>
        <a href="#pricing" onClick={handleNavClick}>Pricing</a>
        <a href="#faq" onClick={handleNavClick}>FAQ</a>
        <a href="#" className="btn-primary" style={{ marginTop: 16 }}>Start Free</a>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   SECTION 2: Hero
   ═══════════════════════════════════════════ */

function Hero() {
  const ref = useScrollReveal();
  return (
    <section className="hero" ref={ref}>
      <div className="hero-glow" />
      <div className="hero-content">
        <div className="hero-eyebrow reveal">
          <span>&#x2728;</span> Now Free — Previously $19/mo
        </div>

        <h1 className="reveal reveal-delay-1">
          Turn Any Image Into a{' '}
          <span className="gradient-text">Production-Ready 3D Model</span>
        </h1>

        <p className="hero-sub reveal reveal-delay-2">
          AI-powered generation with full creative control. From sketch to textured,
          retopologized, UV-mapped model — and every asset belongs to you.
        </p>

        <div className="hero-ctas reveal reveal-delay-3">
          <button className="btn-hero-primary">Start Creating — It's Free</button>
          <button className="btn-hero-secondary">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M6.271 3.323a.5.5 0 01.506-.017l5.5 3.179a.5.5 0 010 .865l-5.5 3.179A.5.5 0 016 10.179V3.821a.5.5 0 01.271-.498z" />
            </svg>
            Watch Demo
          </button>
        </div>

        <div className="hero-visual reveal reveal-delay-4">
          <div className="hero-visual-card">
            <div className="hero-visual-left">
              <div className="hero-visual-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 16l5-5 4 4 4-6 5 7" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                </svg>
              </div>
              <span className="hero-visual-label">2D Input</span>
            </div>
            <div className="hero-visual-divider" />
            <div className="hero-arrow">→</div>
            <div className="hero-visual-right">
              <div className="hero-visual-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--bg-elevated)" strokeWidth="1.5">
                  <path d="M12 3L2 9l10 6 10-6-10-6z" />
                  <path d="M2 17l10 6 10-6" />
                  <path d="M2 13l10 6 10-6" />
                </svg>
              </div>
              <span className="hero-visual-label">3D Output</span>
            </div>
          </div>

          <div className="hero-badges">
            <div className="hero-badge">
              <span className="hero-badge-icon">&#x1F6E1;&#xFE0F;</span> 100% IP Ownership
            </div>
            <div className="hero-badge">
              <span className="hero-badge-icon">&#x1F3AE;</span> Game-Engine Ready
            </div>
            <div className="hero-badge">
              <span className="hero-badge-icon">&#x2705;</span> 4 Steps to Done
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 3: Social Proof Bar
   ═══════════════════════════════════════════ */

function SocialProof() {
  const industries = [
    { name: 'Game Dev', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3a2 2 0 00-2 2v8a2 2 0 002 2h18a2 2 0 002-2V8a2 2 0 00-2-2zm-10 7H9v2H7v-2H5v-2h2V9h2v2h2v2zm4.5 2a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm4-3a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg> },
    { name: 'E-Commerce', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.16 14.26l.04-.12.96-1.74h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0020.07 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25z"/></svg> },
    { name: 'Architecture', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg> },
    { name: '3D Art', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg> },
    { name: 'Product Design', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg> },
    { name: 'Film & VFX', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg> },
  ];

  return (
    <section className="social-proof">
      <div className="social-proof-inner">
        <span className="social-proof-label">Trusted by creators in</span>
        <div className="social-proof-items">
          {industries.map((ind) => (
            <div key={ind.name} className="social-proof-item">
              {ind.icon}
              {ind.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 4: How It Works
   ═══════════════════════════════════════════ */

function HowItWorks() {
  const ref = useScrollReveal();
  const steps = [
    {
      num: 1,
      title: 'Upload',
      desc: 'Drop in any 2D image, sketch, concept art, or illustration.',
      visualClass: 'step-visual-1',
      label: 'Image Input',
    },
    {
      num: 2,
      title: 'Generate',
      desc: 'AI analyzes your image and builds a detailed 3D mesh in seconds.',
      visualClass: 'step-visual-2',
      label: 'AI Processing',
    },
    {
      num: 3,
      title: 'Refine',
      desc: 'Automatic retopology and UV mapping, optimized for production.',
      visualClass: 'step-visual-3',
      label: 'Clean Topology',
    },
    {
      num: 4,
      title: 'Texture & Export',
      desc: 'PBR textures applied. Export as FBX, OBJ, GLTF, or USDZ.',
      visualClass: 'step-visual-4',
      label: 'Final Output',
    },
  ];

  return (
    <section className="how-it-works" id="how-it-works" ref={ref}>
      <div className="section-inner">
        <div className="section-eyebrow reveal">HOW IT WORKS</div>
        <h2 className="section-headline reveal reveal-delay-1">From Flat to Finished in Four Steps</h2>
        <p className="section-sub reveal reveal-delay-2">
          Our guided AI pipeline handles the tedious parts so you can focus on creating.
        </p>

        <div className="steps-grid">
          {steps.map((step, i) => (
            <div key={step.num} className={`step-card reveal reveal-delay-${i + 1}`}>
              <div className="step-number">{step.num}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
              <div className={`step-visual ${step.visualClass}`}>
                <div className="step-visual-shape" />
                <span className="step-visual-label">{step.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 5: Features
   ═══════════════════════════════════════════ */

function Features() {
  const ref = useScrollReveal();

  return (
    <section className="features" id="features" ref={ref}>
      <div className="section-inner">
        <div className="section-eyebrow reveal">FEATURES</div>
        <h2 className="section-headline reveal reveal-delay-1">Built for Creators Who Ship</h2>
        <p className="section-sub reveal reveal-delay-2">
          Professional-grade tools that respect your craft and your time.
        </p>

        {/* Feature 1 */}
        <div className="feature-block reveal">
          <div className="feature-text">
            <h3>Image-to-3D That Actually Works</h3>
            <p>
              Upload a photo, sketch, or concept art. Our AI doesn't just guess — it understands
              depth, form, and structure to produce meshes that hold up under scrutiny. No more
              blobby, unusable outputs.
            </p>
            <ul className="feature-bullets">
              <li><span className="feature-bullet-dot" /> Supports photos, illustrations, sketches, and concept art</li>
              <li><span className="feature-bullet-dot" /> Intelligent depth estimation and form analysis</li>
              <li><span className="feature-bullet-dot" /> Clean geometry from day one</li>
            </ul>
          </div>
          <div className="feature-visual feature-visual-1">
            <div className="feature-visual-inner">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" strokeWidth="1.2" className="feature-visual-icon">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 16l5-5 4 4 4-6 5 7" />
                <circle cx="8.5" cy="8.5" r="1.5" />
              </svg>
              <span style={{ color: 'var(--text-tertiary)', fontSize: 20, margin: '8px 0' }}>→</span>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-400)" strokeWidth="1.2" className="feature-visual-icon">
                <path d="M12 3L2 9l10 6 10-6-10-6z" />
                <path d="M2 17l10 6 10-6" />
                <path d="M2 13l10 6 10-6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="feature-block reversed reveal">
          <div className="feature-text">
            <h3>Retopology. UV Maps. Textures. Automated.</h3>
            <p>
              The boring hours of cleanup? Gone. UnrealizeX runs your model through an automated
              production pipeline: retopology for clean edge flow, UV unwrapping for proper texture
              space, and PBR texturing for realistic materials.
            </p>
            <ul className="feature-bullets">
              <li><span className="feature-bullet-dot" /> Automatic quad-dominant retopology</li>
              <li><span className="feature-bullet-dot" /> Optimized UV unwrapping with minimal stretching</li>
              <li><span className="feature-bullet-dot" /> PBR texture generation (albedo, normal, roughness, metallic)</li>
            </ul>
          </div>
          <div className="feature-visual feature-visual-2">
            <div className="feature-visual-inner">
              <div className="feature-pipeline-cards">
                <div className="feature-pipeline-card">Retopo</div>
                <div className="feature-pipeline-card">UV Map</div>
                <div className="feature-pipeline-card">Texture</div>
              </div>
              <span className="feature-visual-label">Automated Pipeline</span>
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="feature-block reveal">
          <div className="feature-text">
            <h3>Everything You Create Belongs to You</h3>
            <p>
              Unlike platforms that claim rights to generated content, UnrealizeX grants you full
              intellectual property ownership of every model, texture, and asset you generate. Use
              them commercially, modify them, sell them. They're yours.
            </p>
            <ul className="feature-bullets">
              <li><span className="feature-bullet-dot" /> Full commercial rights on all generated assets</li>
              <li><span className="feature-bullet-dot" /> No licensing fees or royalty obligations</li>
              <li><span className="feature-bullet-dot" /> Export in industry-standard formats (FBX, OBJ, GLTF, USDZ)</li>
            </ul>
          </div>
          <div className="feature-visual feature-visual-3">
            <div className="feature-visual-inner">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" strokeWidth="1.2" className="feature-visual-icon">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span className="feature-visual-label">Your IP. Protected.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 6: Gallery
   ═══════════════════════════════════════════ */

function Gallery() {
  const ref = useScrollReveal();
  const items = [
    { name: 'Medieval Sword', category: 'Game Asset', shape: 'cube' },
    { name: 'Running Shoe', category: 'E-Commerce', shape: 'sphere' },
    { name: 'Modern Chair', category: 'Product Design', shape: 'diamond' },
    { name: 'Character Bust', category: 'Concept Art', shape: 'cylinder' },
    { name: 'Sports Car', category: 'Automotive', shape: 'hexagon' },
    { name: 'Potion Bottle', category: 'Game Asset', shape: 'triangle' },
    { name: 'Designer Handbag', category: 'E-Commerce', shape: 'pentagon' },
    { name: 'House Exterior', category: 'Architecture', shape: 'octagon' },
  ];

  return (
    <section className="gallery" id="showcase" ref={ref}>
      <div className="gallery-header">
        <div className="section-eyebrow reveal">SHOWCASE</div>
        <h2 className="section-headline reveal reveal-delay-1">See What's Possible</h2>
        <p className="section-sub reveal reveal-delay-2">
          Real models generated by UnrealizeX from 2D inputs.
        </p>
      </div>
      <div className="gallery-scroll">
        {items.map((item) => (
          <div key={item.name} className="gallery-card">
            <div className="gallery-card-bg">
              <div className={`gallery-card-shape ${item.shape}`} />
            </div>
            <div className="gallery-card-info">
              <div className="gallery-card-name">{item.name}</div>
              <span className="gallery-card-category">{item.category}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 7: Comparison
   ═══════════════════════════════════════════ */

function Comparison() {
  const ref = useScrollReveal();
  const rows = [
    { feature: 'IP Ownership', others: 'Unclear / shared', ours: '100% yours' },
    { feature: 'Production Pipeline', others: 'Generate only', ours: 'Generate + Retopo + UV + Texture' },
    { feature: 'Pricing', others: '$19–$30/mo', ours: 'Free' },
    { feature: 'Output Quality', others: 'Needs heavy cleanup', ours: 'Production-ready' },
    { feature: 'Workflow', others: 'Upload and pray', ours: 'Guided 4-step process' },
    { feature: 'Export Formats', others: 'Limited selection', ours: 'FBX, OBJ, GLTF, USDZ' },
  ];

  return (
    <section className="comparison" ref={ref}>
      <div className="section-inner">
        <div className="section-eyebrow reveal">WHY UNREALIZEX</div>
        <h2 className="section-headline reveal reveal-delay-1">What Sets Us Apart</h2>

        <div className="comparison-table">
          <div className="comparison-row comparison-header reveal reveal-delay-2">
            <span>Feature</span>
            <span>Other AI Tools</span>
            <span>UnrealizeX</span>
          </div>
          {rows.map((row, i) => (
            <div key={row.feature} className={`comparison-row reveal reveal-delay-${Math.min(i + 2, 4)}`}>
              <span className="comparison-feature">{row.feature}</span>
              <span className="comparison-others">
                <span className="icon-x">&#x2717;</span> {row.others}
              </span>
              <span className="comparison-ours">
                <span className="icon-check">&#x2713;</span> {row.ours}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 8: Pricing
   ═══════════════════════════════════════════ */

function Pricing() {
  const ref = useScrollReveal();
  const features = [
    'Unlimited 3D model generation',
    'Full production pipeline (retopo + UV + texture)',
    'All export formats (FBX, OBJ, GLTF, USDZ)',
    '100% IP ownership',
    'Commercial usage rights',
    'Priority processing',
  ];

  return (
    <section className="pricing" id="pricing" ref={ref}>
      <div className="section-inner">
        <div className="section-eyebrow reveal">PRICING</div>
        <h2 className="section-headline reveal reveal-delay-1">Start Creating for Free</h2>
        <p className="section-sub reveal reveal-delay-2">
          No credit card. No catch. Just create.
        </p>

        <div className="pricing-card-wrapper reveal reveal-delay-3">
          <div className="pricing-card">
            <div className="pricing-badge">Currently Free</div>
            <div className="pricing-amount">
              <span className="price">$0</span>
              <span className="period">/month</span>
            </div>
            <div className="pricing-strikethrough">$19/mo</div>
            <div className="pricing-tagline">Full access to all features</div>
            <ul className="pricing-features">
              {features.map((f) => (
                <li key={f}>
                  <span className="check">&#x2713;</span> {f}
                </li>
              ))}
            </ul>
            <button className="pricing-cta">Get Started Free</button>
            <p className="pricing-fine-print">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 9: Testimonials
   ═══════════════════════════════════════════ */

function Testimonials() {
  const ref = useScrollReveal();
  const testimonials = [
    {
      quote:
        'I went from concept sketch to game-ready asset in under 10 minutes. The retopology alone saves me hours of manual work.',
      name: 'Alex Chen',
      role: 'Indie Game Developer',
      initials: 'AC',
      avatarClass: 'avatar-1',
    },
    {
      quote:
        "We use UnrealizeX for our entire product catalog. Upload a product photo, get a 3D model for our website. It's changed how we do e-commerce.",
      name: 'Sarah Mitchell',
      role: 'E-Commerce Director, StyleHaus',
      initials: 'SM',
      avatarClass: 'avatar-2',
    },
    {
      quote:
        'The IP ownership clause is what sold me. Every other tool has vague terms. UnrealizeX is the only one that says it plainly: your work is yours.',
      name: 'Marcus Rivera',
      role: 'Freelance 3D Artist',
      initials: 'MR',
      avatarClass: 'avatar-3',
    },
  ];

  return (
    <section className="testimonials" ref={ref}>
      <div className="section-inner">
        <div className="section-eyebrow reveal">TESTIMONIALS</div>
        <h2 className="section-headline reveal reveal-delay-1">Creators Are Talking</h2>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div key={t.name} className={`testimonial-card reveal reveal-delay-${i + 1}`}>
              <div className="testimonial-stars">
                {[...Array(5)].map((_, si) => (
                  <StarIcon key={si} />
                ))}
              </div>
              <p className="testimonial-quote">{t.quote}</p>
              <div className="testimonial-author">
                <div className={`testimonial-avatar ${t.avatarClass}`}>{t.initials}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 10: FAQ
   ═══════════════════════════════════════════ */

function FAQ() {
  const ref = useScrollReveal();
  const [openIndex, setOpenIndex] = useState(null as number | null);

  const items = [
    {
      q: 'What types of images can I upload?',
      a: "Almost anything 2D — photographs, digital illustrations, pencil sketches, concept art, even AI-generated images. Our AI works best with clear subjects and decent lighting, but it's surprisingly robust with rough sketches too.",
    },
    {
      q: 'How long does generation take?',
      a: 'Most models generate in 30–90 seconds. The full pipeline (generation + retopology + UV mapping + texturing) typically completes in 2–5 minutes depending on complexity.',
    },
    {
      q: 'Do I really own the IP of generated models?',
      a: 'Yes, completely. Our terms of service explicitly grant you full intellectual property rights to every asset you generate. Use them commercially, sell them, modify them — they\'re yours. No royalties, no attribution required.',
    },
    {
      q: 'What export formats are supported?',
      a: 'We support FBX, OBJ, GLTF/GLB, and USDZ. Models export with clean topology, proper UV maps, and PBR texture sets (albedo, normal, roughness, metallic).',
    },
    {
      q: 'Why is it free?',
      a: "We're in an early growth phase and want to build the best possible tool with creator feedback. We may introduce premium tiers in the future, but the core generation pipeline will always have a generous free tier.",
    },
    {
      q: 'Can I use generated models in commercial projects?',
      a: 'Absolutely. You have full commercial rights. Use them in games, sell them on marketplaces, include them in client work, render them for advertisements — no restrictions.',
    },
  ];

  return (
    <section className="faq" id="faq" ref={ref}>
      <div className="section-inner">
        <div className="section-eyebrow reveal">FAQ</div>
        <h2 className="section-headline reveal reveal-delay-1">Questions? Answered.</h2>

        <div className="faq-list">
          {items.map((item, i) => (
            <div key={i} className={`faq-item ${openIndex === i ? 'open' : ''} reveal reveal-delay-${Math.min(i + 1, 4)}`}>
              <button className="faq-question" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                <span className="faq-question-text">{item.q}</span>
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <p className="faq-answer-text">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 11: Final CTA
   ═══════════════════════════════════════════ */

function FinalCTA() {
  const ref = useScrollReveal();
  return (
    <section className="final-cta" ref={ref}>
      <div className="final-cta-glow" />
      <div className="section-inner">
        <h2 className="section-headline reveal">
          Ready to Bring Your{' '}
          <span className="gradient-text">Art to Life</span>?
        </h2>
        <p className="section-sub reveal reveal-delay-1">
          Join thousands of creators turning 2D visions into 3D reality. Free.
        </p>
        <div className="reveal reveal-delay-2">
          <button className="btn-hero-primary">Start Creating Now</button>
          <p className="final-cta-fine-print">No credit card required</p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 12: Footer
   ═══════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <a href="#" className="nav-logo">
            <div className="nav-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3L2 9l10 6 10-6-10-6z" />
                <path d="M2 17l10 6 10-6" />
                <path d="M2 13l10 6 10-6" />
              </svg>
            </div>
            <span>Unrealize<span className="nav-logo-x">X</span></span>
          </a>
          <p>AI-powered 3D model generation. Your vision, your art, your IP.</p>
          <div className="footer-social">
            <a href="#" aria-label="Twitter">
              <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" aria-label="Discord">
              <svg viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/></svg>
            </a>
            <a href="#" aria-label="YouTube">
              <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Product</h4>
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#showcase">Showcase</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#">Changelog</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Resources</h4>
          <ul>
            <li><a href="#">Documentation</a></li>
            <li><a href="#">API Reference</a></li>
            <li><a href="#">Tutorials</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Community</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>&copy; 2026 UnrealizeX. All rights reserved.</span>
        <span>Built for creators, by creators.</span>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   APP
   ═══════════════════════════════════════════ */

function App() {
  return (
    <div className="unrealizex">
      <div className="grain-overlay" />
      <Nav />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <Features />
      <Gallery />
      <Comparison />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

export default App;
