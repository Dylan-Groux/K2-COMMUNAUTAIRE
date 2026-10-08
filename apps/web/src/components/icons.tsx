type IconProps = { className?: string }

export const DiscordIcon = ({ className = "size-5" }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M19.5 5.3A17 17 0 0 0 15.4 4l-.5 1a16 16 0 0 0-5.8 0L8.6 4a17 17 0 0 0-4.2 1.3c-2.6 3.9-3.3 7.7-3 11.4a17 17 0 0 0 5.1 2.6l1.2-1.7a11 11 0 0 1-1.9-.9l.5-.4a12 12 0 0 0 11.4 0l.5.4a11 11 0 0 1-2 .9l1.3 1.7a17 17 0 0 0 5-2.6c.5-4.3-.7-8.1-3-11.4ZM8.5 14.5c-1.1 0-2-1-2-2.3s.9-2.3 2-2.3 2 1 2 2.3-.9 2.3-2 2.3Zm7 0c-1.1 0-2-1-2-2.3s.9-2.3 2-2.3 2 1 2 2.3-.9 2.3-2 2.3Z" />
  </svg>
)

export const SoundIcon = ({
  muted,
  className = "size-4",
}: IconProps & { muted: boolean }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M5 10v4h3l4 3V7l-4 3H5Z" />
    {muted ? (
      <path d="m17 10 4 4m0-4-4 4" />
    ) : (
      <path d="M16 9.5a4 4 0 0 1 0 5M19 7a8 8 0 0 1 0 10" />
    )}
  </svg>
)
