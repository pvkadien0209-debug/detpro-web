// app/api/tts/route.js — #184: POST /api/tts { text } → mp3 (thay POST /tts của máy chủ Express cũ).
// Cùng tên miền với trang → không cần CORS, không cần Heroku khi người học dùng.
import { getCacheHash, readMongoCache, writeMongoCache, generateAudioBuffer } from "@/lib/tts";

export const runtime = "nodejs"; // driver MongoDB cần Node, không chạy ở Edge
export const dynamic = "force-dynamic";
export const maxDuration = 30; // chữ dài phải gọi Google nhiều đoạn

const audio = (buf) =>
  new Response(buf, {
    headers: { "Content-Type": "audio/mpeg", "Content-Disposition": 'inline; filename="speech.mp3"' },
  });

export async function POST(req) {
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return new Response("Missing text", { status: 400 });

  const hash = getCacheHash(text);

  // Tầng 1 (nay là tầng chính): MongoDB
  const cached = await readMongoCache(hash);
  if (cached) return audio(cached);

  // Tầng 2: Google TTS, rồi lưu lại MongoDB
  try {
    const buf = await generateAudioBuffer(text);
    await writeMongoCache(hash, buf, text);
    return audio(buf);
  } catch (err) {
    console.error("TTS error:", err);
    return new Response("TTS failed", { status: 500 });
  }
}
