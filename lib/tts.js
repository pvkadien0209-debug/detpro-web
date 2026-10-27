// lib/tts.js — #184: phần xử lý âm thanh tách từ SEO-PT-projectjs/server/server.js (route POST /tts), giữ nguyên cách làm:
// md5 của chữ → cache MongoDB `tts_audio_cache` → không có thì Google TTS (en, đọc chậm), > 200 ký tự thì cắt câu, tạo song song, nối mp3.
// Bỏ tầng cache đĩa và hàng đợi trong bộ nhớ: máy chủ Vercel không giữ tệp / bộ nhớ giữa các lượt gọi.
import "server-only";
import crypto from "crypto";
import * as googleTTS from "google-tts-api";
import { getCollection } from "./mongodb";

export const TTS_MAX_CHUNK_LENGTH = 200; // giới hạn ký tự/lần gọi của google-tts-api
export const TTS_MONGO_COLLECTION = "tts_audio_cache";

export const getCacheHash = (text) => crypto.createHash("md5").update(text).digest("hex");

// BSON Binary -> Buffer (driver có thể trả về Binary thay vì Buffer thuần)
function toNodeBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value?.buffer) return Buffer.from(value.buffer);
  return Buffer.from(value);
}

export async function readMongoCache(hash) {
  try {
    const col = await getCollection(TTS_MONGO_COLLECTION);
    const doc = await col.findOne({ _id: hash }, { projection: { audio: 1 } });
    return doc ? toNodeBuffer(doc.audio) : null;
  } catch (err) {
    // MongoDB lỗi không được làm hỏng luồng TTS chính
    console.warn("⚠️ Không đọc được TTS cache từ MongoDB:", err.message);
    return null;
  }
}

// Có await (khác bản Express "bắn rồi quên"): hàm máy chủ có thể bị dừng ngay sau khi trả lời → ghi dở.
// Chỉ chạy khi phải gọi Google TTS (đã chậm sẵn), lỗi thì bỏ qua.
export async function writeMongoCache(hash, buffer, text) {
  try {
    const col = await getCollection(TTS_MONGO_COLLECTION);
    await col.updateOne(
      { _id: hash },
      { $set: { audio: buffer, textLength: text.length, lastAccessedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.warn("⚠️ Không ghi được TTS cache vào MongoDB:", err.message);
  }
}

// Tách text thành các đoạn ≤ maxLength ký tự (theo câu, rồi theo từ) — giữ nguyên bản cũ
export function splitText(text, maxLength = TTS_MAX_CHUNK_LENGTH) {
  if (text.length <= maxLength) return [text];
  const chunks = [];
  let current = "";
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
  for (let sentence of sentences) {
    sentence = sentence.trim();
    if (!sentence) continue;
    if ((current + sentence + ". ").length <= maxLength) {
      current += sentence + ". ";
    } else {
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }
      if (sentence.length > maxLength) {
        const words = sentence.split(" ");
        let wordChunk = "";
        for (const word of words) {
          if ((wordChunk + word + " ").length <= maxLength) {
            wordChunk += word + " ";
          } else {
            if (wordChunk.trim()) chunks.push(wordChunk.trim());
            wordChunk = word + " ";
          }
        }
        if (wordChunk.trim()) current = wordChunk;
      } else {
        current = sentence + ". ";
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

// 1 lần gọi Google TTS
async function createAudioBuffer(text) {
  const url = googleTTS.getAudioUrl(text, { lang: "en", slow: true });
  const audioRes = await fetch(url);
  if (!audioRes.ok) throw new Error(`Google TTS ${audioRes.status}`);
  return Buffer.from(await audioRes.arrayBuffer());
}

// Tạo mới qua Google TTS (khi cache trượt); nhiều đoạn thì gọi song song, nối theo đúng thứ tự
export async function generateAudioBuffer(text) {
  if (text.length <= TTS_MAX_CHUNK_LENGTH) return createAudioBuffer(text);
  const buffers = await Promise.all(splitText(text).map(createAudioBuffer));
  return buffers.length === 1 ? buffers[0] : Buffer.concat(buffers);
}
