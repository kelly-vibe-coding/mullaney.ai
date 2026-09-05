"use client";

import { Camera, CirclePlus, House, Search } from "lucide-react";
import { useCallback, useState } from "react";

import { getChannelIconUrl } from "@/lib/channel-icons";
import type { FeedClip } from "@/lib/feed";
import type { ClipVoteCounts, Reaction } from "@/lib/votes/constants";

import { CommentsOffSnackbar } from "./comments-off-snackbar";
import { MeAvatar } from "./me-avatar";

export interface ShortsChromeProps {
  clip: FeedClip;
  activePosition: number;
  total: number;
  onAbout: () => void;
  enableAbout?: boolean;
  votes?: ClipVoteCounts;
  onReact?: (reaction: Reaction) => void;
}

const GLYPH = {
  thumbUp:
    "M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.58 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2zM9 9l4.34-4.34L12 10h9v2l-3 7H9V9zM1 9h4v12H1V9z",
  thumbUpSolid:
    "M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.58 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2zM1 9h4v12H1V9z",
  thumbDown:
    "M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm0 12l-4.34 4.34L12 14H3v-2l3-7h9v10zm4-12h4v12h-4V3z",
  thumbDownSolid:
    "M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zM3 3h4v12H3V3z",
  comment:
    "M12 3c-5.2 0-9.4 3.6-9.4 8.1 0 2.5 1.3 4.8 3.4 6.3V22l3.6-2c.8.1 1.6.2 2.4.2 5.2 0 9.4-3.6 9.4-8.1S17.2 3 12 3zm0 14.9c-.8 0-1.6-.1-2.4-.3l-.4-.1-2 1.1v-1.9l-.4-.3c-1.9-1.2-3-3.1-3-5.2C3.8 8.2 7.4 5.3 12 5.3s8.2 2.9 8.2 6.8-3.6 6.8-8.2 6.8z",
  share:
    "M11.3 3v4.4C5.9 8 2 12.4 2 17.8c0 .5 0 1 .1 1.5.9-2.7 3.5-5.6 9.2-6v3.4l9.4-6.9L11.3 3z",
  more: "M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z",
  note: "M12 3v10.6A4 4 0 1014 17V7h5V3h-7zm-1.9 12.9a2.1 2.1 0 110 4.2 2.1 2.1 0 010-4.2z",
  shortsTab:
    "M8.75 3.5h6.5a3.25 3.25 0 013.25 3.25v10.5a3.25 3.25 0 01-3.25 3.25h-6.5a3.25 3.25 0 01-3.25-3.25V6.75A3.25 3.25 0 018.75 3.5zm2.15 5.5v6l4.35-3-4.35-3z",
  subscriptions:
    "M18.5 8.6h-13V7h13v1.6zM16.8 3.7H7.2v1.6h9.6V3.7zM21 10.2H3v10.1h18V10.2zM4.6 18.7v-6.9h14.8v6.9H4.6zm5.4-6.1v5.2l4.5-2.6-4.5-2.6z",
} as const;

const DEFAULT_VOTES: ClipVoteCounts = {
  like: 0,
  dislike: 0,
  reaction: null,
};

function Glyph({ d, evenOdd }: { d: string; evenOdd?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule={evenOdd ? "evenodd" : undefined}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

function getAvatarInitial(clip: FeedClip): string {
  const source = clip.handle.replace(/^@/, "").trim() || clip.channelName.trim();
  return (source.charAt(0) || "K").toUpperCase();
}

function formatCount(value: number): string {
  return String(Math.max(0, value));
}

function ChannelAvatar({
  clip,
  className,
}: {
  clip: FeedClip;
  className: string;
}) {
  const iconUrl = getChannelIconUrl(clip.id);

  if (iconUrl) {
    return (
      <span className={className} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconUrl} alt="" />
      </span>
    );
  }

  return (
    <span className={className} aria-hidden="true">
      {getAvatarInitial(clip)}
    </span>
  );
}

export function ShortsChrome({
  clip,
  activePosition,
  total,
  onAbout,
  enableAbout = true,
  votes = DEFAULT_VOTES,
  onReact,
}: ShortsChromeProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const liked = votes.reaction === "like";
  const disliked = votes.reaction === "dislike";

  const handleLike = () => {
    if (!onReact) {
      return;
    }
    onReact(liked ? null : "like");
  };

  const handleDislike = () => {
    if (!onReact) {
      return;
    }
    onReact(disliked ? null : "dislike");
  };

  const closeCommentsSnackbar = useCallback(() => {
    setCommentsOpen(false);
  }, []);

  return (
    <div className="shorts-chrome">
      <p className="visually-hidden" aria-live="polite">
        {`Short ${activePosition} of ${total}, ${clip.handle}: ${clip.caption}`}
      </p>

      <div className="shorts-chrome-body">
        <div className="shorts-chrome-top">
          <span className="shorts-wordmark">Shorts</span>
          <div className="shorts-chrome-top-actions">
            <span className="shorts-icon-btn shorts-icon-search" aria-hidden="true">
              <Search size={24} strokeWidth={2} />
            </span>
            <span className="shorts-icon-btn shorts-icon-camera" aria-hidden="true">
              <Camera size={24} strokeWidth={1.9} />
            </span>
          </div>
        </div>

        <div className="shorts-rail">
          <button
            type="button"
            className="shorts-rail-btn focus-ring"
            data-pressed={liked || undefined}
            aria-pressed={liked}
            aria-label={liked ? "Remove like" : "Like this Short"}
            onClick={handleLike}
          >
            <Glyph d={liked ? GLYPH.thumbUpSolid : GLYPH.thumbUp} />
            <span>{formatCount(votes.like)}</span>
          </button>
          <button
            type="button"
            className="shorts-rail-btn focus-ring"
            data-pressed={disliked || undefined}
            aria-pressed={disliked}
            aria-label={disliked ? "Remove dislike" : "Dislike this Short"}
            onClick={handleDislike}
          >
            <Glyph d={disliked ? GLYPH.thumbDownSolid : GLYPH.thumbDown} />
            <span>{formatCount(votes.dislike)}</span>
          </button>
          <button
            type="button"
            className="shorts-rail-btn focus-ring"
            aria-label="Comments (turned off)"
            onClick={() => setCommentsOpen(true)}
          >
            <Glyph d={GLYPH.comment} />
            <span>0</span>
          </button>
          <span className="shorts-rail-btn" aria-hidden="true">
            <Glyph d={GLYPH.share} />
            <span>Share</span>
          </span>
          <span className="shorts-rail-btn shorts-rail-more" aria-hidden="true">
            <Glyph d={GLYPH.more} />
          </span>
          <ChannelAvatar clip={clip} className="shorts-rail-disc" />
        </div>

        <div className="shorts-meta">
          <div className="shorts-meta-channel">
            <ChannelAvatar clip={clip} className="shorts-avatar" />
            <span className="shorts-handle">{clip.handle}</span>
            <span className="shorts-subscribe" aria-hidden="true">Subscribe</span>
          </div>
          <p className="shorts-caption">{clip.caption}</p>
          <div className="shorts-sound">
            <Glyph d={GLYPH.note} />
            <span className="shorts-sound-track">
              <span key={clip.id} className="shorts-sound-marquee">
                {`${clip.channelName} · original audio`}
                <span aria-hidden="true">
                  {` · ${clip.channelName} · original audio`}
                </span>
              </span>
            </span>
          </div>
        </div>
      </div>

      <CommentsOffSnackbar open={commentsOpen} onClose={closeCommentsSnackbar} />

      <nav className="shorts-nav" aria-label="App navigation">
        <span className="shorts-tab" aria-hidden="true">
          <House size={24} strokeWidth={1.7} />
          <span>Home</span>
        </span>
        <button
          type="button"
          className="shorts-tab focus-ring"
          data-active=""
          aria-current="page"
        >
          <Glyph d={GLYPH.shortsTab} evenOdd />
          <span>Shorts</span>
        </button>
        <span className="shorts-tab shorts-tab-create" aria-hidden="true">
          <CirclePlus size={26} strokeWidth={1.7} />
        </span>
        <span className="shorts-tab" aria-hidden="true">
          <Glyph d={GLYPH.subscriptions} />
          <span>Subscriptions</span>
        </span>
        <button
          type="button"
          className="shorts-tab shorts-tab-you focus-ring"
          onClick={enableAbout ? onAbout : undefined}
          aria-haspopup={enableAbout ? "dialog" : undefined}
          aria-label={
            enableAbout ? "Me — about Kelly Mullaney" : "Me (display only)"
          }
        >
          <MeAvatar size={24} className="shorts-you-avatar" />
          <span>Me</span>
        </button>
      </nav>
    </div>
  );
}
