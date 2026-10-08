import { TRACKED_GAMES } from "../content"
import {
  activityOf,
  memberGame,
  sortMembers,
  voiceChannels,
  type Widget,
  type WidgetMember,
} from "../data/discord"
import { Avatar, cssVars } from "./Avatar"

const STATUS_LABEL: Record<string, string> = {
  idle: "Absent",
  dnd: "Ne pas déranger",
}

function MemberStatus({ member }: { member: WidgetMember }) {
  const activity = activityOf(member)
  if (!activity) return <>{STATUS_LABEL[member.status] ?? "En ligne"}</>
  const game = memberGame(member)
  return (
    <>
      Joue à{" "}
      <em
        style={cssVars({
          "--g": game ? TRACKED_GAMES[game].color : "var(--muted)",
        })}
      >
        {activity}
      </em>
    </>
  )
}

type Props = { widget: Widget; isDemo: boolean; updatedAt: number }

export function DiscordWidget({ widget, isDemo, updatedAt }: Props) {
  const channels = voiceChannels(widget)
  const time = new Date(updatedAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return (
    <aside
      className="widget"
      data-s="0"
      aria-label="Activité du serveur Discord"
    >
      <div className="w-head">
        <h3>
          <span className="dot pulse" />
          En ligne maintenant
        </h3>
        <div className="w-count">
          {isDemo && <span className="badge">Exemple</span>}
          <output>{widget.presence_count || widget.members.length}</output>
        </div>
      </div>
      <div className="w-body">
        <div className="w-sec">En vocal</div>
        {channels.length ? (
          channels.map((channel) => (
            <div className="vc" key={channel.id}>
              <div className="vc-name">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Zm7 10a7 7 0 0 1-6 6.93V22h-2v-3.07A7 7 0 0 1 5 12h2a5 5 0 0 0 10 0h2Z" />
                </svg>
                {channel.name} · {channel.members.length}
              </div>
              <div className="stack">
                {channel.members.map((m) => (
                  <Avatar key={m.id} name={m.username} src={m.avatar_url} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="vc">
            <div className="vc-name muted">Personne en vocal</div>
          </div>
        )}
        <div className="w-sec">Membres</div>
        {sortMembers(widget.members).map((m) => (
          <div className="m" key={m.id}>
            <Avatar name={m.username} src={m.avatar_url} status={m.status} />
            <div className="m-text">
              <b>{m.username}</b>
              <small>
                <MemberStatus member={m} />
              </small>
            </div>
          </div>
        ))}
      </div>
      <div className="w-foot">
        {isDemo ? "Données d’exemple" : "Widget Discord"} · mis à jour à {time}
      </div>
    </aside>
  )
}
