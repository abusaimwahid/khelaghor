"use client";

import { useEffect, useState } from "react";

export function AnnouncementRotator({ messages }: { messages: string[] }) {
  const cleanMessages = messages.filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (cleanMessages.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % cleanMessages.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [cleanMessages.length]);

  if (!cleanMessages.length) return null;

  return (
    <span className="block truncate" aria-live="polite">
      {cleanMessages[index]}
    </span>
  );
}
