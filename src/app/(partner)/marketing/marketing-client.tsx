"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Eye, Share2, Download, Link2, Shuffle,
  Image as ImageIcon, FileText, Layout, Mail, AlertCircle, Loader2,
} from "lucide-react";
import { FaXTwitter, FaFacebookF, FaWhatsapp, FaTelegram, FaLinkedinIn } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { getRandomMessage, type PromotionalMessage } from "@/lib/promotional-messages";
import {
  getTwitterShareUrl, getFacebookShareUrl, getWhatsAppShareUrl,
  getTelegramShareUrl, getLinkedInShareUrl,
} from "@/lib/share-utils";

/* ─── Types ──────── */
interface Material {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  thumbnailUrl: string | null;
  downloadCount: number;
  createdAt: string;
}

interface Props {
  materials: Material[];
  referralLink: string | null;
  partnerName: string;
}

interface ImageDimensions {
  width: number;
  height: number;
  orientation: "landscape" | "portrait" | "square";
}

/* ─── Helpers ──────── */
const IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"];

function isImageType(fileType: string): boolean {
  return IMAGE_TYPES.includes(fileType.toLowerCase());
}

const CATEGORY_LABELS: Record<string, string> = {
  ALL: "All",
  BANNER: "Banners",
  SOCIAL_MEDIA: "Social Media",
  EMAIL_TEMPLATE: "Email Templates",
  LANDING_PAGE: "Landing Pages",
  OTHER: "Other",
};

const categoryIcons: Record<string, typeof ImageIcon> = {
  BANNER: ImageIcon,
  SOCIAL_MEDIA: Layout,
  EMAIL_TEMPLATE: Mail,
  LANDING_PAGE: Layout,
  OTHER: FileText,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(url: string, fileType: string): string {
  const ext = fileType.toLowerCase();
  if (ext && ext !== "unknown") return ext;
  const match = url.match(/\.(\w+)(?:\?|$)/);
  return match ? match[1] : "file";
}

/* Detect image dimensions from URL */
function useImageDimensions(url: string | null): ImageDimensions | null {
  const [dims, setDims] = useState<ImageDimensions | null>(null);
  useEffect(() => {
    if (!url) { setDims(null); return; }
    const img = new window.Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      setDims({
        width: img.width,
        height: img.height,
        orientation: ratio > 1.1 ? "landscape" : ratio < 0.9 ? "portrait" : "square",
      });
    };
    img.src = url;
  }, [url]);
  return dims;
}

/* ─── Share Button Config ──────── */
const SHARE_PLATFORMS = [
  { id: "twitter", label: "X / Twitter", icon: FaXTwitter, color: "bg-slate-700/50 hover:bg-slate-600/50 text-white", getUrl: getTwitterShareUrl },
  { id: "facebook", label: "Facebook", icon: FaFacebookF, color: "bg-blue-600/15 hover:bg-blue-600/25 text-blue-400", getUrl: getFacebookShareUrl },
  { id: "whatsapp", label: "WhatsApp", icon: FaWhatsapp, color: "bg-green-600/15 hover:bg-green-600/25 text-green-400", getUrl: getWhatsAppShareUrl },
  { id: "telegram", label: "Telegram", icon: FaTelegram, color: "bg-sky-500/15 hover:bg-sky-500/25 text-sky-400", getUrl: getTelegramShareUrl },
  { id: "linkedin", label: "LinkedIn", icon: FaLinkedinIn, color: "bg-blue-500/15 hover:bg-blue-500/25 text-blue-300", getUrl: getLinkedInShareUrl },
];

/* ─── Fetch image as File for sharing ──────── */
async function fetchImageFile(url: string, filename: string): Promise<File | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export function MarketingMaterialsClient({ materials, referralLink }: Props) {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [shareMessage, setShareMessage] = useState<PromotionalMessage | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);

  /* Image dimensions for lightbox */
  const lightboxDims = useImageDimensions(
    selectedMaterial && isImageType(selectedMaterial.fileType) ? selectedMaterial.fileUrl : null
  );

  /* Category counts */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: materials.length };
    for (const m of materials) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }
    return counts;
  }, [materials]);

  /* Filter materials */
  const filteredMaterials = useMemo(
    () => activeCategory === "ALL" ? materials : materials.filter((m) => m.category === activeCategory),
    [materials, activeCategory]
  );

  /* Available categories */
  const availableCategories = useMemo(() => {
    const cats = ["ALL"];
    for (const key of Object.keys(CATEGORY_LABELS)) {
      if (key !== "ALL" && categoryCounts[key]) cats.push(key);
    }
    return cats;
  }, [categoryCounts]);

  /* Open lightbox */
  function openLightbox(material: Material) {
    setSelectedMaterial(material);
    setShareMessage(getRandomMessage());
  }

  /* Shuffle message */
  function shuffleMessage() {
    setShareMessage(getRandomMessage());
  }

  /* Share to platform — includes image via Web Share API where supported */
  const handleShare = useCallback(async (
    platformId: string,
    getUrl: (p: { text: string; url: string }) => string
  ) => {
    if (!referralLink || !shareMessage || !selectedMaterial) return;

    const shareText = `${shareMessage.text}\n\n${referralLink}`;
    const isImage = isImageType(selectedMaterial.fileType);

    /* Try Web Share API with image file (works on mobile + some desktops) */
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare && isImage) {
      setSharing(platformId);
      const ext = getFileExtension(selectedMaterial.fileUrl, selectedMaterial.fileType);
      const filename = `${selectedMaterial.title.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
      const file = await fetchImageFile(selectedMaterial.fileUrl, filename);

      if (file && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            text: shareText,
            files: [file],
          });
          setSharing(null);
          return;
        } catch {
          // User cancelled or error — fall through to URL share
        }
      }
      setSharing(null);
    }

    /* Fallback: URL-based share (opens in popup) */
    const url = getUrl({ text: shareMessage.text, url: referralLink });
    window.open(url, "_blank", "width=600,height=500,noopener,noreferrer");
  }, [referralLink, shareMessage, selectedMaterial]);

  /* Download: fetch blob and trigger real file download */
  const handleDownload = useCallback(async (materialId: string, fileUrl: string, title: string, fileType: string) => {
    setDownloading(materialId);
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const ext = getFileExtension(fileUrl, fileType);
      const filename = `${title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.${ext}`;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      // Track download
      fetch("/api/partner/marketing/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId }),
      }).catch(() => {});
    } catch {
      // Fallback: open URL directly
      window.open(fileUrl, "_blank");
    } finally {
      setDownloading(null);
    }
  }, []);

  if (materials.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="No materials yet"
        description="Marketing materials will appear here when uploaded by admin."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Referral Link Banner ─── */}
      {referralLink ? (
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-800/50 to-emerald-500/10 border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-sm font-medium text-slate-300">Your Referral Link:</span>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2 border border-slate-700/50 min-w-0">
            <code className="text-sm text-amber-400 truncate flex-1">{referralLink}</code>
            <CopyButton text={referralLink} />
          </div>
        </div>
      ) : (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">Referral link not set up</p>
            <p className="text-xs text-slate-400 mt-0.5">Contact admin to get your referral link. Sharing will be available once your link is active.</p>
          </div>
        </div>
      )}

      {/* ─── Category Filter Pills ─── */}
      {availableCategories.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeCategory === cat
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/50 hover:text-slate-300"
              }`}
            >
              {CATEGORY_LABELS[cat] || cat} ({categoryCounts[cat] || 0})
            </button>
          ))}
        </div>
      )}

      {/* ─── Masonry Asset Grid ─── */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
        {filteredMaterials.map((m) => {
          const isImage = isImageType(m.fileType);
          const CatIcon = categoryIcons[m.category] || FileText;

          return (
            <div key={m.id} className="break-inside-avoid mb-4">
              <Card className="bg-slate-800/50 border-slate-700 rounded-xl overflow-hidden hover:bg-slate-800 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-200 group">
                {/* Image / Icon Preview — natural size, no cropping */}
                <div
                  className="relative cursor-pointer overflow-hidden"
                  onClick={() => openLightbox(m)}
                >
                  {isImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.thumbnailUrl || m.fileUrl}
                        alt={m.title}
                        className="w-full h-auto block"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 bg-slate-900">
                      <CatIcon className="w-12 h-12 text-slate-600" />
                      <span className="text-xs text-slate-500 uppercase font-medium tracking-wider">{m.fileType}</span>
                    </div>
                  )}

                  {/* "Your link embedded" badge */}
                  {referralLink && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <Link2 className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] text-amber-400 font-medium">Your link embedded</span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Card Content — compact overlay-style at bottom */}
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold text-white truncate">{m.title}</h3>
                      {m.description && (
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{m.description}</p>
                      )}
                    </div>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap shrink-0">
                      {CATEGORY_LABELS[m.category] || m.category}
                    </span>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openLightbox(m)}
                      className="flex-1 h-7 text-[10px] text-slate-300 hover:text-white hover:bg-slate-700/50 gap-1 px-2"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openLightbox(m)}
                      className="flex-1 h-7 text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1 px-2"
                      disabled={!referralLink}
                    >
                      <Share2 className="w-3 h-3" /> Share
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(m.id, m.fileUrl, m.title, m.fileType)}
                      disabled={downloading === m.id}
                      className="h-7 text-[10px] text-slate-400 hover:text-white hover:bg-slate-700/50 px-2"
                    >
                      {downloading === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* ─── Lightbox Dialog ─── */}
      <Dialog open={!!selectedMaterial} onOpenChange={(open) => { if (!open) setSelectedMaterial(null); }}>
        <DialogContent
          className={`bg-slate-900 border-slate-700 p-0 gap-0 max-h-[92vh] overflow-y-auto ${
            lightboxDims?.orientation === "portrait"
              ? "max-w-4xl"
              : "max-w-2xl"
          }`}
        >
          {selectedMaterial && (
            <>
              {/* Image Preview — adapts to orientation */}
              <div className="relative bg-slate-950">
                {isImageType(selectedMaterial.fileType) ? (
                  lightboxDims?.orientation === "portrait" ? (
                    /* Portrait: side-by-side layout — image left, controls right */
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/2 flex items-center justify-center p-4 bg-slate-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedMaterial.fileUrl}
                          alt={selectedMaterial.title}
                          className="max-w-full max-h-[75vh] object-contain rounded-lg"
                        />
                      </div>
                      <div className="md:w-1/2 p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                        <LightboxControls
                          material={selectedMaterial}
                          referralLink={referralLink}
                          shareMessage={shareMessage}
                          onShuffle={shuffleMessage}
                          onShare={handleShare}
                          onDownload={handleDownload}
                          downloading={downloading}
                          sharing={sharing}
                          dims={lightboxDims}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Landscape / Square: stacked layout — image on top */
                    <>
                      <div className="flex items-center justify-center p-4 bg-slate-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedMaterial.fileUrl}
                          alt={selectedMaterial.title}
                          className="max-w-full max-h-[50vh] object-contain rounded-lg"
                        />
                      </div>
                      <div className="p-6 space-y-5">
                        <LightboxControls
                          material={selectedMaterial}
                          referralLink={referralLink}
                          shareMessage={shareMessage}
                          onShuffle={shuffleMessage}
                          onShare={handleShare}
                          onDownload={handleDownload}
                          downloading={downloading}
                          sharing={sharing}
                          dims={lightboxDims}
                        />
                      </div>
                    </>
                  )
                ) : (
                  /* Non-image file */
                  <>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      {(() => { const CatIcon = categoryIcons[selectedMaterial.category] || FileText; return <CatIcon className="w-16 h-16 text-slate-600" />; })()}
                      <span className="text-sm text-slate-500 uppercase tracking-wider">{selectedMaterial.fileType} file</span>
                    </div>
                    <div className="p-6 space-y-5">
                      <LightboxControls
                        material={selectedMaterial}
                        referralLink={referralLink}
                        shareMessage={shareMessage}
                        onShuffle={shuffleMessage}
                        onShare={handleShare}
                        onDownload={handleDownload}
                        downloading={downloading}
                        sharing={sharing}
                        dims={null}
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LIGHTBOX CONTROLS (shared between layouts)
   ═══════════════════════════════════════════════ */
function LightboxControls({
  material, referralLink, shareMessage, onShuffle, onShare, onDownload, downloading, sharing, dims,
}: {
  material: Material;
  referralLink: string | null;
  shareMessage: PromotionalMessage | null;
  onShuffle: () => void;
  onShare: (platformId: string, getUrl: (p: { text: string; url: string }) => string) => void;
  onDownload: (id: string, url: string, title: string, type: string) => void;
  downloading: string | null;
  sharing: string | null;
  dims: ImageDimensions | null;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-white text-lg">{material.title}</DialogTitle>
        {material.description && (
          <DialogDescription className="text-slate-400 text-sm">
            {material.description}
          </DialogDescription>
        )}
        {dims && (
          <p className="text-[10px] text-slate-500 mt-1">
            {dims.width} × {dims.height}px · {dims.orientation} · {formatFileSize(material.fileSize)}
          </p>
        )}
      </DialogHeader>

      {/* Referral Link */}
      {referralLink ? (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-amber-400" />
            Your Referral Link
          </label>
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2.5 border border-slate-700/50">
            <code className="text-sm text-amber-400 truncate flex-1">{referralLink}</code>
            <CopyButton text={referralLink} />
          </div>
        </div>
      ) : (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400">Your referral link hasn&apos;t been set up yet. Contact admin to start sharing.</p>
        </div>
      )}

      {/* Share Message */}
      {referralLink && shareMessage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-400">Share Message</label>
            <button
              onClick={onShuffle}
              className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Shuffle className="w-3 h-3" /> New message
            </button>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <p className="text-sm text-slate-300 italic leading-relaxed">&ldquo;{shareMessage.text}&rdquo;</p>
          </div>
        </div>
      )}

      {/* Share Buttons */}
      {referralLink && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">Share to (includes image on mobile)</label>
          <div className="flex flex-wrap gap-2">
            {SHARE_PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => onShare(platform.id, platform.getUrl)}
                disabled={sharing === platform.id}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${platform.color} disabled:opacity-50`}
                title={`Share to ${platform.label}`}
              >
                {sharing === platform.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <platform.icon className="w-3.5 h-3.5" />
                }
                <span className="hidden sm:inline">{platform.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Download Button */}
      <div className="pt-2 border-t border-slate-700/50">
        <Button
          onClick={() => onDownload(material.id, material.fileUrl, material.title, material.fileType)}
          disabled={downloading === material.id}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 gap-2"
        >
          {downloading === material.id
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Downloading...</>
            : <><Download className="w-4 h-4" /> Download Original <span className="text-xs text-slate-400">({formatFileSize(material.fileSize)})</span></>
          }
        </Button>
      </div>
    </>
  );
}
