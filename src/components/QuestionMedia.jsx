import { useState } from "react";

export function getImageData(value, fallbackAlt = "Gambar soal") {
  if (!value) return null;
  if (typeof value === "string") return { url: value.trim(), alt: fallbackAlt };
  if (typeof value !== "object") return null;
  const url = String(value.url || value.src || "").trim();
  if (!url) return null;
  return {
    url,
    alt: String(value.alt || fallbackAlt).trim(),
  };
}

export function isAllowedImageUrl(value) {
  const image = getImageData(value);
  if (!image?.url) return false;
  return /^(https:\/\/|\/(?!\/)|data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml);base64,)/i.test(image.url);
}

export default function QuestionMedia({
  image,
  alt = "Gambar soal",
  compact = false,
  zoomable = true,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const data = getImageData(image, alt);

  if (!data || failed) {
    return data ? (
      <div className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 ${className}`}>
        Gambar tidak dapat dimuat. Deskripsi: {data.alt}
      </div>
    ) : null;
  }

  const picture = (
    <img
      src={data.url}
      alt={data.alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${compact ? "max-h-40" : "max-h-[28rem]"} mx-auto h-auto max-w-full object-contain`}
    />
  );

  return (
    <>
      <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950 ${className}`}>
        {zoomable ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="block w-full cursor-zoom-in"
            aria-label={`Perbesar ${data.alt}`}
          >
            {picture}
          </button>
        ) : picture}
        {zoomable && <p className="mt-2 text-center text-[11px] text-slate-500">Ketuk gambar untuk memperbesar</p>}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={data.alt}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-900 shadow-lg"
          >
            Tutup
          </button>
          <img
            src={data.url}
            alt={data.alt}
            className="max-h-full max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
