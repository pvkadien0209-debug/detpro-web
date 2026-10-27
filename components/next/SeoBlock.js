// #190 — Nội dung chữ dựng sẵn ở máy chủ cho các trang danh mục (Google đọc được ngay trong HTML).
// Ẩn khỏi mắt người xem (lớp .kt-ssr), vì trang thật hiện đúng các nội dung này ngay sau khi tải xong.
import Link from "next/link";

export default function SeoBlock({ title, intro, groups = [] }) {
  return (
    <div className="kt-ssr">
      <h1>{title}</h1>
      {intro && <p>{intro}</p>}
      {groups.map((g, i) => (
        <section key={i}>
          {g.title && <h2>{g.href ? <Link href={g.href}>{g.title}</Link> : g.title}</h2>}
          {g.text && <p>{g.text}</p>}
          {g.items?.length > 0 && (
            <ul>
              {g.items.map((it) => (
                <li key={it.href}>
                  <Link href={it.href}>{it.title}</Link>
                  {it.text ? ` — ${it.text}` : ""}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
