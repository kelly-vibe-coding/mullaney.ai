import { Bio } from "@/components/bio";
import { HomeScrollLock } from "@/components/home-scroll-lock";
import { ShortsShell } from "@/components/shorts-shell";
import { FEED_CLIPS } from "@/lib/feed";

export default function HomePage() {
  return (
    <main className="home-stage site-atmosphere">
      <HomeScrollLock />
      <section className="home-bio" aria-label="About Kelly Mullaney">
        <Bio />
      </section>
      <ShortsShell clips={FEED_CLIPS} />
    </main>
  );
}
