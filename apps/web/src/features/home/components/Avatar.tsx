import type { CSSProperties } from "react"

/** Teinte stable dérivée du pseudo, pour colorer les avatars sans image. */
export function hueOf(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

export const avatarInitials = (name: string) =>
  name
    .replace(/[^\p{L}\p{N}]/gu, "")
    .slice(0, 2)
    .toUpperCase() || "?"

/** Variables CSS en style inline (--c, --g…). */
export const cssVars = (vars: Record<string, string>) => vars as CSSProperties

type Props = {
  name: string
  src?: string | null
  status?: string
  className?: string
}

export function Avatar({ name, src, status, className = "" }: Props) {
  return (
    <span
      className={`av ${className}`}
      style={cssVars({ "--h": `hsl(${hueOf(name)} 70% 68%)` })}
    >
      {src ? (
        <img src={src} alt="" onError={(e) => e.currentTarget.remove()} />
      ) : (
        avatarInitials(name)
      )}
      {status && <i className={status} />}
    </span>
  )
}
