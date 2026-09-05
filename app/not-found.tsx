import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <div>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-text">That page does not exist.</p>
        <p className="not-found-links">
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/blog">Blog</Link>
        </p>
      </div>
    </main>
  );
}
