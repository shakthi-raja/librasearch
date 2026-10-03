"use client";

import { useEffect, useRef, useState } from "react";

type Detector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type DetectorClass = new (options: { formats: string[] }) => Detector;

/**
 * Reads a QR code or barcode from the device camera. Uses the browser's own
 * BarcodeDetector where there is one (Chrome on Android), and decodes frames
 * with jsQR everywhere else. Cameras need HTTPS, or localhost.
 */
export function CameraScanner({
  onScan,
  onClose,
  label = "Point the camera at a label or a library card",
}: {
  onScan: (text: string) => void;
  onClose: () => void;
  label?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  // focus starts on the way out, so Escape and Enter both close the camera
  useEffect(() => {
    close.current?.focus();
  }, []);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (text: string) => {
      if (stopped) return;
      stopped = true;
      for (const track of stream?.getTracks() ?? []) track.stop();
      navigator.vibrate?.(60);
      onScan(text);
    };

    (async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setProblem("The camera only works over HTTPS. Open the site through its secure address.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (error) {
        const name = (error as { name?: string }).name;
        setProblem(
          name === "NotAllowedError"
            ? "Camera access was refused. Allow it in the browser's site settings and try again."
            : "No camera could be opened on this device.",
        );
        return;
      }
      const element = video.current;
      if (!element || stopped) return;
      element.srcObject = stream;
      await element.play().catch(() => undefined);

      const Native = (window as unknown as { BarcodeDetector?: DetectorClass }).BarcodeDetector;
      const native = Native ? new Native({ formats: ["qr_code", "code_128"] }) : null;
      const jsQR = native ? null : (await import("jsqr")).default;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });

      const tick = async () => {
        if (stopped || !element.videoWidth) {
          if (!stopped) timer = setTimeout(tick, 150);
          return;
        }
        try {
          if (native) {
            const [found] = await native.detect(element);
            if (found?.rawValue) return finish(found.rawValue);
          } else if (jsQR && context) {
            canvas.width = element.videoWidth;
            canvas.height = element.videoHeight;
            context.drawImage(element, 0, 0);
            const image = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(image.data, image.width, image.height, {
              inversionAttempts: "dontInvert",
            });
            if (code?.data) return finish(code.data);
          }
        } catch {
          // a frame that cannot be read is simply skipped
        }
        timer = setTimeout(tick, 180);
      };
      tick();
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      for (const track of stream?.getTracks() ?? []) track.stop();
    };
  }, [onScan]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scanner"
      className="fixed inset-0 z-50 grid place-items-center bg-[oklch(0%_0_0/0.75)] p-[var(--space-md)]"
    >
      <div className="grid w-[min(28rem,100%)] gap-[var(--space-sm)] rounded-[var(--radius-card)] border border-ink bg-paper-2 p-[var(--space-md)]">
        <p className="text-sm font-medium">{label}</p>
        {problem ? (
          <p role="alert" className="alert">
            {problem}
          </p>
        ) : (
          <div className="relative overflow-hidden rounded-[var(--radius-sheet)] bg-ink">
            <video ref={video} muted playsInline className="aspect-square w-full object-cover" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-[18%] rounded-[var(--radius-card)] border-2 border-paper"
            />
          </div>
        )}
        <button
          ref={close}
          type="button"
          className="btn"
          onClick={onClose}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
          }}
        >
          Close the camera
        </button>
      </div>
    </div>
  );
}
