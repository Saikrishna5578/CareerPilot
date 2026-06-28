import React, { useState, useEffect, useRef } from 'react';

function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const increment = target / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className="counter-number">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function HeroStats() {
  return (
    <div className="hero-stats-bar">
      <div className="hero-stat-item">
        <AnimatedCounter target={1200} suffix="+" />
        <span className="hero-stat-label">Topics Curated</span>
      </div>
      <div className="hero-stat-divider"></div>
      <div className="hero-stat-item">
        <AnimatedCounter target={500} suffix="+" />
        <span className="hero-stat-label">Jobs Tracked</span>
      </div>
      <div className="hero-stat-divider"></div>
      <div className="hero-stat-item">
        <AnimatedCounter target={6} suffix="-Week" />
        <span className="hero-stat-label">AI Roadmaps</span>
      </div>
      <div className="hero-stat-divider"></div>
      <div className="hero-stat-item">
        <AnimatedCounter target={100} suffix="%" />
        <span className="hero-stat-label">Free Forever</span>
      </div>
    </div>
  );
}
