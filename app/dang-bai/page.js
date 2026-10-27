// /dang-bai — Công cụ đăng bài Facebook / Zalo (#175). Chỉ dùng nội bộ, không cho Google lập chỉ mục.
import { PostToolHome } from "@/components/hkt/PostToolPage";
import ClientOnly from "@/components/next/ClientOnly";

export const metadata = { title: "Đăng bài Facebook / Zalo", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <ClientOnly>
      <PostToolHome />
    </ClientOnly>
  );
}
