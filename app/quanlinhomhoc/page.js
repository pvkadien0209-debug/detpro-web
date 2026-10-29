// #271 Trang ẩn quản lý mọi nhóm học (không có link nào trỏ tới; cần mật khẩu quản lý). Không lập chỉ mục.
import ClientOnly from "@/components/next/ClientOnly";
import QuanLiNhom from "@/components/nhom/QuanLiNhom";

export const metadata = { title: "Quản lý nhóm học", robots: { index: false, follow: false } };
export default function Page() {
  return (
    <ClientOnly>
      <QuanLiNhom />
    </ClientOnly>
  );
}
