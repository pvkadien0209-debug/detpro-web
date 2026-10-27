// #190 — Toàn bộ web DetPro chạy bằng Next.js. Bản CRA và máy chủ Express đã bỏ (#189), không còn fallback.
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Trang máy chủ đọc bài từ public/jsonData (lib/data.server.js) → đưa các tệp này vào hàm máy chủ trên Vercel
  outputFileTracingIncludes: {
    "/**": ["./public/jsonData/units/**/*.json", "./public/jsonData/knowledge/**/*.json"],
  },
  // các đường /api không đọc dữ liệu bài → không mang theo
  outputFileTracingExcludes: {
    "/api/**": ["./public/jsonData/**"],
  },
  async redirects() {
    return [
      // U3-Q2 (#061): bài học 50 câu cũ → trang chủ đề
      { source: "/knowledge/:branch/:topic/:lesson/:rest*", destination: "/knowledge/:branch/:topic", permanent: true },
    ];
  },
};

export default nextConfig;
