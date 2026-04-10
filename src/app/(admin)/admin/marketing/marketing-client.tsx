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
import { Upload, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Material {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  downloadCount: number;
  isActive: boolean;
  createdAt: string;
}

interface UploadResult {
  info: {
    secure_url: string;
    format: string;
    bytes: number;
    original_filename: string;
    resource_type: string;
  };
}

export function MarketingClient({ initialMaterials }: { initialMaterials: Material[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [materials, setMaterials] = useState(initialMaterials);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state for after upload
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    type: string;
    size: number;
    name: string;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("BANNER");

  function handleUploadSuccess(result: UploadResult) {
    const info = result.info;
    setUploadedFile({
      url: info.secure_url,
      type: info.format || info.resource_type,
      size: info.bytes,
      name: info.original_filename,
    });
    setTitle(info.original_filename);
    setShowForm(true);
  }

  async function handleSave() {
    if (!uploadedFile || !title) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          category,
          fileUrl: uploadedFile.url,
          fileType: uploadedFile.type,
          fileSize: uploadedFile.size,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const data = await res.json();
      setMaterials([data.material, ...materials]);
      setShowForm(false);
      setUploadedFile(null);
      setTitle("");
      setDescription("");
      setCategory("BANNER");
      toast({ title: "Material uploaded successfully" });
      router.refresh();
    } catch {
      toast({ title: "Failed to save material", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/marketing?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setMaterials(materials.filter((m) => m.id !== id));
      toast({ title: "Material deleted" });
      router.refresh();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Button + Form */}
      {!showForm ? (
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
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Material
            </Button>
          )}
        </CldUploadWidget>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Save Uploaded Material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              File uploaded: {uploadedFile?.name}.{uploadedFile?.type}
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder="Material title"
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
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANNER">Banner</SelectItem>
                  <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                  <SelectItem value="EMAIL_TEMPLATE">Email Template</SelectItem>
                  <SelectItem value="LANDING_PAGE">Landing Page</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving || !title} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Material
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setUploadedFile(null); }} className="text-slate-400 hover:text-white">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">All Materials ({materials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No materials uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {materials.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{m.title}</p>
                    <p className="text-xs text-slate-400">{m.category.replace("_", " ")} &middot; {m.fileType} &middot; {(m.fileSize / 1024).toFixed(0)} KB</p>
                    {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-slate-500">{formatDate(m.createdAt)}</span>
                    <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                    >
                      {deletingId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
