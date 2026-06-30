"use client";

import { useEffect, useState, type CSSProperties, type FC } from "react";
import { EmbeddedTweet } from "react-tweet";
import { getTweet, type Tweet as TweetData, type TweetEntities } from "react-tweet/api";

interface TwitterEmbedProps {
  tweetId?: string;
  tweetUrl?: string;
  content?: string;
  authorName?: string;
  authorHandle?: string;
  postedOn?: string;
  className?: string;
}

type RawTweet = Record<string, unknown> & {
  entities?: unknown;
  quoted_tweet?: unknown;
  parent?: unknown;
};

function asEntityArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeTweetEntities(entities?: unknown): TweetEntities {
  if (!entities || typeof entities !== "object" || Array.isArray(entities)) {
    return {
      hashtags: [],
      user_mentions: [],
      urls: [],
      symbols: [],
    };
  }

  const typedEntities = entities as {
    hashtags?: TweetEntities["hashtags"] | TweetEntities["hashtags"][number];
    user_mentions?: TweetEntities["user_mentions"] | TweetEntities["user_mentions"][number];
    urls?: TweetEntities["urls"] | TweetEntities["urls"][number];
    symbols?: TweetEntities["symbols"] | TweetEntities["symbols"][number];
    media?: TweetEntities["media"] | NonNullable<TweetEntities["media"]>[number];
  };

  const normalized: TweetEntities = {
    hashtags: asEntityArray(typedEntities.hashtags),
    user_mentions: asEntityArray(typedEntities.user_mentions),
    urls: asEntityArray(typedEntities.urls),
    symbols: asEntityArray(typedEntities.symbols),
  };

  const media = asEntityArray(typedEntities.media);
  if (media.length > 0) {
    normalized.media = media;
  }

  return normalized;
}

function normalizeTweet(tweet: unknown): TweetData {
  const rawTweet = tweet as RawTweet;

  const normalizedTweet = {
    ...rawTweet,
    entities: normalizeTweetEntities(rawTweet.entities),
  } as TweetData;

  if (rawTweet.quoted_tweet) {
    normalizedTweet.quoted_tweet = normalizeTweet(rawTweet.quoted_tweet) as unknown as TweetData["quoted_tweet"];
  }

  if (rawTweet.parent) {
    normalizedTweet.parent = {
      ...(rawTweet.parent as Record<string, unknown>),
      entities: normalizeTweetEntities((rawTweet.parent as RawTweet).entities),
    } as unknown as TweetData["parent"];
  }

  return normalizedTweet;
}

function extractTweetId(tweetId?: string, tweetUrl?: string) {
  if (tweetId) return tweetId;
  if (!tweetUrl) return undefined;

  const match = tweetUrl.match(/status\/(\d+)/);
  return match?.[1];
}

export const TwitterEmbed: FC<TwitterEmbedProps> = ({
  tweetId,
  tweetUrl,
  content,
  authorName,
  authorHandle,
  postedOn,
  className,
}) => {
  const resolvedTweetId = extractTweetId(tweetId, tweetUrl);
  const [tweet, setTweet] = useState<TweetData | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTweet() {
      if (!resolvedTweetId) {
        setTweet(null);
        setError(new Error("Missing tweet id"));
        return;
      }

      setError(null);

      try {
        const fetchedTweet = await getTweet(resolvedTweetId);

        if (cancelled) return;

        if (!fetchedTweet) {
          setTweet(null);
          setError(new Error(`Tweet ${resolvedTweetId} could not be loaded`));
          return;
        }

        setTweet(normalizeTweet(fetchedTweet));
      } catch (loadError) {
        if (cancelled) return;

        setTweet(null);
        setError(loadError);
      }
    }

    void loadTweet();

    return () => {
      cancelled = true;
    };
  }, [resolvedTweetId]);

  return (
    <div
      data-theme="dark"
      className={`w-full max-w-sm mx-auto ${className ?? ""}`}
      style={{
        "--tweet-theme": "dark",
        "--tweet-text-color": "#e5e7eb",
        "--tweet-bg-color": "#000000",
        colorScheme: "dark",
      } as CSSProperties}
    >
      {tweet ? (
        <div className="[&_article]:!bg-black [&_article]:!border-0 [&_*]:!text-gray-300 [&_a]:!text-blue-400 [&_svg]:!text-gray-400">
          <EmbeddedTweet tweet={tweet} />
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-gray-300 shadow-lg shadow-black/20 backdrop-blur-sm">
          <p className="font-medium text-white">{authorName ?? "Tweet"}</p>
          {authorHandle ? <p className="mt-1 text-gray-400">{authorHandle}</p> : null}
          <p className="mt-3 leading-relaxed text-gray-300">
            {content ?? "Loading tweet..."}
          </p>
          {postedOn ? (
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gray-500">{postedOn}</p>
          ) : null}
          {resolvedTweetId ? (
            <a
              className="mt-4 inline-flex text-xs font-medium text-blue-400 underline underline-offset-4"
              href={`https://x.com/i/status/${resolvedTweetId}`}
              rel="noreferrer"
              target="_blank"
            >
              Open on X
            </a>
          ) : null}
          {error ? <p className="mt-3 text-xs text-rose-400"></p> : null}
        </div>
      )}
    </div>
  );
};

export default TwitterEmbed;