import { YOUTUBE_ID_PATTERN } from "@/lib/youtube";

export interface FeedClip {
  readonly id: string;
  readonly videoId: string;
  readonly topic: string;
  readonly channelName: string;
  readonly handle: string;
  readonly caption: string;
}

export function validateFeedOrder(clips: readonly FeedClip[]): string[] {
  const errors: string[] = [];

  if (clips.length % 2 !== 0) {
    errors.push("feed must contain an even number of clips");
  }

  const seenIds = new Map<string, number>();
  const seenVideoIds = new Map<string, number>();

  for (const [index, clip] of clips.entries()) {
    if (!YOUTUBE_ID_PATTERN.test(clip.videoId)) {
      errors.push(
        `clip at index ${index} has malformed videoId "${clip.videoId}"`,
      );
    }

    if (seenIds.has(clip.id)) {
      errors.push(
        `duplicate id "${clip.id}" at indices ${seenIds.get(clip.id)} and ${index}`,
      );
    } else {
      seenIds.set(clip.id, index);
    }

    if (seenVideoIds.has(clip.videoId)) {
      errors.push(
        `duplicate videoId "${clip.videoId}" at indices ${seenVideoIds.get(clip.videoId)} and ${index}`,
      );
    } else {
      seenVideoIds.set(clip.videoId, index);
    }
  }

  // Sides come from array order: even indices are leads, the following odd index is the counter (index % 2).
  for (let index = 0; index < clips.length; index += 2) {
    const first = clips[index];
    const second = clips[index + 1];

    if (!first || !second) {
      continue;
    }

    if (first.topic !== second.topic) {
      errors.push(
        `pair at indices ${index}/${index + 1} has mismatched topics "${first.topic}" and "${second.topic}"`,
      );
    }
  }

  // One pair per topic at a time — never linger on the same topic back-to-back.
  for (let index = 2; index < clips.length; index += 2) {
    const prevTopic = clips[index - 2]?.topic;
    const nextTopic = clips[index]?.topic;
    if (prevTopic && nextTopic && prevTopic === nextTopic) {
      errors.push(
        `topic "${nextTopic}" repeats across consecutive pairs at indices ${index - 2} and ${index}`,
      );
    }
  }

  return errors;
}

/**
 * Lead → counter only when both sides are very obviously at odds on the
 * same claim (verified beyond titles — soft/same-side/clickbait pairs stay out).
 * Front of the feed is slam-dunks only.
 */
export const FEED_CLIPS: readonly FeedClip[] = [
  {
    id: "ai-extinction-risk-is-serious-lead-c2CeH5K7gXA",
    videoId: "c2CeH5K7gXA",
    topic: "AI extinction risk is serious",
    channelName: "The AI Entrepreneurs",
    handle: "@theaientrepreneurs",
    caption: "Apocalypse thinking is delusional",
  },
  {
    id: "ai-extinction-risk-is-serious-counter-YE5adUeTe_I",
    videoId: "YE5adUeTe_I",
    topic: "AI extinction risk is serious",
    channelName: "ControlAI",
    handle: "@ControlAI",
    caption: "Altman won't rule out the end of the world",
  },
  {
    id: "ai-and-jobs-lead-fdSE53Va9NU",
    videoId: "fdSE53Va9NU",
    topic: "AI and jobs",
    channelName: "Dan Martell",
    handle: "@danmartell",
    caption: "AI is not taking your job.",
  },
  {
    id: "ai-and-jobs-counter-W2F-mv6aMpg",
    videoId: "W2F-mv6aMpg",
    topic: "AI and jobs",
    channelName: "The Diary Of A CEO",
    handle: "@TheDiaryOfACEO",
    caption: "Your job is gone in five years.",
  },
  {
    id: "learning-to-code-lead-SCjnJZok2KA",
    videoId: "SCjnJZok2KA",
    topic: "Learning to code",
    channelName: "Kenaaz Patel",
    handle: "@KenaazPatel",
    caption: "Mark Zuckerberg’s advice on Coding. Is it still worth it in the Age of AI?",
  },
  {
    id: "learning-to-code-counter-A1OgJJ0hgCk",
    videoId: "A1OgJJ0hgCk",
    topic: "Learning to code",
    channelName: "Founder Mindset",
    handle: "@foundermindset-p",
    caption: "Jensen Huang Says Learn to Code Is Dead — Study English Instead",
  },
  {
    id: "software-engineering-careers-lead-ffqdK7TiCyc",
    videoId: "ffqdK7TiCyc",
    topic: "Software engineering careers",
    channelName: "The Offline Network",
    handle: "@OfflineOnAir",
    caption: "Software Engineering is Not Dead!",
  },
  {
    id: "software-engineering-careers-counter-5PjwT2_JN6M",
    videoId: "5PjwT2_JN6M",
    topic: "Software engineering careers",
    channelName: "DecodeIQ",
    handle: "@DecodeIQ_1",
    caption: "\"Software Engineering is Dead in 12 Months? \" —Anthropic Ceo",
  },
  {
    id: "ai-eliminates-half-of-white-collar-work-lead-tOeo95CyZPQ",
    videoId: "tOeo95CyZPQ",
    topic: "AI eliminates half of white-collar work",
    channelName: "ClickDo",
    handle: "@ClickDo",
    caption: "AI Could Eliminate 50% of White-Collar Jobs—But Here’s What You Should Do Instead!",
  },
  {
    id: "ai-eliminates-half-of-white-collar-work-counter-dPwm_ykNh2g",
    videoId: "dPwm_ykNh2g",
    topic: "AI eliminates half of white-collar work",
    channelName: "AI Frontier Research",
    handle: "@AIFrontierResearch",
    caption: "AI Won’t Replace You—Someone Using AI Will #Shorts",
  },
  {
    id: "ai-creativity-lead-nHr70oCixPE",
    videoId: "nHr70oCixPE",
    topic: "AI creativity",
    channelName: "SMARTER IN 30S",
    handle: "@SMARTERIN30S",
    caption: "AI Is NOW More CREATIVE Than The Average Human",
  },
  {
    id: "ai-creativity-counter-8q28bnr8-RU",
    videoId: "8q28bnr8-RU",
    topic: "AI creativity",
    channelName: "Alexander Explains",
    handle: "@Alexander_Explain",
    caption: "Why AI Can't Be Creative",
  },
  {
    id: "claude-is-better-than-chatgpt-overall-lead-28tT8OIN6uE",
    videoId: "28tT8OIN6uE",
    topic: "Claude is better than ChatGPT overall",
    channelName: "Garrett Campbell",
    handle: "@garrettwcampbell",
    caption: "Why Claude AI is Superior to ChatGPT: A Brutally Honest Comparison",
  },
  {
    id: "claude-is-better-than-chatgpt-overall-counter-77ug2fkCXoU",
    videoId: "77ug2fkCXoU",
    topic: "Claude is better than ChatGPT overall",
    channelName: "Kyle Balmer | AI with Kyle",
    handle: "@iamkylebalmer",
    caption: "ChatGPT is probably the best all-round AI app because it can do images, video, voice, and more",
  },
  {
    id: "ai-regulation-enables-progress-lead-4tld8AyVzLE",
    videoId: "4tld8AyVzLE",
    topic: "AI regulation enables progress",
    channelName: "Al Jazeera English",
    handle: "@aljazeeraenglish",
    caption: "OpenAI’s Sam Altman: Global AI regulation ‘urgently’ needed | #ajshorts",
  },
  {
    id: "ai-regulation-enables-progress-counter-xpIGqnQtkE0",
    videoId: "xpIGqnQtkE0",
    topic: "AI regulation enables progress",
    channelName: "MCC Brussels",
    handle: "@mccbrussels",
    caption: "Europe cannot regulate its way into AI power.",
  },
  {
    id: "ubi-is-the-answer-to-ai-unemployment-lead-ul1gGoOcIOs",
    videoId: "ul1gGoOcIOs",
    topic: "UBI is the answer to AI unemployment",
    channelName: "UBI Works",
    handle: "@ubiworks",
    caption: "OpenAI CEO Sam Altman on Redistribution After AI (UBI)",
  },
  {
    id: "ubi-is-the-answer-to-ai-unemployment-counter-3m9ZIdr2K4A",
    videoId: "3m9ZIdr2K4A",
    topic: "UBI is the answer to AI unemployment",
    channelName: "Institute of Economic Affairs",
    handle: "@iealondon",
    caption: "Why Universal Basic Income Doesn't Work",
  },
  {
    id: "anthropic-is-beating-openai-lead-wm9DoI5R4NI",
    videoId: "wm9DoI5R4NI",
    topic: "Anthropic is beating OpenAI",
    channelName: "Victor H Investing",
    handle: "@victorhinvesting",
    caption: "Claude 3.5 vs. GPT-4o: Why Anthropic is Winning the AI Race",
  },
  {
    id: "anthropic-is-beating-openai-counter-4e2xU8f4iVQ",
    videoId: "4e2xU8f4iVQ",
    topic: "Anthropic is beating OpenAI",
    channelName: "The Information",
    handle: "@theinformation",
    caption: "Where OpenAI Beats Anthropic",
  },
  {
    id: "prompt-engineering-lead-rcN8LYaERv0",
    videoId: "rcN8LYaERv0",
    topic: "Prompt engineering",
    channelName: "trendscoped",
    handle: "@trendscoped-ai",
    caption: "Prompt Engineering Still Matters",
  },
  {
    id: "prompt-engineering-counter-kOueGuDPOkc",
    videoId: "kOueGuDPOkc",
    topic: "Prompt engineering",
    channelName: "Nikhil Kumar Bhagat",
    handle: "@QuickUpdateByNikku",
    caption: "Prompt Engineering Is DYING and Nobody Warned You",
  },
  {
    id: "ai-development-should-pause-lead-uQhQ_YRges4",
    videoId: "uQhQ_YRges4",
    topic: "AI development should pause",
    channelName: "The Inside View",
    handle: "@theinsideview",
    caption: "Demis Hassabis Would Advocate For A Pause If There Was International Coordination",
  },
  {
    id: "ai-development-should-pause-counter-_zff_TWYGYY",
    videoId: "_zff_TWYGYY",
    topic: "AI development should pause",
    channelName: "EDUCAUSE",
    handle: "@educause",
    caption: "The worst thing we can do about possible negative impacts of AI is avoid the tech altogether #shorts",
  },
  {
    id: "multi-agent-systems-are-production-ready-lead-DMQn3BRAT-g",
    videoId: "DMQn3BRAT-g",
    topic: "Multi-agent systems are production-ready",
    channelName: "COMMAND",
    handle: "@command",
    caption: "One AI Can't Do It All — Kye Gomez on Multi-Agent Systems | AI MASTERCLASS",
  },
  {
    id: "multi-agent-systems-are-production-ready-counter-HXzoRT9gEAc",
    videoId: "HXzoRT9gEAc",
    topic: "Multi-agent systems are production-ready",
    channelName: "TomorrowUnveiledPodcast",
    handle: "@TomorrowUnveiledChannel",
    caption: "Multi-Agent Systems: High Failure Rates in Production! #shorts",
  },
  {
    id: "ai-progress-pace-lead-tvipv5681pY",
    videoId: "tvipv5681pY",
    topic: "AI progress pace",
    channelName: "/brainpower",
    handle: "@brainpower_podcast",
    caption: "AI's Exponential Leap: 2026 Predictions & Acceleration",
  },
  {
    id: "ai-progress-pace-counter-ommGCd5T5xE",
    videoId: "ommGCd5T5xE",
    topic: "AI progress pace",
    channelName: "ClaudeAiClass",
    handle: "@ClaudeAiClass",
    caption: "Is AI Actually Getting Worse? What Slowing Progress Means For You",
  },
  {
    id: "scaling-laws-lead-FVEtdw8sQ2E",
    videoId: "FVEtdw8sQ2E",
    topic: "Scaling laws",
    channelName: "The AI Cut",
    handle: "@theaicutofficial",
    caption: "Demis Hassabis: Scaling laws are not dead, the story is more nuanced",
  },
  {
    id: "scaling-laws-counter-DOCo62x8Qq8",
    videoId: "DOCo62x8Qq8",
    topic: "Scaling laws",
    channelName: "Signal Labs",
    handle: "@SignalLabsProduction",
    caption: "OpenAI Research Chief: \"Pre-Training Is Dead\" Has Been Wrong for 10 Years",
  },
  {
    id: "cursor-vs-claude-code-lead-T1Z2JRoifA8",
    videoId: "T1Z2JRoifA8",
    topic: "Cursor vs Claude Code",
    channelName: "Command",
    handle: "@command",
    caption: "Sticking with Cursor over Claude Code.",
  },
  {
    id: "cursor-vs-claude-code-counter-MYlhHT0X2tU",
    videoId: "MYlhHT0X2tU",
    topic: "Cursor vs Claude Code",
    channelName: "Claude Code",
    handle: "@claudecode",
    caption: "Switched from Cursor to Claude Code.",
  },
  {
    id: "ai-eliminates-entry-level-jobs-lead-pRplniypesw",
    videoId: "pRplniypesw",
    topic: "AI eliminates entry-level jobs",
    channelName: "Kyle Balmer | AI with Kyle",
    handle: "@iamkylebalmer",
    caption: "Anthropic's CEO: Half of Entry-Level Jobs Will Disappear",
  },
  {
    id: "ai-eliminates-entry-level-jobs-counter-oSp3g1LoUkI",
    videoId: "oSp3g1LoUkI",
    topic: "AI eliminates entry-level jobs",
    channelName: "Anshul Kumar | plan less, finish more",
    handle: "@AnshulKumarProductivity",
    caption: "IBM Is Hiring MORE Entry-Level Workers in 2026 — Here's Why 🤯",
  },
  {
    id: "gemini-beats-chatgpt-lead-HYTWTAtgHwU",
    videoId: "HYTWTAtgHwU",
    topic: "Gemini beats ChatGPT",
    channelName: "Geezers Of Gear",
    handle: "@geezersofgear",
    caption: "Gemini 3 Pro Just CRUSHED ChatGPT 5.1! #shorts",
  },
  {
    id: "gemini-beats-chatgpt-counter-NnyQdpDyWcA",
    videoId: "NnyQdpDyWcA",
    topic: "Gemini beats ChatGPT",
    channelName: "AISkillMonarch",
    handle: "@AISkillMonarch",
    caption: "ChatGPT vs Gemini 2026 - Which AI is BETTER? Honest Review! #shorts #ai",
  },
  {
    id: "claude-beats-gpt-lead-QfCSVS-fagU",
    videoId: "QfCSVS-fagU",
    topic: "Claude beats GPT",
    channelName: "BridgeMind",
    handle: "@bridgemindai",
    caption: "Claude 4.5: FAST & INTELLIGENT! Better Than GPT? #shorts",
  },
  {
    id: "claude-beats-gpt-counter-j95E1xvRGpo",
    videoId: "j95E1xvRGpo",
    topic: "Claude beats GPT",
    channelName: "Ship the Prompt",
    handle: "@ShipthePromptAI",
    caption: "Lovable’s CEO Explains When GPT-5 Beats Anthropic #Shorts",
  },
  {
    id: "ai-will-raise-wages-lead-5TXJa__dpnI",
    videoId: "5TXJa__dpnI",
    topic: "AI will raise wages",
    channelName: "All-In Pod",
    handle: "@Allinpodcastllc",
    caption: "AI Creates Jobs & Boosts Wages: Study SHOCKS Experts! #shorts",
  },
  {
    id: "ai-will-raise-wages-counter-wfRuDon1eBc",
    videoId: "wfRuDon1eBc",
    topic: "AI will raise wages",
    channelName: "Desmond Dreckett",
    handle: "@DesmondDreckett",
    caption: "2026 AI Impact: Fewer Jobs, Slower Wage Growth #shorts",
  },
  {
    id: "gemini-beats-gpt-at-coding-lead-cypRx7Ogymw",
    videoId: "cypRx7Ogymw",
    topic: "Gemini beats GPT at coding",
    channelName: "BridgeMind",
    handle: "@bridgemindai",
    caption: "Gemini 3.1 Pro Just Beat GPT 5 in Coding Benchmarks",
  },
  {
    id: "gemini-beats-gpt-at-coding-counter-RgDLT2ef3sA",
    videoId: "RgDLT2ef3sA",
    topic: "Gemini beats GPT at coding",
    channelName: "The Metaverse Guy",
    handle: "@TheMetaverseGuy",
    caption: "Claude Opus 4.7 Just Destroyed the GPT 5.4 and Gemini 3.1 PRO",
  },
  {
    id: "ai-is-wiping-out-tech-jobs-lead-hSas_igj3m8",
    videoId: "hSas_igj3m8",
    topic: "AI is wiping out tech jobs",
    channelName: "Neil Twa",
    handle: "@voltagefba",
    caption: "123,000 tech jobs wiped out in 2026 so far. AI is now the most cited reason — not market conditions,",
  },
  {
    id: "ai-is-wiping-out-tech-jobs-counter-xkG5At-eFoE",
    videoId: "xkG5At-eFoE",
    topic: "AI is wiping out tech jobs",
    channelName: "AI: Reset To Zero",
    handle: "@MParekh",
    caption: "AI Jobs Are Actually UP — Goldman Sachs & Morgan Stanley Data | ARD #50",
  },
  {
    id: "ai-homework-should-be-legalized-lead-nETC8VVzMQ4",
    videoId: "nETC8VVzMQ4",
    topic: "AI homework should be legalized",
    channelName: "AI SaaS Stack | AI Tools & Automation",
    handle: "@AISaaSStack",
    caption: "🌍 1 Country Legalized 100% AI Homework: 7000 Unis Respond",
  },
  {
    id: "ai-homework-should-be-legalized-counter-SClBmzRt5RM",
    videoId: "SClBmzRt5RM",
    topic: "AI homework should be legalized",
    channelName: "NBC Connecticut",
    handle: "@nbcconnecticut",
    caption: "Colleges are turning to oral exams to combat AI | NBC Connecticut",
  },
];

if (process.env.NODE_ENV !== "production") {
  const feedErrors = validateFeedOrder(FEED_CLIPS);
  if (feedErrors.length > 0) {
    console.warn("validateFeedOrder found issues:", feedErrors);
  }
}
