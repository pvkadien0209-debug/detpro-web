// /tai-khoan — #370 tài khoản tuỳ chọn (đăng nhập, quản lí, nhóm tôi hướng dẫn). Không cho Google lập chỉ mục.
import TrangTaiKhoan from "@/components/taiKhoan/TrangTaiKhoan";
import ClientOnly from "@/components/next/ClientOnly";

export const metadata = { title: "Tài khoản", robots: { index: false } };

export default function Page() {
  return (
    <ClientOnly>
      <TrangTaiKhoan />
    </ClientOnly>
  );
}
