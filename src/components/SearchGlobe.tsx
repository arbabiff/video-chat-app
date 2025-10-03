import React, { useEffect, useMemo, useState } from 'react';
import { demoUsers, DemoUser } from '@/data/demoUsers';

interface SearchGlobeProps {
  users?: DemoUser[];
  durationMs?: number;
}

// Map lat/lng to x/y inside a unit circle projection (simplified)
function project(lat: number, lng: number) {
  // Normalize to [0,1]
  const x = (lng + 180) / 360; // 0..1
  const y = 1 - (lat + 90) / 180; // 0..1 (invert for screen coords)
  return { x, y };
}

const SearchGlobe: React.FC<SearchGlobeProps> = ({ users = demoUsers, durationMs = 2500 }) => {
  const [visibleUsers, setVisibleUsers] = useState<DemoUser[]>([]);

  useEffect(() => {
    // Gradually reveal up to 6 users during the search
    const reveal = users.slice(0, 6);
    const steps = reveal.length;
    const stepMs = Math.max(300, Math.floor(durationMs / steps));
    let i = 0;
    const t = setInterval(() => {
      setVisibleUsers((prev) => (i < steps ? [...prev, reveal[i++]] : prev));
      if (i >= steps) clearInterval(t);
    }, stepMs);
    return () => clearInterval(t);
  }, [users, durationMs]);

  const pins = useMemo(() => {
    const highlight = visibleUsers.length > 0 ? visibleUsers[visibleUsers.length - 1] : null;
    return visibleUsers.map((u) => {
      const { x, y } = project(u.lat, u.lng);
      const left = `${Math.min(95, Math.max(5, x * 100))}%`;
      const top = `${Math.min(95, Math.max(5, y * 100))}%`;
      const isHighlight = highlight && u.id === highlight.id;
      if (!isHighlight) {
        // Red dot for non-highlighted users
        return (
          <div key={u.id} className="user-ping" style={{ left, top }}>
            <div className="dot" style={{ background: '#ef4444', boxShadow: '0 0 0 2px #ef444455' }} />
          </div>
        );
      }
      // Highlighted user: green dot + pulse ring (no text)
      return (
        <div key={u.id} className="user-ping" style={{ left, top }}>
          <span className="ping-ring" />
          <div className="dot" style={{ background: '#22c55e', boxShadow: '0 0 0 2px #22c55e55' }} />
        </div>
      );
    });
  }, [visibleUsers]);

  return (
    <div className="radar-container">
      <div className="globe-grid" />
      <div className="radar-sweep" />
      {pins}
    </div>
  );
};

export default SearchGlobe;
