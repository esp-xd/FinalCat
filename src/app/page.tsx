"use client";

import Image from "next/image";
import { ChangeEvent, useMemo, useState } from "react";

type JudgeResult = {
  time_score: number;
  neatness_score: number;
  placement_score: number;
  working_score: number;
  total_score: number;
  comments: string;
};

type ImageSlot = 1 | 2;

const MAX_IMAGE_BYTES = 7 * 1024 * 1024;

async function fileToOptimizedDataUrl(file: File): Promise<string> {
  const loadImage =
    typeof window !== "undefined" && "createImageBitmap" in window
      ? await createImageBitmap(file)
      : await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });

  const width = "width" in loadImage ? loadImage.width : (loadImage as HTMLImageElement).naturalWidth;
  const height = "height" in loadImage ? loadImage.height : (loadImage as HTMLImageElement).naturalHeight;

  const maxDim = 2400;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to process image.");
  ctx.drawImage(loadImage as CanvasImageSource, 0, 0, targetWidth, targetHeight);

  if (!("close" in loadImage)) {
    URL.revokeObjectURL((loadImage as HTMLImageElement).src);
  }

  const attempt = (quality: number) => canvas.toDataURL("image/jpeg", quality);
  let quality = 0.92;
  let dataUrl = attempt(quality);
  while (dataUrl.length * 0.75 > MAX_IMAGE_BYTES && quality > 0.45) {
    quality -= 0.08;
    dataUrl = attempt(quality);
  }

  return dataUrl;
}

export default function Home() {
  const [minutes, setMinutes] = useState("12");
  const [seconds, setSeconds] = useState("34");
  const [isWorking, setIsWorking] = useState(true);

  const [image1File, setImage1File] = useState<File | null>(null);
  const [image2File, setImage2File] = useState<File | null>(null);

  const [result, setResult] = useState<JudgeResult | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(
    () => !!image1File && !!image2File && minutes.trim() !== "" && seconds.trim() !== "",
    [image1File, image2File, minutes, seconds],
  );

  const handleFileChange = (slot: ImageSlot, e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (slot === 1) setImage1File(selected);
    if (slot === 2) setImage2File(selected);
  };

  const validateInputs = () => {
    const mins = Number.parseInt(minutes, 10);
    const secs = Number.parseInt(seconds, 10);

    if (Number.isNaN(mins) || mins < 0 || mins > 999) return "Minutes must be between 0 and 999.";
    if (Number.isNaN(secs) || secs < 0 || secs > 59) return "Seconds must be between 0 and 59.";
    if (!image1File || !image2File) return "Please upload both images.";

    return null;
  };

  const handleJudge = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setResult(null);
    setIsLoading(true);

    try {
      const [image1DataUrl, image2DataUrl] = await Promise.all([
        fileToOptimizedDataUrl(image1File as File),
        fileToOptimizedDataUrl(image2File as File),
      ]);

      const response = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minutes: Number.parseInt(minutes, 10),
          seconds: Number.parseInt(seconds, 10),
          working: isWorking,
          images: [image1DataUrl, image2DataUrl],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Judging failed.");
      }

      setResult(data.result as JudgeResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a1a2f] px-6 py-8 text-[#FFE484] relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:48px_48px]" />

      <a href="https://hackclub.com/" target="_blank" rel="noreferrer" className="absolute left-2 top-0 z-20">
        <Image className="w-56" src="https://assets.hackclub.com/banners/2026.svg" alt="Hack Club" width={256} height={102} unoptimized />
      </a>

      <div className="relative z-10 mx-auto max-w-6xl pt-20">
        <header className="mb-10">
          <h1 className="inline-block border-b border-[#ffe57066] pb-1 text-5xl font-bold text-[#FFE570] [text-shadow:0_0_20px_rgba(255,215,0,0.55)]">
            ⚡ THE FINAL CAT !
          </h1>
          <p className="mt-2 text-lg text-[#FFDF8C]">AI JUDGE • 16–18 y/o • DIY SOLDERED PROJECTS</p>
        </header>

        <section className="rounded-3xl border border-[#FFD96666] bg-[#051428b3] p-8 shadow-2xl">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-[#FFD966]">
                ⏱️ Time of completion
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-3xl border border-[#FFD966] bg-[#0a1f35] px-3 py-1">
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="w-20 bg-transparent text-center text-2xl font-bold outline-none"
                  />
                  <span className="px-1 text-2xl text-[#FFD966]">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={seconds}
                    onChange={(e) => setSeconds(e.target.value)}
                    className="w-20 bg-transparent text-center text-2xl font-bold outline-none"
                  />
                </div>
                <span className="text-sm text-[#FFD58C]">(minutes : seconds)</span>
              </div>

              <label className="mb-2 mt-8 block text-sm font-semibold uppercase tracking-[0.2em] text-[#FFD966]">
                📸 Two images (PCB + solder joints)
              </label>
              <div className="space-y-3">
                {[1, 2].map((slot) => {
                  const file = slot === 1 ? image1File : image2File;
                  return (
                    <div key={slot} className="rounded-2xl border border-dashed border-[#FFD966] bg-[#0c1f33] p-4">
                      <label className="flex cursor-pointer items-center gap-3">
                        <span className="rounded-full border border-[#FFD966] bg-[#1e3f60] px-4 py-1 font-bold">📷 IMAGE {slot}</span>
                        <span className="max-w-[220px] truncate text-sm text-[#FFEAB3]">{file?.name ?? "No file chosen"}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => handleFileChange(slot as ImageSlot, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-[#FFD58C]">✨ Large images supported (auto-optimized before sending)</p>

              <label className="mt-8 flex items-center gap-3 rounded-full border border-[#FFD966] bg-[#0b2442] px-5 py-3 text-xl">
                <input
                  type="checkbox"
                  checked={isWorking}
                  onChange={(e) => setIsWorking(e.target.checked)}
                  className="h-6 w-6 accent-amber-400"
                />
                ✅ PROJECT IS FULLY WORKING (as reported)
              </label>
            </div>

            <div className="flex flex-col">
              <button
                onClick={handleJudge}
                disabled={!canSubmit || isLoading}
                className="w-full rounded-full border-2 border-[#FFD966] bg-gradient-to-br from-[#1e4f7a] to-[#0a2a44] px-6 py-4 text-2xl font-extrabold text-[#FFE484] disabled:cursor-not-allowed disabled:opacity-50"
              >
                ⚖️ {isLoading ? "JUDGING..." : "JUDGE MY PROJECT"}
              </button>

              <div className="mt-6 flex-1">
                <div className="mb-4 text-2xl font-bold text-[#FFD966]">📋 VERDICT</div>
                <div className="min-h-[260px] rounded-3xl border border-[#FFD966] bg-[#071524e0] p-6">
                  {isLoading && <div className="text-[#FFD966]">AI is inspecting your work...</div>}

                  {!isLoading && !result && !error && (
                    <div className="py-8 text-center text-[#FFEAB3]">
                      <span className="mb-2 block text-6xl">🐾</span>
                      Upload images & press JUDGE
                    </div>
                  )}

                  {!isLoading && error && <div className="rounded-2xl border border-red-400 bg-red-950/40 p-4 text-red-200">⚠️ {error}</div>}

                  {!isLoading && result && (
                    <>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <div className="flex justify-between border-b border-dashed border-[#FFD966] pb-2">
                          <span>⏱️ Time</span>
                          <span className="text-2xl font-extrabold">{result.time_score}/10</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-[#FFD966] pb-2">
                          <span>🔧 Neatness & joints</span>
                          <span className="text-2xl font-extrabold">{result.neatness_score}/10</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-[#FFD966] pb-2">
                          <span>📐 Placement</span>
                          <span className="text-2xl font-extrabold">{result.placement_score}/10</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-[#FFD966] pb-2">
                          <span>⚡ Functionality</span>
                          <span className="text-2xl font-extrabold">{result.working_score}/10</span>
                        </div>
                      </div>

                      <div className="mt-3 text-right text-4xl font-black text-[#FFE570]">TOTAL: {result.total_score} / 40</div>
                      <div className="mt-4 rounded-2xl border-l-4 border-[#FFC857] bg-[#0a1e34] p-4">💬 {result.comments}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-sm text-[#FFEEC2]">
          ⚡ The Final Cat! · fair judging · 4 categories: time, neatness, placement, functionality
        </p>
      </div>
    </main>
  );
}
