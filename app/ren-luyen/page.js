// /ren-luyen — #411 Rèn luyện (máy tính): học thuộc bảng bằng nghe nói thuần. Không cho Google lập chỉ mục (trang luyện).
import { RenLuyenHome } from "@/components/renLuyen/RenLuyen";
import ClientOnly from "@/components/next/ClientOnly";

export const metadata = { title: "Rèn luyện nghe nói", robots: { index: false } };

export default function Page() {
  return (
    <ClientOnly>
      <RenLuyenHome />
    </ClientOnly>
  );
}
