import { YOUTUBE_ID_PATTERN } from "@/lib/youtube";

function assertYouTubeId(videoId: string): void {
  if (!YOUTUBE_ID_PATTERN.test(videoId)) {
    throw new Error(`malformed YouTube video ID "${videoId}"`);
  }
}

export function buildYouTubeThumbnailUrl(videoId: string): string {
  assertYouTubeId(videoId);

  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}
