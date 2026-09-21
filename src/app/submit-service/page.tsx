"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ImagePlus, MapPinPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/lib/types";
import { categoryLabel } from "@/features/services/service-category-copy";
import { useAppSession } from "@/providers/session-provider";

const initialForm = {
  type: "CREATE" as "CREATE" | "LOCATION_CHANGE",
  targetServiceId: "",
  name: "",
  category: "HOSPITAL" as ServiceCategory,
  district: "",
  sector: "",
  address: "",
  phone: "",
  photoBase64: "",
  latitude: "",
  longitude: "",
  notes: "",
};

const MAX_PLACE_PHOTO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_PLACE_PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export default function SubmitServicePage() {
  const { user, isLoading } = useAppSession();
  const [form, setForm] = useState(initialForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoName, setPhotoName] = useState("");
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<string[]>([...SERVICE_CATEGORIES]);

  useEffect(() => {
    if (user?.district) setForm((value) => ({ ...value, district: user.district! }));
  }, [user]);

  useEffect(() => {
    fetch("/api/categories")
      .then((response) => response.ok ? response.json() : null)
      .then((data: { categories?: string[] } | null) => {
        if (data?.categories?.length) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function useCurrentLocation() {
    setError("");

    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
      },
      () => setError("We could not get your location. Check your browser permission and try again."),
    );
  }

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");

    if (!file) {
      setForm((current) => ({ ...current, photoBase64: "" }));
      setPhotoName("");
      setPhotoFile(null);
      return;
    }

    if (!ACCEPTED_PLACE_PHOTO_TYPES.includes(file.type)) {
      event.target.value = "";
      setError("Choose a PNG, JPEG, WebP, or GIF image.");
      return;
    }

    if (file.size > MAX_PLACE_PHOTO_BYTES) {
      event.target.value = "";
      setError("Choose an image smaller than 2 MB.");
      return;
    }

    try {
      const photoBase64 = await fileToDataUrl(file);
      setForm((current) => ({ ...current, photoBase64 }));
      setPhotoName(file.name);
      setPhotoFile(file);
    } catch {
      setError("The photo could not be read. Please choose another image.");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      let photoUrl = "";
      if (photoFile) {
        const media = new FormData();
        media.set("kind", "service");
        media.set("file", photoFile);
        const uploadResponse = await fetch("/api/media/upload", { method: "POST", body: media });
        const upload = await uploadResponse.json().catch(() => null);
        if (uploadResponse.ok && typeof upload?.url === "string") photoUrl = upload.url;
        else if (upload?.code !== "MEDIA_STORAGE_NOT_CONFIGURED") {
          setError(upload?.error ?? "Your place photo could not be uploaded. Please try again.");
          return;
        }
      }
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          photoBase64: photoUrl ? "" : form.photoBase64,
          photoUrl: photoUrl || undefined,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Your update could not be submitted.");
        return;
      }

      setNotice("Your update is waiting for your province manager's review.");
      setForm({ ...initialForm, district: user?.district ?? "" });
      setPhotoName("");
      setPhotoFile(null);
      setPhotoInputKey((current) => current + 1);
    } catch {
      setError("Your update could not be submitted. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-slate-500">Checking your access…</div>;
  }

  if (!user || user.role !== "AGENT") {
    return <AccessMessage text="Only an assigned district agent can submit service updates." />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="max-w-xl">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-700">
          <MapPinPlus className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-ink">Submit a service update</h1>
        <p className="mt-2 text-slate-500">
          New locations and corrections are reviewed by the manager for your province before publication.
        </p>
      </div>

      <Card className="mt-8 p-5 sm:p-7">
        <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
          <Field label="Update type">
            <select value={form.type} onChange={(event) => update("type", event.target.value)} className="h-11 w-full rounded-xl border bg-white px-3 text-sm">
              <option value="CREATE">New service</option>
              <option value="LOCATION_CHANGE">Location change</option>
            </select>
          </Field>
          <Field label="Service category">
            <select value={form.category} onChange={(event) => update("category", event.target.value)} className="h-11 w-full rounded-xl border bg-white px-3 text-sm">
              {categories.map((category) => <option key={category} value={category}>{categoryLabel(category, "en")}</option>)}
            </select>
          </Field>
          {form.type === "LOCATION_CHANGE" && (
            <Field label="Official service ID">
              <Input required value={form.targetServiceId} onChange={(event) => update("targetServiceId", event.target.value)} placeholder="Paste the service ID" />
            </Field>
          )}
          <div className={form.type === "LOCATION_CHANGE" ? "" : "sm:col-span-2"}>
            <Field label="Service name">
              <Input required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. Kigali Community Pharmacy" />
            </Field>
          </div>
          <Field label="District"><Input required disabled value={form.district} /></Field>
          <Field label="Sector"><Input value={form.sector} onChange={(event) => update("sector", event.target.value)} placeholder="e.g. Kacyiru" /></Field>
          <div className="sm:col-span-2">
            <Field label="Street address"><Input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Street, landmark or neighborhood" /></Field>
          </div>
          <Field label="Phone number"><Input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+250 7…" /></Field>
          <div className="flex items-end">
            <Button type="button" variant="secondary" onClick={useCurrentLocation}>Use current GPS location</Button>
          </div>
          <div className="sm:col-span-2">
            <Field label={form.type === "CREATE" ? "Place photo" : "Updated place photo (optional)"}>
              <span className="mb-2 flex items-center gap-2 text-xs text-slate-500"><ImagePlus className="h-4 w-4 text-forest-700" />Add a clear photo of the building, sign, entrance, or place.</span>
              <input accept="image/png,image/jpeg,image/webp,image/gif" className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-forest-50 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-forest-700 hover:file:bg-forest-100" key={photoInputKey} onChange={choosePhoto} required={form.type === "CREATE"} type="file" />
              <span className="mt-1 block text-xs text-slate-500">PNG, JPEG, WebP, or GIF. Maximum 2 MB.{photoName ? ` Selected: ${photoName}` : ""}</span>
              {form.photoBase64 ? <img alt="Selected place" className="mt-3 h-40 w-full rounded-xl border border-slate-200 object-cover sm:max-w-sm" src={form.photoBase64} /> : null}
            </Field>
          </div>
          <Field label="Latitude"><Input required type="number" step="any" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} /></Field>
          <Field label="Longitude"><Input required type="number" step="any" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} /></Field>
          <div className="sm:col-span-2">
            <Field label="Notes for the manager">
              <textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} className="min-h-28 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-50" placeholder="What changed? Add anything that helps the reviewer." />
            </Field>
          </div>
          {error && <p className="sm:col-span-2 text-sm font-bold text-red-600">{error}</p>}
          {notice && <p className="sm:col-span-2 text-sm font-bold text-forest-700">{notice}</p>}
          <div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? "Sending…" : "Submit for review"}</Button></div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>{children}</label>;
}

function AccessMessage({ text }: { text: string }) {
  return <div className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-extrabold text-ink">Access unavailable</h1><p className="mt-3 text-slate-500">{text}</p></div>;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid photo."));
    reader.onerror = () => reject(reader.error ?? new Error("Photo read failed."));
    reader.readAsDataURL(file);
  });
}
