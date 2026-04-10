"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Play, FileText, BookOpen, GraduationCap, Download, Eye, Clock,
  Loader2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";

/* ─── Types ──────── */
interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  duration: number | null;
  sortOrder: number;
  createdAt: string;
}

interface Props {
  resources: Resource[];
}

/* ─── Helpers ──────── */
const TYPE_CONFIG: Record<string, {
  icon: typeof Play;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  stripeFrom: string;
  stripeTo: string;
}> = {
  VIDEO: {
    icon: Play,
    label: "Video",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    stripeFrom: "from-rose-400",
    stripeTo: "to-rose-500",
  },
  PDF: {
    icon: FileText,
    label: "PDF Document",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    stripeFrom: "from-amber-400",
    stripeTo: "to-amber-500",
  },
  ARTICLE: {
    icon: BookOpen,
    label: "Article",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
    stripeFrom: "from-sky-400",
    stripeTo: "to-sky-500",
  },
  COURSE: {
    icon: GraduationCap,
    label: "Course",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    stripeFrom: "from-emerald-400",
    stripeTo: "to-emerald-500",
  },
};

const DEFAULT_CONFIG = TYPE_CONFIG.ARTICLE;

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function isExternalVideoEmbed(url: string): boolean {
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com") ||
    url.includes("loom.com")
  );
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;

  return null;
}

function isPdfUrl(url: string, type?: string): boolean {
  return type === "PDF" || url.toLowerCase().endsWith(".pdf") || (url.includes("cloudinary.com") && url.includes("/pdf"));
}

function isCloudinaryVideo(url: string): boolean {
  return url.includes("cloudinary.com") && (url.includes("/video/") || /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url));
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url) || (url.includes("cloudinary.com") && url.includes("/image/"));
}

/* ─── Decorative SVG illustrations per type ──────── */
function TypeIllustration({ type, className = "" }: { type: string; className?: string }) {
  const config = TYPE_CONFIG[type] || DEFAULT_CONFIG;
  const Icon = config.icon;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Background pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 200 120">
        <defs>
          <pattern id={`grid-${type}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="200" height="120" fill={`url(#grid-${type})`} />
      </svg>

      {/* Decorative circles */}
      <div className={`absolute top-3 right-6 w-16 h-16 rounded-full ${config.bgColor} blur-xl`} />
      <div className={`absolute bottom-3 left-8 w-12 h-12 rounded-full ${config.bgColor} blur-lg`} />

      {/* Main icon */}
      <div className={`relative w-16 h-16 rounded-2xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}>
        <Icon className={`w-8 h-8 ${config.color}`} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export function TrainingClient({ resources }: Props) {
  const [activeType, setActiveType] = useState("ALL");
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  /* Fetch PDF as blob when preview opens on a PDF resource */
  useEffect(() => {
    if (!previewResource || !isPdfUrl(previewResource.url, previewResource.type)) {
      setPdfBlobUrl(null);
      return;
    }
    let revoked = false;
    setPdfLoading(true);
    setPdfBlobUrl(null);
    fetch(previewResource.url)
      .then((res) => res.blob())
      .then((blob) => {
        if (!revoked) {
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        }
      })
      .catch(() => {})
      .finally(() => { if (!revoked) setPdfLoading(false); });
    return () => {
      revoked = true;
      setPdfBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [previewResource]);

  /* Type counts */
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: resources.length };
    for (const r of resources) {
      counts[r.type] = (counts[r.type] || 0) + 1;
    }
    return counts;
  }, [resources]);

  /* Filter */
  const filteredResources = useMemo(
    () => activeType === "ALL" ? resources : resources.filter((r) => r.type === activeType),
    [resources, activeType]
  );

  /* Available types */
  const availableTypes = useMemo(() => {
    const types = ["ALL"];
    for (const key of Object.keys(TYPE_CONFIG)) {
      if (typeCounts[key]) types.push(key);
    }
    return types;
  }, [typeCounts]);

  /* Download */
  const handleDownload = useCallback(async (resource: Resource) => {
    setDownloading(resource.id);
    try {
      const res = await fetch(resource.url);
      const blob = await res.blob();
      const ext = resource.type === "PDF" ? "pdf" : resource.type === "VIDEO" ? "mp4" : "html";
      const filename = `${resource.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.${ext}`;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(resource.url, "_blank");
    } finally {
      setDownloading(null);
    }
  }, []);

  if (resources.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No resources yet"
        description="Training resources will appear here when added by admin."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Type Filter Pills ─── */}
      {availableTypes.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {availableTypes.map((t) => {
            const cfg = TYPE_CONFIG[t];
            return (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeType === t
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/50 hover:text-slate-300"
                }`}
              >
                {t === "ALL" ? "All" : cfg?.label || t} ({typeCounts[t] || 0})
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Resource Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredResources.map((r) => {
          const config = TYPE_CONFIG[r.type] || DEFAULT_CONFIG;
          const Icon = config.icon;

          return (
            <Card
              key={r.id}
              className="bg-slate-800/50 border-slate-700 rounded-xl overflow-hidden hover:bg-slate-800 hover:shadow-lg transition-all duration-200 group"
            >
              {/* Top gradient stripe */}
              <div className={`h-1 bg-gradient-to-r ${config.stripeFrom} ${config.stripeTo}`} />

              {/* Visual header — illustration area */}
              <div
                className="relative h-36 bg-slate-900/80 cursor-pointer overflow-hidden"
                onClick={() => setPreviewResource(r)}
              >
                {r.thumbnailUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.thumbnailUrl}
                      alt={r.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                    <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor} border ${config.borderColor} backdrop-blur-sm`}>
                      <Icon className={`w-3 h-3 ${config.color}`} />
                      <span className={`text-[10px] font-medium ${config.color}`}>{config.label}</span>
                    </div>
                  </>
                ) : (
                  <TypeIllustration type={r.type} className="w-full h-full" />
                )}

                {/* Duration badge */}
                {r.duration && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <Clock className="w-2.5 h-2.5 text-slate-300" />
                    <span className="text-[10px] text-slate-300 font-medium">{formatDuration(r.duration)}</span>
                  </div>
                )}

                {/* Hover play/view overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className={`w-12 h-12 rounded-full ${config.bgColor} backdrop-blur-sm flex items-center justify-center border ${config.borderColor}`}>
                    {r.type === "VIDEO"
                      ? <Play className={`w-5 h-5 ${config.color} ml-0.5`} />
                      : <Eye className={`w-5 h-5 ${config.color}`} />
                    }
                  </div>
                </div>
              </div>

              {/* Card content */}
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">{r.title}</h3>
                    {!r.thumbnailUrl && (
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${config.bgColor} ${config.color} border ${config.borderColor} whitespace-nowrap shrink-0`}>
                        {config.label}
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{r.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreviewResource(r)}
                    className={`flex-1 h-8 text-xs gap-1.5 ${config.color} hover:${config.bgColor}`}
                  >
                    {r.type === "VIDEO" ? <Play className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {r.type === "VIDEO" ? "Watch" : "View"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(r)}
                    disabled={downloading === r.id}
                    className="h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 gap-1.5 px-3"
                  >
                    {downloading === r.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Download className="w-3.5 h-3.5" />
                    }
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ─── Preview Dialog ─── */}
      <Dialog open={!!previewResource} onOpenChange={(open) => { if (!open) setPreviewResource(null); }}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 p-0 gap-0 max-h-[92vh] overflow-hidden">
          {previewResource && (() => {
            const config = TYPE_CONFIG[previewResource.type] || DEFAULT_CONFIG;
            const isPdf = isPdfUrl(previewResource.url, previewResource.type);
            const embedUrl = getEmbedUrl(previewResource.url);
            const hasExternalEmbed = isExternalVideoEmbed(previewResource.url) && !!embedUrl;
            const isCloudVid = isCloudinaryVideo(previewResource.url);
            const isImage = isImageUrl(previewResource.url);

            return (
              <>
                {/* Header bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
                      <config.icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{previewResource.title}</h3>
                      <p className="text-[10px] text-slate-500">
                        {config.label}
                        {previewResource.duration ? ` · ${formatDuration(previewResource.duration)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(previewResource)}
                      disabled={downloading === previewResource.id}
                      className="h-8 text-xs text-slate-400 hover:text-white gap-1.5"
                    >
                      {downloading === previewResource.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5" />
                      }
                      Download
                    </Button>
                    <a href={previewResource.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="h-8 text-xs text-slate-400 hover:text-white gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" /> Open
                      </Button>
                    </a>
                  </div>
                </div>

                {/* Content area */}
                <div className="relative bg-slate-950">
                  {hasExternalEmbed ? (
                    /* YouTube / Vimeo / Loom embed */
                    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                      <iframe
                        src={embedUrl!}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={previewResource.title}
                      />
                    </div>
                  ) : isCloudVid ? (
                    /* Cloudinary / direct video file — native player */
                    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                      <video
                        src={previewResource.url}
                        className="absolute inset-0 w-full h-full bg-black"
                        controls
                        controlsList="nodownload"
                        preload="metadata"
                      >
                        Your browser does not support video playback.
                      </video>
                    </div>
                  ) : isPdf ? (
                    /* PDF — fetched as blob to bypass X-Frame-Options */
                    pdfLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                        <p className="text-sm text-slate-400">Loading PDF...</p>
                      </div>
                    ) : pdfBlobUrl ? (
                      <iframe
                        src={pdfBlobUrl}
                        className="w-full"
                        style={{ height: "75vh" }}
                        title={previewResource.title}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <FileText className="w-12 h-12 text-amber-400/50" />
                        <p className="text-sm text-slate-400">Could not load PDF preview</p>
                        <a href={previewResource.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:opacity-80 gap-2">
                            <ExternalLink className="w-4 h-4" /> Open in New Tab
                          </Button>
                        </a>
                      </div>
                    )
                  ) : isImage ? (
                    /* Image preview */
                    <div className="flex items-center justify-center p-4 max-h-[70vh] overflow-auto">
                      <img
                        src={previewResource.url}
                        alt={previewResource.title}
                        className="max-w-full max-h-[65vh] object-contain rounded"
                      />
                    </div>
                  ) : (
                    /* Fallback — info card with link */
                    <div className="flex flex-col items-center justify-center py-20 px-6 gap-5">
                      <TypeIllustration type={previewResource.type} className="w-full max-w-xs h-32" />
                      <div className="text-center max-w-md">
                        <h4 className="text-lg font-semibold text-white mb-2">{previewResource.title}</h4>
                        {previewResource.description && (
                          <p className="text-sm text-slate-400 mb-5 leading-relaxed">{previewResource.description}</p>
                        )}
                        <div className="flex items-center justify-center gap-3">
                          <a href={previewResource.url} target="_blank" rel="noopener noreferrer">
                            <Button className={`${config.bgColor} ${config.color} border ${config.borderColor} hover:opacity-80 gap-2`}>
                              <ExternalLink className="w-4 h-4" /> Open in New Tab
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            onClick={() => handleDownload(previewResource)}
                            disabled={downloading === previewResource.id}
                            className="text-slate-400 hover:text-white gap-2"
                          >
                            {downloading === previewResource.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Download className="w-4 h-4" />
                            }
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description bar */}
                {previewResource.description && (
                  <div className="px-5 py-3 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400 leading-relaxed">{previewResource.description}</p>
                  </div>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
