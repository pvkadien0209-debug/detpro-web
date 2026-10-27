// lib/mongodb.js — #184: kết nối MongoDB cho máy chủ Next.js (chuyển từ SEO-PT-projectjs/server/ulti/mongodb.js).
// #188: repo github.com/pvkadien0209-debug/detpro-web đang CÔNG KHAI → chuỗi kết nối KHÔNG viết thẳng trong tệp nữa,
// mà đọc từ biến môi trường MONGODB_URI:
//   - trên máy: tệp .env.local (đã chặn git) — tạo bằng 3-lay-chuoi-mongodb.bat (chép từ project cũ, không in ra màn hình)
//   - trên Vercel: Settings → Environment Variables → MONGODB_URI
//
// Khác bản Express:
//  - Express kết nối 1 lần lúc khởi động. Next.js (Vercel) chạy theo từng lượt gọi, có thể "nguội" bất cứ lúc nào
//    → kết nối LƯỜI (lần đầu cần mới nối) và giữ lời hẹn kết nối trên globalThis để dùng lại giữa các lượt gọi
//    (và không mở thêm kết nối mỗi lần lưu tệp khi chạy `next dev`).
//  - getDb() / getCollection() trả về Promise → gọi bằng `await`.
//  - Nối hỏng thì xoá lời hẹn để lượt sau thử lại (bản cũ phải khởi động lại máy chủ).
import "server-only"; // chặn lỡ nhập tệp này vào mã trình duyệt (lộ chuỗi kết nối)
import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "pvkadien0209_db_user";

const g = globalThis;

function clientPromise() {
  if (!uri) return Promise.reject(new Error("Thiếu MONGODB_URI (chạy 3-lay-chuoi-mongodb.bat, hoặc đặt biến trên Vercel)"));
  if (!g.__detproMongo) {
    const client = new MongoClient(uri, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
      maxPoolSize: 5, // hàm máy chủ nhỏ, không cần nhiều kết nối
    });
    g.__detproMongo = client
      .connect()
      .then(async (c) => {
        await c.db(dbName).command({ ping: 1 });
        console.log(`✅ MongoDB connected: ${dbName}`);
        return c;
      })
      .catch((err) => {
        g.__detproMongo = null; // lượt gọi sau thử nối lại
        console.error("❌ MongoDB connection error:", err.message);
        throw err;
      });
  }
  return g.__detproMongo;
}

/** Nối (nếu chưa) và trả về db. */
export async function connectMongo() {
  return (await clientPromise()).db(dbName);
}

/** Lấy db ở bất kỳ route nào — tự nối nếu chưa. */
export const getDb = connectMongo;

export async function getCollection(name) {
  return (await getDb()).collection(name);
}

export async function closeMongo() {
  if (!g.__detproMongo) return;
  const c = await g.__detproMongo.catch(() => null);
  g.__detproMongo = null;
  if (c) await c.close();
  console.log("MongoDB connection closed");
}
