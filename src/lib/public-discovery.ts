export type PublicDiscovery = {
  id: string;
  title: string;
  description: string;
  imageBase64: string;
  link: string | null;
  placement: string;
};

type DiscoveryRecord = PublicDiscovery & { updatedAt: Date };

// Older banner uploads were stored as Base64 text. Do not send that text in a
// page-data response: it can be several megabytes and delays the entire UI.
// The browser requests it only when the banner itself is rendered instead.
export function publicDiscovery(record: DiscoveryRecord): PublicDiscovery {
  const imageBase64 = record.imageBase64.startsWith("data:image/")
    ? `/api/discoveries/${encodeURIComponent(record.id)}/media?v=${record.updatedAt.getTime()}`
    : record.imageBase64;

  return {
    id: record.id,
    title: record.title,
    description: record.description,
    imageBase64,
    link: record.link,
    placement: record.placement,
  };
}
