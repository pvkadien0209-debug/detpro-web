// #230 Học cùng — mọi trang /nhom/…: không cho Google lập chỉ mục (thiết kế mục 10).
export const metadata = { robots: { index: false, follow: false } };
export default function NhomLayout({ children }) {
  return children;
}
