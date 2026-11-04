// app/api/tts/route.js — #184: POST /api/tts { text } → mp3 (thay POST /tts của máy chủ Express cũ).
// Cùng tên miền với trang → không cần CORS, không cần Heroku khi người học dùng.
// #476 Giọng chính Kokoro (DeepInfra) → lỗi / hết tiền / chưa đặt khoá thì Google. Tiêu đề X-TTS-May: kokoro | google
// (trình duyệt phát Google ở tốc độ 0,9, Kokoro giữ 1). Lỗi Kokoro ghi `loi_web` (xem ở /quanlinhomhoc).
import { getCacheHash, readMongoCache, writeMongoCache, generateAudioBuffer, generateKokoro, coKokoro } from "@/lib/tts";
import { getCollection } from "@/lib/mongodb";

export const runtime = "nodejs"; // driver MongoDB cần Node, không chạy ở Edge
export const dynamic = "force-dynamic";
export const maxDuration = 30; // chữ dài phải gọi Google nhiều đoạn

const audio = (buf, may) =>
  new Response(buf, {
    headers: { "Content-Type": "audio/mpeg", "Content-Disposition": 'inline; filename="speech.mp3"', "X-TTS-May": may, "Access-Control-Expose-Headers": "X-TTS-May" },
  });

// ghi lỗi Kokoro về loi_web — mỗi phiên chạy máy chủ tối đa 1 dòng / 10 phút cho mỗi loại lỗi (hết tiền thì không ghi dồn)
const daGhi = globalThis.__dpTtsLoi || (globalThis.__dpTtsLoi = new Map());
async function ghiLoi(err) {
  const loai = err?.status === 402 || err?.status === 429 ? "tts-kokoro-tien" : err?.status === 401 || err?.status === 403 ? "tts-kokoro-khoa" : "tts-kokoro";
  const truoc = daGhi.get(loai) || 0;
  if (Date.now() - truoc < 600e3) return;
  daGhi.set(loai, Date.now());
  try {
    await (await getCollection("loi_web")).insertOne({ loai, chiTiet: String(err?.message || err).slice(0, 300) + " → dung Google", trang: "/api/tts", ua: "may chu", luc: new Date() });
  } catch {
    /* bỏ qua */
  }
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return new Response("Missing text", { status: 400 });
  if (text.length > 2000) return new Response("Text too long", { status: 413 });

  // Tầng 1: Kokoro (MongoDB rồi DeepInfra)
  if (coKokoro()) {
    const hk = getCacheHash(text, "kokoro");
    const ck = await readMongoCache(hk);
    if (ck) return audio(ck, "kokoro");
    try {
      const buf = await generateKokoro(text);
      await writeMongoCache(hk, buf, text, "kokoro");
      return audio(buf, "kokoro");
    } catch (err) {
      console.error("Kokoro TTS error:", err?.message);
      await ghiLoi(err);
    }
  }

  // Tầng 2: Google (MongoDB rồi Google TTS)
  const hg = getCacheHash(text, "google");
  const cached = await readMongoCache(hg);
  if (cached) return audio(cached, "google");
  try {
    const buf = await generateAudioBuffer(text);
    await writeMongoCache(hg, buf, text, "google");
    return audio(buf, "google");
  } catch (err) {
    console.error("TTS error:", err);
    return new Response("TTS failed", { status: 500 });
  }
}
