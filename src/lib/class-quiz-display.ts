export function formatClassQuizDateRange(opensAt: string, closesAt: string): string {
  const o = new Date(opensAt);
  const c = new Date(closesAt);
  const fmt = (d: Date) =>
    d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  return `${fmt(o)} – ${fmt(c)}`;
}

export function classQuizWindowState(
  nowMs: number,
  opensAt: string,
  closesAt: string,
): { inWindow: boolean; windowLabel: string } {
  const open = new Date(opensAt).getTime();
  const close = new Date(closesAt).getTime();
  const before = nowMs < open;
  const after = nowMs > close;
  const inWindow = nowMs >= open && nowMs <= close;
  let windowLabel = "Open now";
  if (before) windowLabel = "Upcoming";
  if (after) windowLabel = "Closed";
  return { inWindow, windowLabel };
}
