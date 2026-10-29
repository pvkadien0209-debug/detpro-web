// #267 (HC-Q4): trang cũ (link k= / ?id=) bỏ — mọi việc nằm trong trang nhóm. Link cũ tự chuyển về cửa nhóm.
import { redirect } from "next/navigation";

export default async function Page({ params }) {
  const { ma } = await params;
  redirect(`/nhom/${ma.toUpperCase()}`);
}
