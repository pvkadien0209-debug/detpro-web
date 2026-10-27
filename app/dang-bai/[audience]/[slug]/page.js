// /dang-bai/<người-nghe>/<bài> — Bộ bài đăng cho một bài (#175). Không cho Google lập chỉ mục.
import PostToolPage from "@/components/hkt/PostToolPage";
import ClientOnly from "@/components/next/ClientOnly";

export const metadata = { title: "Đăng bài Facebook / Zalo", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <ClientOnly>
      <PostToolPage />
    </ClientOnly>
  );
}
