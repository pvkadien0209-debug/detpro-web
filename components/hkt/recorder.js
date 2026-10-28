"use client";
// #230 Học cùng — ghi âm bằng MediaRecorder (giọng Nghe nói cho người hướng dẫn, tin giọng Hỏi đáp ≤ 2 phút).
// iPhone/iPad: vừa ghi vừa nhận giọng dễ treo micro (#045) → KHÔNG ghi kèm khi đang nhận giọng (canRecordWithSpeech = false);
// tin giọng Hỏi đáp (không nhận giọng) vẫn ghi được.

const isIOS = () =>
  typeof navigator !== "undefined" && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export const canRecord = () => typeof window !== "undefined" && !!window.MediaRecorder && !!navigator.mediaDevices?.getUserMedia;
export const canRecordWithSpeech = () => canRecord() && !isIOS();

function pickMime() {
  const list = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return list.find((m) => window.MediaRecorder.isTypeSupported?.(m)) || "";
}

/**
 * Bắt đầu ghi. Trả { stop(): Promise<{blob, ms}|null>, cancel() }.
 * maxMs: tự dừng (Hỏi đáp: 120 000). onTick(ms) mỗi 250 ms.
 */
export async function startRecording({ maxMs = 0, onTick, onAutoStop } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const mime = pickMime();
  const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 24000 });
  const chunks = [];
  const t0 = Date.now();
  let done = null;
  let timer = null;
  const finished = new Promise((resolve) => {
    rec.ondataavailable = (e) => e.data?.size && chunks.push(e.data);
    rec.onstop = () => {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      resolve(chunks.length ? { blob: new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" }), ms: Date.now() - t0 } : null);
    };
  });
  rec.start(500);
  timer = setInterval(() => {
    const ms = Date.now() - t0;
    onTick?.(ms);
    if (maxMs && ms >= maxMs && rec.state === "recording") {
      rec.stop();
      onAutoStop?.();
    }
  }, 250);
  return {
    stop() {
      if (!done) {
        if (rec.state !== "inactive") rec.stop();
        done = finished;
      }
      return done;
    },
    cancel() {
      chunks.length = 0;
      if (rec.state !== "inactive") rec.stop();
      else stream.getTracks().forEach((t) => t.stop());
    },
  };
}
