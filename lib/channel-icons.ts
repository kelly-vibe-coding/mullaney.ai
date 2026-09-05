/** Channel avatar map for Shorts feed clips. Every key must match a current
 *  FEED_CLIPS id (see channel-icons.test.ts). Clips without an entry fall back
 *  to a monogram avatar. */

const CHANNEL_ICON_BY_CLIP_ID: Readonly<Record<string, string>> = {
  "ai-and-jobs-counter-W2F-mv6aMpg": "/channel-icons/thediaryofaceo.jpg",
  "ai-and-jobs-lead-fdSE53Va9NU": "/channel-icons/danmartell.jpg",
  "ai-creativity-counter-8q28bnr8-RU": "/channel-icons/alexanderexplain.jpg",
  "ai-creativity-lead-nHr70oCixPE": "/channel-icons/smarterin30s.jpg",
  "ai-development-should-pause-counter-_zff_TWYGYY": "/channel-icons/educause.jpg",
  "ai-development-should-pause-lead-uQhQ_YRges4": "/channel-icons/theinsideview.jpg",
  "ai-extinction-risk-is-serious-counter-YE5adUeTe_I": "/channel-icons/controlai.jpg",
  "ai-extinction-risk-is-serious-lead-c2CeH5K7gXA": "/channel-icons/theaientrepreneurs.jpg",
  "ai-progress-pace-counter-ommGCd5T5xE": "/channel-icons/claudeaiclass.jpg",
  "ai-progress-pace-lead-tvipv5681pY": "/channel-icons/brainpowerpodcast.jpg",
  "ai-regulation-enables-progress-counter-xpIGqnQtkE0": "/channel-icons/mccbrussels.jpg",
  "ai-regulation-enables-progress-lead-4tld8AyVzLE": "/channel-icons/aljazeeraenglish.jpg",
  "anthropic-is-beating-openai-counter-4e2xU8f4iVQ": "/channel-icons/theinformation.jpg",
  "anthropic-is-beating-openai-lead-wm9DoI5R4NI": "/channel-icons/victorhinvesting.jpg",
  "cursor-vs-claude-code-counter-MYlhHT0X2tU": "/channel-icons/verify.jpg",
  "cursor-vs-claude-code-lead-T1Z2JRoifA8": "/channel-icons/verify.jpg",
  "learning-to-code-counter-A1OgJJ0hgCk": "/channel-icons/foundermindsetp.jpg",
  "learning-to-code-lead-SCjnJZok2KA": "/channel-icons/kenaazpatel.jpg",
  "multi-agent-systems-are-production-ready-counter-HXzoRT9gEAc": "/channel-icons/tomorrowunveiledchannel.jpg",
  "multi-agent-systems-are-production-ready-lead-DMQn3BRAT-g": "/channel-icons/command.jpg",
  "prompt-engineering-counter-kOueGuDPOkc": "/channel-icons/quickupdatebynikku.jpg",
  "prompt-engineering-lead-rcN8LYaERv0": "/channel-icons/trendscopedai.jpg",
  "scaling-laws-counter-DOCo62x8Qq8": "/channel-icons/signallabsproduction.jpg",
  "scaling-laws-lead-FVEtdw8sQ2E": "/channel-icons/theaicutofficial.jpg",
  "software-engineering-careers-counter-5PjwT2_JN6M": "/channel-icons/decodeiq1.jpg",
  "software-engineering-careers-lead-ffqdK7TiCyc": "/channel-icons/offlineonair.jpg",
  "ubi-is-the-answer-to-ai-unemployment-counter-3m9ZIdr2K4A": "/channel-icons/iealondon.jpg",
  "ubi-is-the-answer-to-ai-unemployment-lead-ul1gGoOcIOs": "/channel-icons/ubiworks.jpg",
};

export function getChannelIconUrl(clipId: string): string | null {
  return CHANNEL_ICON_BY_CLIP_ID[clipId] ?? null;
}

export { CHANNEL_ICON_BY_CLIP_ID };
