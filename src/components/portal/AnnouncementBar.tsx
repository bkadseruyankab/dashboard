'use client';

import { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import { Announcement } from './types';

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/announcements');
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (!isVisible || announcements.length === 0) return null;

  const current = announcements[currentIndex];

  return (
    <div className="bg-amber-500 text-white py-2 relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3">
          <Megaphone className="h-5 w-5 flex-shrink-0 animate-pulse" />
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">PENGUMUMAN:</span>
              <span className="text-sm">{current.title}</span>
              {current.link && (
                <a
                  href={current.link}
                  className="text-sm underline hover:text-amber-200 flex-shrink-0"
                >
                  Selengkapnya
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-amber-600 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
