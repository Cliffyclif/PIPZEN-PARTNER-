"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ExternalLink, Loader2, Upload } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  duration: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface UploadResult {
  info: {
    secure_url: string;
    format: string;
    bytes: number;
    original_filename: string;
    resource_type: string;
    duration?: number;
  };
}

export function TrainingClient({ initialResources }: { initialResources: Resource[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [resources, setResources] = useState(initialResources);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("VIDEO");
  const [url, setUrl] = useState("");
  const [duration, setDuration] = useState("");

  function resetForm() {
    setTitle("");
    setDescription("");
    setType("VIDEO");
    setUrl("");
    setDuration("");
    setShowForm(false);
  }

  function handleUploadSuccess(result: UploadResult) {
    const info = result.info;
    setUrl(info.secure_url);
    setTitle(info.original_filename);
    if (info.duration) setDuration(String(Math.round(info.duration)));
    if (info.resource_type === "video") setType("VIDEO");
    else setType("PDF");
    setShowForm(true);
  }

  async function handleSave() {
    if (!title || !url) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          type,
          url,
          duration: duration ? Number(duration) : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const data = await res.json();
      setResources([...resources, data.resource]);
      resetForm();
      toast({ title: "Resource added successfully" });
      router.refresh();
    } catch {
      toast({ title: "Failed to save resource", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/training?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setResources(resources.filter((r) => r.id !== id));
      toast({ title: "Resource deleted" });
      router.refresh();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      {!showForm && (
        <div className="flex gap-3">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add by URL
          </Button>
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            onSuccess={(result) => handleUploadSuccess(result as unknown as UploadResult)}
            options={{
              maxFiles: 1,
              resourceType: "auto",
              sources: ["local", "url"],
            }}
          >
            {({ open }) => (
              <Button
                onClick={() => open()}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            )}
          </CldUploadWidget>
        </div>
      )}

      {/* Add Resource Form */}
      {showForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Add Training Resource</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder="Resource title"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">Description (optional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder="Brief description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="ARTICLE">Article</SelectItem>
                    <SelectItem value="COURSE">Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Duration in seconds (optional)</label>
                <Input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g. 300"
                  type="number"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">URL</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder="https://youtube.com/watch?v=... or file URL"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving || !title || !url} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Resource
              </Button>
              <Button variant="ghost" onClick={resetForm} className="text-slate-400 hover:text-white">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resources List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">All Resources ({resources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No resources added yet.</p>
          ) : (
            <div className="space-y-3">
              {resources.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{r.title}</p>
                    <p className="text-xs text-slate-400">
                      {r.type}
                      {r.duration ? ` \u00b7 ${Math.round(r.duration / 60)} min` : ""}
                      {" \u00b7 "}
                      <span className={r.isActive ? "text-emerald-400" : "text-red-400"}>
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                    </p>
                    {r.description && <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span>
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                    >
                      {deletingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
