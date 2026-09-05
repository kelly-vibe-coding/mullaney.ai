# mullaney.ai engineering handoff

## What this is

Personal site for Kelly Mullaney, VP of Internal Applied AI at Juniper Square. The home page pairs a short bio with a phone-frame YouTube Shorts feed. Each feed pair puts two confident, opposing AI takes back to back.

- Live: https://mullaney.ai
- Repo: https://github.com/kelly-vibe-coding/mullaney.ai
- Branch: `master`
- Host: Vercel Hobby, team `kellyrmullaney-5147`, project `mullaney.ai`
- Contact: `kelly@mullaney.ai`

Production deploys are manual: `npx vercel deploy --prod`. Push Git separately.

## Product rules

- Pair clips that clearly disagree about the same claim. Verify the transcript, not just the title.
- Order each pair lead then counter.
- Do not place the same topic in consecutive pairs. `validateFeedOrder` checks this.
- Keep the bio factual, human, and confident without sounding arrogant. Kelly is not a software engineer.
- Do not add referral or ChatGPT-first-login bullets.
- Keep the phone as the main visual on desktop.
- Read `AGENTS.md` and the installed Next.js docs before using unfamiliar Next.js APIs.
- Feed editorial guidance lives in `docs/FEED-EDITORIAL.md`.

## Important paths

| Path | Role |
| --- | --- |
| `app/page.tsx` | Home page layout |
| `components/shorts-shell.tsx` | Feed shell, page-level wheel and keyboard controls, About state |
| `components/shorts-feed.tsx` | Snap feed, looping, mute state, voting, auto-advance |
| `components/youtube-embed.tsx` | YouTube IFrame API and player controls |
| `components/shorts-chrome.tsx` | In-phone controls and reaction rail |
| `components/scroll-hint.tsx` | Orange desktop scroll hint above the phone |
| `components/iphone-frame.tsx` | Desktop phone frame and responsive scale |
| `components/about-sheet.tsx` | Mobile About sheet |
| `components/bio.tsx` | Shared bio copy and links |
| `lib/feed.ts` | Production clip registry and order validation |
| `lib/feed-loop.ts` | Infinite-feed index helpers |
| `lib/votes/*` | Vote IDs, cookies, reaction math, and Redis access |
| `app/api/votes/*` | Vote read and write routes |
| `lib/posts.ts` | MDX post loading and metadata |
| `app/blog/*` | Blog index and post routes |
| `content/blog/*` | Published MDX posts |
| `styles/*.css` | Hand-authored CSS (site, feed, phone, About, blog); imported by `app/globals.css` |

## UX behaviors to preserve

- The desktop scroll hint sits above the phone and keeps its orange accent.
- The hint root is a `div`. Buttons inside a `p` cause a hydration error.
- The arrow buttons stay clickable after the text nudge disappears.
- The in-phone “Scroll the feed” cue disappears after the first advance.
- Playback starts muted. Mute state persists while moving through the feed.
- A video ending advances to the next Short unless About is open.
- Mobile About opens from the Me tab and fills the screen. Desktop shows the bio beside the phone.
- iOS swipe, autoplay, and fixed-overlay workarounds must survive refactors.

## Git ignore notes

`.gitignore` covers scratch tooling and local-only routes. The Vercel CLI uploads the working tree, so keep local review routes out of `app/` before a production deploy.

## Verify

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Smoke-test desktop wheel and arrow paging, the scroll hint, mute, auto-advance, and the side bio. Smoke-test the mobile full-bleed feed and About sheet on a real iPhone when touch behavior changes.

## Ship checklist

1. Run the verification commands.
2. Review staged files. Keep scratch files and local tools out.
3. Commit and push the product changes.
4. Run `npx vercel deploy --prod`.
5. Check https://mullaney.ai on desktop and mobile.
6. Confirm local-only routes did not ship.

## Open items

- The blog is live but has few posts.
- Security headers and YouTube nocookie are optional follow-ups.
- New feed pairs should favor underused themes and pass transcript review.
