import { LoaderCircle } from "lucide-react";

export function AccessLoading() {
  return (
    <div aria-live="polite" className="mx-auto max-w-md px-4 py-24 text-center" role="status">
      <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-forest-600" />
      <h1 className="mt-4 text-2xl font-extrabold text-ink">Loading...</h1>
      <p className="mt-3 text-slate-500">Checking your account access.</p>
    </div>
  );
}
