"use client";

import React, { useEffect, useRef } from "react";

interface TwitterEmbedProps {
  tweetUrl: string;
  content: string;
  authorName: string;
  authorHandle: string;
  postedOn: string;
  lang?: string;
  className?: string;
}

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (el?: Element) => void;
      };
    };
  }
}

let widgetsLoaderPromise: Promise<void> | null = null;

function ensureTwitterWidgetsScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.twttr?.widgets) {
    return Promise.resolve();
  }

  if (widgetsLoaderPromise) {
    return widgetsLoaderPromise;
  }

  widgetsLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-twitter-widgets="true"]'
    );

    if (existing) {
      if (window.twttr?.widgets) {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Twitter widgets script")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://platform.twitter.com/widgets.js";
    script.charset = "utf-8";
    script.dataset.twitterWidgets = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Twitter widgets script"));
    document.head.appendChild(script);
  });

  return widgetsLoaderPromise;
}

export const TwitterEmbed: React.FC<TwitterEmbedProps> = ({
  tweetUrl,
  content,
  authorName,
  authorHandle,
  postedOn,
  lang = "und",
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        await ensureTwitterWidgetsScript();
        if (cancelled) {
          return;
        }

        const target = containerRef.current || undefined;
        window.twttr?.widgets.load(target);

        // Some environments mount before widgets is ready internally; retry once.
        window.setTimeout(() => {
          if (!cancelled) {
            window.twttr?.widgets.load(target);
          }
        }, 250);
      } catch (error) {
        console.error("[TwitterEmbed] Unable to hydrate twitter blockquote", error);
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [tweetUrl]);

  return (
    <div
      ref={containerRef}
      data-theme="dark"
      className={`w-full max-w-sm mx-auto ${className ?? ""}`}
      style={{
        '--tweet-theme': 'dark',
        '--tweet-text-color': '#e5e7eb',
        '--tweet-bg-color': '#000000',
        colorScheme: 'dark'
      } as React.CSSProperties}
    >
      <blockquote className="twitter-tweet" data-theme="dark" data-dnt="true" data-conversation="none">
        <p lang={lang} dir="ltr">{content}</p>
        &mdash; {authorName} ({authorHandle}) <a href={tweetUrl}>{postedOn}</a>
      </blockquote>
    </div>
  );
};

export default TwitterEmbed;