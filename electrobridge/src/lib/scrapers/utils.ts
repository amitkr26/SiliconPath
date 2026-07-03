export function cleanTitle(title: string, organization: string): string {
  let t = title.trim();

  // "invites applications from eligible doctors for the post of [X]" → "[X] — [Org]"
  const postMatch = t.match(/for the post of\s+(.+?)(?:\s+on\s+contract|\s+in\s+the|\s*$)/i);
  if (postMatch) {
    return `${postMatch[1].trim()} — ${organization}`;
  }

  // "Junior Research Fellow in [Area] at [Lab]" → "JRF — [Lab Name]"
  if (/junior research fellow/i.test(t)) {
    const labMatch = t.match(/at\s+(.+?)(?:\s+-\s+|\s*$)/i);
    const lab = labMatch ? labMatch[1].trim() : organization;
    return `JRF — ${lab}`;
  }

  // "Senior Research Fellow" → "SRF — [Org]"
  if (/senior research fellow/i.test(t)) {
    const labMatch = t.match(/at\s+(.+?)(?:\s+-\s+|\s*$)/i);
    const lab = labMatch ? labMatch[1].trim() : organization;
    return `SRF — ${lab}`;
  }

  // Remove trailing "apply by..." or "last date..." or "deadline..."
  t = t.replace(/\s*[-–]\s*(?:apply\s+by|last\s+date|deadline).*$/i, "").trim();

  return t;
}

export function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
