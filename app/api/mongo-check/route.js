// app/api/mongo-check/route.js — #184: mở /api/mongo-check để thử kết nối MongoDB (không in chuỗi kết nối).
import { connectMongo } from "@/lib/mongodb";
import { TTS_MONGO_COLLECTION } from "@/lib/tts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const t0 = Date.now();
  try {
    const db = await connectMongo();
    await db.command({ ping: 1 });
    const ttsCached = await db.collection(TTS_MONGO_COLLECTION).estimatedDocumentCount();
    return Response.json({ ok: true, db: db.databaseName, ttsCached, ms: Date.now() - t0 });
  } catch (err) {
    return Response.json({ ok: false, error: err.message, ms: Date.now() - t0 }, { status: 500 });
  }
}
