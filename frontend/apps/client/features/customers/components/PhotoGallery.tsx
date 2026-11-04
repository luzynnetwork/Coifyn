import type { CutRecordPhoto } from "@coifyn/api-client";

export function PhotoGallery({ photos }: { photos: CutRecordPhoto[] }) {
  const shown = photos.filter((p) => p.url);
  if (shown.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {shown.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={p.id} src={p.url as string} alt={`${p.angle} view`} className="h-24 w-24 rounded object-cover" />
      ))}
    </div>
  );
}
