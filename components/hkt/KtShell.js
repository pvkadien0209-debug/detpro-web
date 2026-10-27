"use client";
// SP09 (#063) — Vỏ ứng dụng cho các trang học kiến thức (tham khảo F8, research/2026-10-16-ux-ui-tham-khao-f8.md).
//   Máy tính: thanh trên (logo, ô tìm kiếm, nút Học tiếp) + thanh trái 5 mục.
//   Điện thoại: thanh trên gọn + thanh dưới 5 mục.
// Khi vỏ đang hiện, thanh menu cũ của app (A1_Header) được ẩn (body.kt-shell).
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@/lib/router"; // Next.js: thay react-router-dom
import { Home, LayoutGrid, PlayCircle, Users, BarChart3, Search, Clapperboard, Megaphone } from "lucide-react";
import { loadUnitsIndex, readLastUnit, unitPath, audiencePath, topicColor, lowerFirst } from "./unitData";
// Next.js: kt.css nạp toàn cục ở app/layout.js
import TopicArt from "./topicArt";
import VongDet, { SIGN, VongDetLoading } from "./VongDet";

export const NAV = [
  { key: "home", to: "/", label: "Trang chủ", Icon: Home },
  { key: "topics", to: "/knowledge", label: "Chủ đề", Icon: LayoutGrid },
  { key: "continue", to: null, label: "Học tiếp", Icon: PlayCircle },
  { key: "for", to: "/for", label: "Hoàn cảnh", Icon: Users },
  { key: "videos", to: "/videos", label: "Video", Icon: Clapperboard }, // #163
  { key: "me", to: "/me", label: "Của tôi", Icon: BarChart3 },
  { key: "post", to: "/dang-bai", label: "Đăng bài", Icon: Megaphone }, // #178: mục thanh trái (điện thoại: biểu tượng ở thanh trên)
];

/** Đường dẫn của nút "Học tiếp": bài đang học gần nhất, chưa học thì trang Chủ đề. */
export function continuePath() {
  const l = readLastUnit();
  return l ? unitPath(l.audience, l.slug, l.part) : "/knowledge";
}

/** Thêm class cho body khi một trang dùng vỏ mới (ẩn thanh menu cũ). */
export function useBodyClass(cls) {
  useEffect(() => {
    document.body.classList.add(cls);
    return () => document.body.classList.remove(cls);
  }, [cls]);
}

function SearchBox() {
  const [idx, setIdx] = useState(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const boxRef = useRef(null);
  useEffect(() => {
    if (open && !idx) loadUnitsIndex().then(setIdx).catch(() => {});
  }, [open, idx]);
  useEffect(() => {
    const off = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, []);
  const results = useMemo(() => {
    const n = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
    const words = n(q).split(/\s+/).filter(Boolean);
    if (!idx || !words.length) return [];
    const hit = (s) => words.every((w) => n(s).includes(w));
    const out = [];
    idx.branches.forEach((b) =>
      b.topics.forEach((t) => {
        if (hit(t.title.vi + " " + t.title.en)) out.push({ kind: "Chủ đề", title: t.title.vi, to: `/knowledge/${b.slug}/${t.slug}` });
        t.units.forEach((u) => hit(u.title + " " + u.titleEn) && out.push({ kind: "Bài", title: u.title, to: unitPath(u.audience, u.slug) }));
      })
    );
    idx.audiences.forEach((a) => hit(a.title) && out.push({ kind: "Hoàn cảnh", title: a.title, to: audiencePath(a.slug) }));
    return out.slice(0, 8);
  }, [q, idx]);
  const go = (to) => {
    setOpen(false);
    setQ("");
    navigate(to);
  };
  return (
    <div className="kt-search" ref={boxRef}>
      <Search size={18} aria-hidden="true" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && results[0] && go(results[0].to)}
        placeholder="Tìm chủ đề, bài: phỏng vấn, thuê trọ, bán hàng online…"
        aria-label="Tìm chủ đề, bài"
      />
      {open && q.trim() && (
        <ul className="kt-search-res" role="listbox">
          {!idx && (
            <li className="kt-muted">
              <VongDetLoading size={18} />
            </li>
          )}
          {idx && !results.length && <li className="kt-muted">Không thấy kết quả cho “{q}”. Thử từ khác, ví dụ: phỏng vấn, du lịch.</li>}
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => go(r.to)}>
                <small>{r.kind}</small>
                {r.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function KtShell({ active, children }) {
  useBodyClass("kt-shell");
  // Next.js: localStorage chỉ có ở trình duyệt → đọc sau khi trang hiện
  const [cont, setCont] = useState("/knowledge");
  useEffect(() => setCont(continuePath()), []);
  const href = (n) => (n.key === "continue" ? cont : n.to);
  return (
    <div className="kt">
      <header className="kt-top">
        <Link className="kt-logo" to="/">
          {/* #167: logo DetPro = Vòng Đét trên nền xanh + chữ DetPro + khẩu hiệu */}
          <i aria-hidden="true">
            <VongDet sweep={SIGN} track={false} size={30} />
          </i>
          <span className="kt-logo-t">
            Det<b>Pro</b>
            <small>Mỗi ngày biết thêm một điều hay</small>
          </span>
        </Link>
        <SearchBox />
        {/* #177/#178: trên máy tính "Đăng bài" nằm ở thanh trái; nút này chỉ hiện trên điện thoại (thanh dưới đã đủ 6 mục) */}
        <Link className={`kt-post ${active === "post" ? "is-on" : ""}`} to="/dang-bai" title="Đăng bài Facebook / Zalo">
          <Megaphone size={18} aria-hidden="true" />
          <span>Đăng bài</span>
        </Link>
        <Link className="kt-go" to={cont}>
          <b aria-hidden="true" />
          Học tiếp
        </Link>
      </header>
      <nav className="kt-rail" aria-label="Chính">
        {NAV.filter((n) => n.key !== "continue").map(({ key, label, Icon, ...n }) => (
          <Link key={key} to={href({ key, ...n })} className={active === key ? "is-on" : ""} aria-current={active === key ? "page" : undefined}>
            <Icon size={22} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
      <main className="kt-page">
        {children}
        <BrandFooter />
      </main>
      <nav className="kt-tabbar" aria-label="Chính">
        {NAV.filter((n) => n.key !== "post").map(({ key, label, Icon, ...n }) => (
          <Link key={key} to={href({ key, ...n })} className={active === key ? "is-on" : ""} aria-current={active === key ? "page" : undefined}>
            <Icon size={22} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

// #191 — Chân trang thương hiệu, đồng nhất với Fanpage DetPro (kinh-doanh/fanpage-detpro.md, thuong-hieu.md §0, #181–#182).
export const BRAND = {
  slogan: "Mỗi ngày biết thêm một điều hay",
  sloganEn: "One a day, the DetPro way",
  meaning: "Quyết tâm mỗi ngày, tiến bộ mỗi ngày",
  fanpage: "", // dán địa chỉ Fanpage DetPro khi đã lập trang → hiện liên kết "Fanpage" ở chân trang
};

function BrandFooter() {
  return (
    <footer className="kt-brand">
      <div className="kt-brand-id">
        <i aria-hidden="true">
          <VongDet sweep={SIGN} track={false} size={26} />
        </i>
        <span>
          <b>
            Det<em>Pro</em>
          </b>
          <span className="kt-brand-sl">{BRAND.slogan}</span>
          <span className="kt-brand-en" lang="en">
            {BRAND.sloganEn}
          </span>
        </span>
      </div>
      <p className="kt-brand-why">
        <b lang="en">Det</b> — Determination: quyết tâm · <b lang="en">Pro</b> — Progress: tiến bộ. <strong>{BRAND.meaning}.</strong> Vòng Đét không khép kín — vì luôn còn
        một điều nữa để học.
      </p>
      <p className="kt-brand-note">
        Trang chỉ để học mỗi ngày: miễn phí, không bán hàng, không quảng cáo. Nội dung mang tính tham khảo chung, không thay thế tư vấn pháp lý, tài chính hay y tế
        cho trường hợp cụ thể.
      </p>
      <nav className="kt-brand-links" aria-label="Liên kết chân trang">
        <Link to="/knowledge">Chủ đề</Link>
        <Link to="/for">Hoàn cảnh</Link>
        <Link to="/videos">Video</Link>
        <a href="/?huong-dan=1">Xem lại hướng dẫn</a>
        {BRAND.fanpage && (
          <a href={BRAND.fanpage} target="_blank" rel="noopener noreferrer">
            Fanpage DetPro
          </a>
        )}
      </nav>
    </footer>
  );
}

/** Ảnh bìa chủ đề: màu đậm + nhánh + tên to + "Dành cho …" (UX-Q4). */
export function TopicThumb({ idx, topic, branchTitle, small, className = "" }) {
  return (
    <div className={`kt-thumb ${small ? "is-small" : ""} ${className}`} style={{ background: topicColor(idx, topic.slug) }}>
      {branchTitle && <span className="kt-thumb-cat">{branchTitle}</span>}
      {/* #199: mọi chủ đề đều có hình (topicArtMore.js), không còn dấu "?" */}
      <TopicArt slug={topic.slug} />
      <span className="kt-thumb-t">{topic.title?.vi || topic.title}</span>
      {!small && topic.audienceTitle && <span className="kt-thumb-who">Dành cho {lowerFirst(topic.audienceTitle)}</span>}
    </div>
  );
}
