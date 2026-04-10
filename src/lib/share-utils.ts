interface ShareParams {
  text: string;
  url: string;
}

export function getTwitterShareUrl({ text, url }: ShareParams): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export function getFacebookShareUrl({ url }: ShareParams): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function getWhatsAppShareUrl({ text, url }: ShareParams): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`;
}

export function getTelegramShareUrl({ text, url }: ShareParams): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function getLinkedInShareUrl({ url }: ShareParams): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

export function canUseWebShareAPI(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}

export async function triggerWebShare({ text, url }: ShareParams): Promise<boolean> {
  if (!canUseWebShareAPI()) return false;
  try {
    await navigator.share({ text: `${text}\n\n${url}`, url });
    return true;
  } catch {
    return false;
  }
}
