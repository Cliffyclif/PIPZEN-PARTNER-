// CRM message bodies may be plain text or basic HTML. We only ever render them
// as text, so HTML from the CRM can never run in the portal.
export function htmlToPlainText(html: string, keepLineBreaks = true) {
  const breaks = keepLineBreaks ? "\n" : " ";
  const text = html
    .replace(/<br\s*\/?>/gi, breaks)
    .replace(/<\/(p|div|li|h[1-6])>/gi, breaks)
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
  return keepLineBreaks
    ? text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
    : text.replace(/\s+/g, " ").trim();
}

// Route params may or may not arrive percent-decoded; decode at most once.
export function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
