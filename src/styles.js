export const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(255,47,179,.26), transparent 30%), radial-gradient(circle at bottom right, rgba(255,255,255,.13), transparent 25%), linear-gradient(135deg,#050008,#0b0012,#000)",
    color: "#f5f5f7",
    padding: 28,
    fontFamily: "Arial, sans-serif"
  },

  header: {
    maxWidth: 1360,
    margin: "0 auto 24px",
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap"
  },

  badge: {
    display: "inline-block",
    marginBottom: 12,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,47,179,.16)",
    border: "1px solid rgba(255,47,179,.42)",
    color: "#ff8bd8",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1.1
  },

  title: {
    fontSize: 56,
    margin: 0,
    fontWeight: 950,
    background: "linear-gradient(90deg,#fff,#ff2fb3,#d9d9e3)",
    WebkitBackgroundClip: "text",
    color: "transparent"
  },

  subtitle: {
    color: "rgba(245,245,247,.72)",
    maxWidth: 820,
    lineHeight: 1.5
  },

  actions: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap"
  },

  selectTop: {
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,47,179,.28)",
    background: "rgba(0,0,0,.45)",
    color: "#fff",
    fontWeight: 800,
    outline: "none"
  },

  whiteButton: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg,#ffffff,#cfcfd8)",
    color: "#050008",
    padding: "14px 18px",
    borderRadius: 16,
    fontWeight: 900,
    cursor: "pointer",
    border: "none"
  },

  pinkButton: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg,#ff2fb3,#8b0057)",
    color: "white",
    padding: "14px 18px",
    borderRadius: 16,
    fontWeight: 900,
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,.14)"
  },

  workspace: {
    maxWidth: 1360,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.75fr) 440px",
    gap: 22
  },

  panel: {
    background: "rgba(255,255,255,.075)",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 28,
    padding: 18,
    boxShadow: "0 24px 80px rgba(0,0,0,.38)"
  },

  preview: {
    position: "relative",
    width: "100%",
    background: "#000",
    overflow: "hidden",
    borderRadius: 24,
    border: "1px solid rgba(255,47,179,.35)"
  },

  empty: {
    height: "100%",
    minHeight: 330,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,.62)",
    textAlign: "center",
    padding: 24
  },

  previewBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: 18,
    background: "linear-gradient(to top,rgba(0,0,0,.85),transparent)"
  },

  input: {
    width: "100%",
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,47,179,.25)",
    background: "rgba(0,0,0,.42)",
    color: "#f5f5f7",
    outline: "none",
    marginBottom: 8
  },

  textarea: {
    width: "100%",
    minHeight: 74,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,47,179,.25)",
    background: "rgba(0,0,0,.42)",
    color: "#f5f5f7",
    outline: "none",
    marginBottom: 8,
    resize: "vertical"
  },

  label: {
    display: "block",
    marginTop: 14,
    marginBottom: 7,
    color: "rgba(245,245,247,.82)",
    fontWeight: 850
  },

  secondaryButton: {
    marginTop: 12,
    width: "100%",
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.16)",
    background: "linear-gradient(135deg,rgba(255,47,179,.22),rgba(255,255,255,.08))",
    color: "#f5f5f7",
    fontWeight: 900,
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8
  },

  range: {
    width: "100%",
    accentColor: "#ff2fb3"
  },

  muted: {
    color: "rgba(245,245,247,.58)"
  },

  mutedSmall: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "rgba(245,245,247,.55)"
  },

  progressBox: {
    marginTop: 14,
    background: "rgba(0,0,0,.3)",
    border: "1px solid rgba(255,47,179,.22)",
    borderRadius: 14,
    padding: 12
  },

  progressText: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    color: "rgba(245,245,247,.78)",
    marginBottom: 8
  },

  progressTrack: {
    width: "100%",
    height: 10,
    background: "rgba(255,255,255,.12)",
    borderRadius: 999,
    overflow: "hidden"
  },

  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg,#ff2fb3,#fff)",
    borderRadius: 999,
    transition: "width .2s ease"
  },

  timelineItem: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    background: "rgba(0,0,0,.32)",
    borderRadius: 16,
    padding: 10,
    cursor: "grab",
    marginBottom: 10
  },

  thumb: {
    width: 90,
    height: 55,
    objectFit: "cover",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.14)"
  },

  deleteButton: {
    border: 0,
    borderRadius: 10,
    padding: 9,
    color: "white",
    background: "rgba(255,47,179,.22)",
    cursor: "pointer"
  },

  subtitleBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.12)"
  },

  tabRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 14
  },

  miniButton: {
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 12,
    padding: 10,
    background: "rgba(255,255,255,.08)",
    color: "white",
    cursor: "pointer",
    fontWeight: 800
  }
};