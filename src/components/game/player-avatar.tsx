export function PlayerAvatar({
  name,
  seed,
  url,
  size = "medium",
}: {
  name: string;
  seed?: string;
  url?: string;
  size?: "small" | "medium" | "large";
}) {
  const hue = [...(seed || name)].reduce((total, char) => total + char.charCodeAt(0), 0) % 360;
  return (
    <span
      className={`player-avatar avatar-${size}`}
      style={{ "--avatar-hue": hue } as React.CSSProperties}
      aria-label={`Avatar di ${name}`}
    >
      {url ? (
        <img src={url} alt="" referrerPolicy="no-referrer" />
      ) : (
        <span>{name.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  );
}
