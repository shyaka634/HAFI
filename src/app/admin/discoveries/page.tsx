"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, ImagePlus, Megaphone, Pencil, Plus, Trash2, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AccessLoading } from "@/components/access-loading";
import { DiscoveryMedia, isDiscoveryVideo } from "@/features/discoveries/components/discovery-media";
import { authClient } from "@/lib/auth/client";
import type { AppUser } from "@/lib/types";

type Placement = "TOP" | "TOP_SECONDARY" | "SIDE";
type Discovery = {
  id: string;
  title: string;
  description: string;
  imageBase64: string;
  link: string | null;
  placement: Placement;
  published: boolean;
};

const MAX_LOCAL_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_LOCAL_VIDEO_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];

const placementInfo: Record<Placement, { label: string; guide: string; ratio: string }> = {
  TOP: {
    label: "Top banner 1 (left)",
    guide: "Use a wide, high-quality image or video. For uploads, use at least 1200 × 300 px and an aspect ratio between 3:1 and 5:1.",
    ratio: "Recommended: 1920 × 600 px (16:5)",
  },
  TOP_SECONDARY: {
    label: "Top banner 2 (right)",
    guide: "Use a different wide, high-quality image or video. It appears beside Top banner 1.",
    ratio: "Recommended: 1920 by 600 px (16:5)",
  },
  SIDE: {
    label: "Side Discovery banner",
    guide: "Use a landscape image or video that looks good in the Discoveries column. For uploads, use at least 900 × 360 px.",
    ratio: "Recommended: 1200 × 525 px (16:7)",
  },
};

export default function AdminDiscoveriesPage() {
  const [allowed, setAllowed] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [items, setItems] = useState<Discovery[]>([]);
  const [editing, setEditing] = useState<Discovery | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/discoveries?all=true");
    if (response.ok) setItems(await response.json());
  }

  useEffect(() => {
    authClient.getSession().then(async ({ data }) => {
      const user = (data?.user as AppUser | undefined) ?? null;
      const canManage = user?.role === "SUPER_ADMIN";
      setAllowed(canManage);
      if (canManage) await load();
    }).catch(() => setAllowed(false)).finally(() => setCheckingAccess(false));
  }, []);

  async function save(form: HTMLFormElement) {
    setSaving(true);
    setNotice("");
    const data = new FormData(form);
    const placement = data.get("placement");
    if (placement !== "TOP" && placement !== "TOP_SECONDARY" && placement !== "SIDE") {
      setSaving(false);
      setNotice("Choose where this banner should appear.");
      return;
    }

    const file = data.get("mediaFile");
    // A file input cannot be pre-filled by the browser. When editing an
    // existing local upload, keep its current media unless a replacement is
    // selected or a different URL is entered.
    let mediaUrl = String(data.get("mediaUrl") ?? "").trim() || editing?.imageBase64 || "";

    if (file instanceof File && file.size > 0) {
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
      if (!isImage && !isVideo) {
        setSaving(false);
        setNotice("Choose a PNG, JPEG, WebP, GIF, MP4, WebM, or Ogg file.");
        return;
      }

      const limit = isVideo ? MAX_LOCAL_VIDEO_BYTES : MAX_LOCAL_IMAGE_BYTES;
      if (file.size > limit) {
        setSaving(false);
        setNotice(isVideo ? "Choose a video smaller than 8 MB." : "Choose an image smaller than 2 MB.");
        return;
      }

      const sizeMessage = await validateBannerSize(file, placement);
      if (sizeMessage) {
        setSaving(false);
        setNotice(sizeMessage);
        return;
      }

      mediaUrl = await fileToDataUrl(file);
    }

    if (!mediaUrl) {
      setSaving(false);
      setNotice("Add an image or video URL, or choose a media file from your device.");
      return;
    }

    const body = {
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
      imageUrl: mediaUrl,
      link: String(data.get("link") ?? "") || null,
      placement,
    };
    const response = await fetch(editing ? `/api/discoveries/${editing.id}` : "/api/discoveries", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? body : { ...body, link: body.link ?? undefined, published: true }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return setNotice(result.error ?? "The banner could not be saved.");
    setNotice(editing ? "Banner updated." : `${placementInfo[placement].label} published.`);
    setEditing(null);
    form.reset();
    load();
  }

  async function toggle(item: Discovery) {
    const response = await fetch(`/api/discoveries/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !item.published }),
    });
    const result = await response.json();
    setNotice(response.ok ? `Banner ${item.published ? "hidden" : "shown"}.` : result.error);
    if (response.ok) load();
  }

  async function remove(item: Discovery) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    const response = await fetch(`/api/discoveries/${item.id}`, { method: "DELETE" });
    const result = await response.json();
    setNotice(response.ok ? "Banner deleted." : result.error);
    if (response.ok) load();
  }

  if (checkingAccess) return <AccessLoading />;
  if (!allowed) return <Access />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-700"><Megaphone className="h-6 w-6" /></span>
        <h1 className="mt-5 text-3xl font-extrabold text-ink">Manage Discoveries</h1>
        <p className="mt-2 max-w-2xl text-slate-500">Publish independent advertisements for Top banner 1, Top banner 2, and the side Discovery area. Each slot has its own media and action link.</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {(["TOP", "TOP_SECONDARY", "SIDE"] as Placement[]).map((placement) => <Card className="p-5" key={placement}><p className="text-sm font-extrabold text-forest-700">{placementInfo[placement].label}</p><p className="mt-2 text-sm leading-6 text-slate-500">{placementInfo[placement].guide}</p><p className="mt-3 text-xs font-bold text-ink">{placementInfo[placement].ratio}</p></Card>)}
      </div>

      <Card className="mt-8 p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><h2 className="font-extrabold text-ink">{editing ? "Edit banner" : "New banner"}</h2><p className="mt-1 text-sm text-slate-500">Choose the placement first, then select media made for that banner space.</p></div>
          {editing && <Button onClick={() => setEditing(null)} size="sm" type="button" variant="ghost"><X className="h-4 w-4" />Cancel edit</Button>}
        </div>

        <form className="grid gap-4 sm:grid-cols-2" key={editing?.id ?? "new"} onSubmit={(event) => { event.preventDefault(); save(event.currentTarget); }}>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Banner placement</span>
            <select className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-ink outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-50" defaultValue={editing?.placement ?? "SIDE"} name="placement">
              <option value="TOP">Top header banner — very wide media</option>
              <option value="SIDE">Side Discovery banner — landscape media</option>
              <option value="TOP_SECONDARY">Top banner 2 (right)</option>
            </select>
          </label>
          <Input defaultValue={editing?.title} name="title" placeholder="Banner title (optional)" />
          <Input defaultValue={editing?.imageBase64.startsWith("data:") ? "" : editing?.imageBase64} name="mediaUrl" placeholder="Public image or video URL (optional)" type="url" />
          <textarea className="min-h-24 rounded-xl border p-3 text-sm outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-50 sm:col-span-2" defaultValue={editing?.description} name="description" placeholder="What should people know? (optional)" />
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-700"><ImagePlus className="h-4 w-4 text-forest-700" />Choose an image or video from this device</span>
            <input accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/ogg" className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-forest-50 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-forest-700 hover:file:bg-forest-100" name="mediaFile" type="file" />
            <span className="mt-1 block text-xs text-slate-500">Images: maximum 2 MB. Videos: MP4, WebM, or Ogg, maximum 8 MB. Local uploads are checked for suitable banner dimensions. When editing, leave this empty to keep the current media.</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Optional action link</span>
            <Input defaultValue={editing?.link ?? ""} name="link" placeholder="https://example.com" type="url" />
            <span className="mt-1 block text-xs text-slate-500">Visitors can use this link to learn more, shop, or contact the advertiser.</span>
          </label>
          <div className="sm:col-span-2"><Button disabled={saving} type="submit">{editing ? <><Pencil className="h-4 w-4" />{saving ? "Saving..." : "Save changes"}</> : <><Plus className="h-4 w-4" />{saving ? "Publishing..." : "Publish banner"}</>}</Button></div>
        </form>
        {notice && <p className="mt-4 text-sm font-bold text-forest-700">{notice}</p>}
      </Card>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {items.map((item) => <Card className="overflow-hidden" key={item.id}>
          <div className="flex gap-4 p-4">
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100"><DiscoveryMedia alt="" className="h-full w-full" source={item.imageBase64} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-extrabold text-ink">{item.title}</p><span className="rounded-full bg-forest-50 px-2 py-1 text-[10px] font-bold text-forest-700">{placementInfo[item.placement].label}</span>{isDiscoveryVideo(item.imageBase64) && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-lake-50 px-2 py-1 text-[10px] font-bold text-lake-600"><Video className="h-3 w-3" />Video</span>}</div><p className="mt-1 max-h-10 overflow-hidden text-sm leading-5 text-slate-500">{item.description}</p></div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${item.published ? "bg-forest-50 text-forest-700" : "bg-slate-100 text-slate-600"}`}>{item.published ? "Published" : "Hidden"}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => toggle(item)} size="sm" variant="secondary">{item.published ? <><EyeOff className="h-4 w-4" />Hide</> : <><Eye className="h-4 w-4" />Show</>}</Button><Button onClick={() => { setEditing(item); window.scrollTo({ top: 0, behavior: "smooth" }); }} size="sm" variant="secondary"><Pencil className="h-4 w-4" />Edit</Button><Button onClick={() => remove(item)} size="sm" variant="danger"><Trash2 className="h-4 w-4" />Delete</Button></div>
            </div>
          </div>
        </Card>)}
      </div>
      {!items.length && <Card className="mt-8 p-10 text-center text-sm text-slate-500">No banners have been created yet.</Card>}
    </div>
  );
}

async function validateBannerSize(file: File, placement: Placement) {
  const { width, height } = await getMediaDimensions(file);
  const ratio = width / height;
  const topValid = width >= 1200 && height >= 300 && ratio >= 3 && ratio <= 5;
  const sideValid = width >= 900 && height >= 360 && ratio >= 1.6 && ratio <= 3;

  if (placement === "TOP_SECONDARY" && !topValid) return "For Top banner 2, choose media at least 1200 by 300 px with a wide 3:1 to 5:1 shape.";
  if (placement === "TOP" && !topValid) return "For a top header banner, choose media at least 1200 × 300 px with a wide 3:1 to 5:1 shape.";
  if (placement === "SIDE" && !sideValid) return "For a side banner, choose landscape media at least 900 × 360 px with a 1.6:1 to 3:1 shape.";
  return "";
}

function getMediaDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const source = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(source);
    if (file.type.startsWith("image/")) {
      const image = new Image();
      image.onload = () => { cleanup(); resolve({ width: image.naturalWidth, height: image.naturalHeight }); };
      image.onerror = () => { cleanup(); reject(new Error("The image dimensions could not be read.")); };
      image.src = source;
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => { cleanup(); resolve({ width: video.videoWidth, height: video.videoHeight }); };
    video.onerror = () => { cleanup(); reject(new Error("The video dimensions could not be read.")); };
    video.src = source;
  });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The selected media could not be read."));
    reader.readAsDataURL(file);
  });
}

function Access() {
  return <div className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-extrabold text-ink">Access unavailable</h1><p className="mt-3 text-slate-500">Only a super administrator can manage Discoveries.</p></div>;
}
