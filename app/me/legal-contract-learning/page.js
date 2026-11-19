// #1039 /me/legal-contract-learning — tài liệu học riêng của anh (cần mật khẩu quản lý). Không lập chỉ mục.
import ClientOnly from "@/components/next/ClientOnly";
import HocRieng from "@/components/hkt/HocRieng";

export const metadata = { title: "Legal contract learning", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <ClientOnly>
      <HocRieng />
    </ClientOnly>
  );
}
