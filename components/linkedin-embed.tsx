type LinkedInEmbedProps = {
  src: string;
  title?: string;
  height?: number;
};

export function LinkedInEmbed({
  src,
  title = "Embedded post",
  height = 541,
}: LinkedInEmbedProps) {
  return (
    <div className="blog-linkedin-embed">
      <iframe
        src={src}
        title={title}
        height={height}
        width={504}
        frameBorder={0}
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
