import Link from "next/link";

const ABOUT_FACTS = [
  "These days I run Internal Applied AI at Juniper Square",
  "Before that I was SVP of Education at Envestnet for a long stretch",
  "Started in tax, then moved into investing",
  "I build most things in Cursor now, including this site",
  "At work we’re a Claude shop",
  "I teach people to use AI and manage the engineers building our internal tools",
  "Humbled former amateur boxer",
  "Into home improvement projects",
  "Trying to live up to my three-year-old’s expectations",
  "I hope scrolling the phone doesn’t give you whiplash",
] as const;

function renderFact(fact: string, index: number) {
  if (index === 0) {
    const [before, after] = fact.split("Juniper Square");
    return (
      <>
        {before}
        <a
          href="https://www.junipersquare.com"
          target="_blank"
          rel="noreferrer"
        >
          Juniper Square
        </a>
        {after}
      </>
    );
  }

  return fact;
}

export function Bio({ compact = false }: { compact?: boolean }) {
  return (
    <div className="bio" data-compact={compact || undefined}>
      <h1 className="bio-name">Kelly Mullaney</h1>
      <p className="bio-line">We’re all AI experts on social media.</p>

      <p className="bio-section-label">Some things about me:</p>
      <ul className="bio-list">
        {ABOUT_FACTS.map((fact, index) => (
          <li key={fact}>{renderFact(fact, index)}</li>
        ))}
      </ul>

      <p className="bio-section-label">Some things I’ve put out:</p>
      <ul className="bio-list">
        <li>
          <Link href="/blog">Blog</Link>
        </li>
        <li>
          <Link href="/blog/on-the-celab-podcast">CELab podcast</Link>
        </li>
      </ul>

      <p className="bio-section-label">Where to find me:</p>
      <ul className="bio-list">
        <li>
          <a
            href="https://www.linkedin.com/in/kelly-mullaney-ced"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        </li>
        <li>
          <a
            href="https://github.com/kelly-vibe-coding"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </li>
        <li>
          <a href="mailto:kelly@mullaney.ai">Email</a>
        </li>
      </ul>
    </div>
  );
}
