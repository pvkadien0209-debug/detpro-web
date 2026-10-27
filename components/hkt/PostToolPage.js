"use client";
// #175 (SP11 mức 1 trên web) — Công cụ đăng bài Facebook / Zalo ngay trên trang: /dang-bai (chọn bài) · /dang-bai/<người-nghe>/<bài>.
// Chữ soạn sẵn từ dữ liệu bài (socialPosts.js), ảnh "Câu hỏi hôm nay" vẽ ngay trên trình duyệt (quizCard.js),
// video / ảnh bìa lấy từ Drive. Không đưa vào menu, không cho Google lập chỉ mục (trang làm việc của người đăng).
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@/lib/router"; // Next.js: thay react-router-dom
import { Helmet } from "@/lib/helmet"; // Next.js: tiêu đề/mô tả đặt ở trang máy chủ (generateMetadata)
import { ArrowLeft, Copy, Download, ExternalLink, Search } from "lucide-react";
import KtShell from "./KtShell";
import { loadUnit, loadUnitsIndex } from "./unitData";
import { VongDetLoading } from "./VongDet";
import { useVideos, coverUrl } from "./videoData";
import { buildPosts, isPosted, setPosted } from "./socialPosts";
import { drawQuizCard, copyCanvas } from "./quizCard";
import { drawDeck } from "./socialCards";

const fold = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
// #177: "Đăng bài" thành mục hiện trên thanh trên (góc phải) — bỏ noindex
const NoIndex = ({ title }) => (
  <Helmet>
    <title>{title}</title>
  </Helmet>
);

function useFlash() {
  const [msg, setMsg] = useState({});
  const flash = (key, text) => {
    setMsg((m) => ({ ...m, [key]: text }));
    setTimeout(() => setMsg((m) => ({ ...m, [key]: null })), 1800);
  };
  return [msg, flash];
}
const copyText = async (t) => {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    window.prompt("Chép dòng này (Ctrl+C):", t);
    return false;
  }
};

// ---------- /dang-bai: chọn bài ----------
export function PostToolHome() {
  const videos = useVideos();
  const [idx, setIdx] = useState(null);
  const [q, setQ] = useState("");
  const [onlyVideo, setOnlyVideo] = useState(true);
  useEffect(() => {
    loadUnitsIndex().then(setIdx).catch(() => setIdx({ branches: [] }));
  }, []);
  const rows = useMemo(() => {
    if (!idx) return [];
    const seen = new Set();
    const out = [];
    idx.branches.forEach((b) =>
      b.topics.forEach((t) =>
        t.units.forEach((u) => {
          if (seen.has(u.slug)) return;
          seen.add(u.slug);
          out.push({ u, t, video: videos?.bySlug[u.slug] });
        })
      )
    );
    return out;
  }, [idx, videos]);
  const words = fold(q).split(/\s+/).filter(Boolean);
  const shown = rows.filter((r) => (!onlyVideo || r.video) && words.every((w) => fold(`${r.u.title} ${r.t.title?.vi || r.t.title} ${r.u.slug}`).includes(w)));
  return (
    <KtShell active="post">
      <NoIndex title="Đăng bài Facebook / Zalo" />
      <h1 className="kt-h1">Đăng bài Facebook / Zalo</h1>
      <p className="kt-lead">Chọn một bài → có sẵn chữ và ảnh để đăng lên trang cá nhân, nhóm Facebook hoặc Zalo. Đánh dấu “Đã đăng” lưu trên trình duyệt này.</p>
      {(!idx || !videos) && <VongDetLoading size={28} />}
      {idx && videos && (
        <>
          <div className="kt-vbar">
            <label className="kt-vsearch">
              <Search size={16} aria-hidden="true" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm bài…" aria-label="Tìm bài" />
            </label>
            <label className="kt-pt-chk">
              <input type="checkbox" checked={onlyVideo} onChange={(e) => setOnlyVideo(e.target.checked)} /> Chỉ bài đã có video
            </label>
            <span className="kt-muted">{shown.length} bài</span>
          </div>
          <table className="kt-pt-tbl">
            <thead>
              <tr>
                <th>Bài</th>
                <th>Chuỗi</th>
                <th>Video</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 300).map((r) => (
                <tr key={r.u.slug}>
                  <td>
                    <Link to={`/dang-bai/${r.u.audience}/${r.u.slug}`}>{r.u.title}</Link>
                  </td>
                  <td className="kt-muted">{r.t.title?.vi || r.t.title}</td>
                  <td>{r.video ? "có" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </KtShell>
  );
}

// ---------- ảnh câu hỏi (canvas → ảnh xem trước, chép, tải) ----------
function QuizImage({ quiz, name }) {
  const [cv, setCv] = useState(null);
  const [url, setUrl] = useState("");
  const [msg, flash] = useFlash();
  useEffect(() => {
    let live = true;
    drawQuizCard(quiz).then((c) => {
      if (!live) return;
      setCv(c);
      setUrl(c.toDataURL("image/jpeg", 0.9));
    });
    return () => {
      live = false;
    };
  }, [quiz]);
  if (!url) return <div className="kt-pt-ph">Đang vẽ ảnh…</div>;
  return (
    <>
      <img src={url} alt="Ảnh câu hỏi" className="kt-pt-img" />
      <div className="kt-pt-row">
        <button
          type="button"
          className="kt-wbtn"
          onClick={() =>
            copyCanvas(cv).then(
              () => flash("c", "Đã chép ảnh ✓ — Ctrl+V vào ô đăng"),
              () => flash("c", "Không chép được — dùng Tải ảnh")
            )
          }
        >
          <Copy size={15} aria-hidden="true" /> {msg.c || "Chép ảnh"}
        </button>
        <a className="kt-wbtn" href={url} download={`${name}.jpg`}>
          <Download size={15} aria-hidden="true" /> Tải ảnh
        </a>
      </div>
    </>
  );
}

// ---------- #177 bộ ảnh (A2 / A3): vẽ cả bộ, chép / tải từng ảnh, tải cả bộ ----------
const deckCache = new Map(); // bản Facebook và Zalo dùng chung một bộ ảnh
function DeckImages({ slides, name }) {
  const [imgs, setImgs] = useState(null);
  const [msg, flash] = useFlash();
  useEffect(() => {
    let live = true;
    if (!deckCache.has(slides)) deckCache.set(slides, drawDeck(slides).then((cvs) => cvs.map((cv) => ({ cv, url: cv.toDataURL("image/jpeg", 0.9) }))));
    deckCache.get(slides).then((x) => live && setImgs(x));
    return () => {
      live = false;
    };
  }, [slides]);
  if (!imgs) return <div className="kt-pt-ph is-deck">Đang vẽ {slides.length} ảnh…</div>;
  const downloadAll = () =>
    imgs.forEach((x, i) =>
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = x.url;
        a.download = `${name}-${i + 1}.jpg`;
        a.click();
      }, i * 350)
    );
  return (
    <div className="kt-pt-deck">
      <div className="kt-pt-strip">
        {imgs.map((x, i) => (
          <figure key={i}>
            <img src={x.url} alt={`Ảnh ${i + 1}/${imgs.length}`} />
            <figcaption>
              <button
                type="button"
                className="kt-wbtn is-sm"
                onClick={() =>
                  copyCanvas(x.cv).then(
                    () => flash(i, "Đã chép ✓"),
                    () => flash(i, "Không chép được")
                  )
                }
              >
                <Copy size={14} aria-hidden="true" /> {msg[i] || `Chép ${i + 1}`}
              </button>
              <a className="kt-wbtn is-sm" href={x.url} download={`${name}-${i + 1}.jpg`} aria-label={`Tải ảnh ${i + 1}`}>
                <Download size={14} aria-hidden="true" />
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="kt-pt-row">
        <button type="button" className="kt-wbtn" onClick={downloadAll}>
          <Download size={15} aria-hidden="true" /> Tải cả bộ ({imgs.length} ảnh)
        </button>
        <span className="kt-muted">Đăng nhiều ảnh: chép và dán (Ctrl+V) lần lượt từng ảnh theo thứ tự, hoặc Tải cả bộ rồi chọn cùng lúc.</span>
      </div>
    </div>
  );
}

// ---------- /dang-bai/<người-nghe>/<bài> ----------
export default function PostToolPage() {
  const { audience, slug } = useParams();
  const videos = useVideos();
  const [u, setU] = useState(null);
  const [err, setErr] = useState(false);
  const [done, setDone] = useState({});
  const [msg, flash] = useFlash();
  useEffect(() => {
    setU(null);
    setErr(false);
    loadUnit(audience, slug).then(setU).catch(() => setErr(true));
  }, [audience, slug]);
  const video = videos?.bySlug[slug] || null;
  const posts = useMemo(() => (u && videos ? buildPosts(u, video) : []), [u, videos, video]);
  useEffect(() => {
    setDone(Object.fromEntries(posts.map((p) => [p.id, isPosted(slug, p.id)])));
  }, [posts, slug]);

  if (err)
    return (
      <KtShell active="post">
        <NoIndex title="Không tìm thấy bài" />
        <p className="kt-lead">Không tìm thấy bài này.</p>
        <Link to="/dang-bai">← Chọn bài khác</Link>
      </KtShell>
    );
  if (!u || !videos)
    return (
      <KtShell active="post">
        <VongDetLoading size={28} />
      </KtShell>
    );
  const m = u.meta;
  return (
    <KtShell active="post">
      <NoIndex title={`Đăng bài · ${m.title}`} />
      <Link className="kt-pt-back" to="/dang-bai">
        <ArrowLeft size={15} aria-hidden="true" /> Chọn bài khác
      </Link>
      <h1 className="kt-h1">{m.title}</h1>
      <ol className="kt-pt-how">
        <li>
          Bấm <b>Sao chép chữ</b> → mở Facebook / Zalo → bấm vào ô viết bài → <b>Ctrl+V</b>.
        </li>
        <li>
          Ảnh câu hỏi: bấm <b>Chép ảnh</b> → bấm vào ô viết bài → <b>Ctrl+V</b>. Trên điện thoại: <b>Tải ảnh</b> rồi chọn ảnh khi đăng.
        </li>
        <li>
          Video: <b>Tải video</b> (từ Drive) rồi bấm Ảnh/video khi đăng để chọn tệp vừa tải. Hoặc chỉ đăng đường dẫn — Facebook / Zalo tự hiện ảnh xem trước.
        </li>
        <li>
          Đăng xong → tích <b>Đã đăng</b>. Câu hỏi hôm nay: đăng <b>đáp án</b> vào bình luận đầu tiên sau vài giờ.
        </li>
      </ol>
      {posts.map((p) => (
        <section key={p.id} className={`kt-pt-card ${p.slides ? "is-deck" : ""} ${done[p.id] ? "is-done" : ""}`}>
          {p.slides && <DeckImages slides={p.slides} name={`${slug}-${p.deck}`} />}
          {!p.slides && <div className="kt-pt-media">
            {p.quiz && <QuizImage quiz={p.quiz} name={`${slug}-${p.id}`} />}
            {p.video && video && (
              <div className="kt-pt-row">
                <a className="kt-wbtn" href={`https://drive.google.com/uc?export=download&id=${video.drive}`} target="_blank" rel="noopener noreferrer">
                  <Download size={15} aria-hidden="true" /> Tải video
                </a>
                <Link className="kt-wbtn" to={`/videos/${slug}`} target="_blank">
                  <ExternalLink size={15} aria-hidden="true" /> Xem
                </Link>
              </div>
            )}
            {p.cover && video?.cover && (
              <>
                <img src={coverUrl(video, 640)} alt="Ảnh bìa" className="kt-pt-img" />
                <div className="kt-pt-row">
                  <a className="kt-wbtn" href={coverUrl(video, 1600)} target="_blank" rel="noopener noreferrer">
                    <Download size={15} aria-hidden="true" /> Mở ảnh bìa
                  </a>
                </div>
              </>
            )}
            {!p.quiz && !p.video && !p.cover && <span className="kt-muted">Không kèm ảnh — Facebook / Zalo tự lấy ảnh xem trước từ đường dẫn.</span>}
          </div>}
          <div className="kt-pt-body">
            <h3>
              <span className={`kt-pt-net is-${p.net === "Facebook" ? "fb" : "zalo"}`}>{p.net}</span> {p.title}
            </h3>
            <textarea readOnly value={p.text} rows={9} />
            <div className="kt-pt-row">
              <button type="button" className="kt-wbtn is-pri" onClick={() => copyText(p.text).then(() => flash(p.id, "Đã chép ✓"))}>
                <Copy size={15} aria-hidden="true" /> {msg[p.id] || "Sao chép chữ"}
              </button>
              <a className="kt-wbtn" href={p.net === "Facebook" ? "https://www.facebook.com/" : "https://chat.zalo.me/"} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={15} aria-hidden="true" /> Mở {p.net}
              </a>
              <label className="kt-pt-chk is-right">
                <input
                  type="checkbox"
                  checked={!!done[p.id]}
                  onChange={(e) => {
                    setPosted(slug, p.id, e.target.checked);
                    setDone((d) => ({ ...d, [p.id]: e.target.checked }));
                  }}
                />{" "}
                Đã đăng
              </label>
            </div>
            {p.comment && (
              <div className="kt-pt-cmt">
                <b>Bình luận đầu tiên (đáp án) — đăng sau vài giờ</b>
                <textarea readOnly value={p.comment} rows={5} />
                <button type="button" className="kt-wbtn" onClick={() => copyText(p.comment).then(() => flash(`${p.id}-c`, "Đã chép ✓"))}>
                  <Copy size={15} aria-hidden="true" /> {msg[`${p.id}-c`] || "Sao chép đáp án"}
                </button>
              </div>
            )}
          </div>
        </section>
      ))}
    </KtShell>
  );
}
