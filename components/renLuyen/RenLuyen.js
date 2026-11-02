"use client";
// #411 RÈN LUYỆN (máy tính) — học thuộc bảng bằng NGHE NÓI THUẦN (thay phần Nghe nói đã bỏ khỏi bài vì không hợp điện thoại).
// Anh chốt 02/11: 3 bộ A (20 bảng × 20 dòng) · A1 (20 × 40) · B (30 × 50), mỗi bảng gắn hình SVG; bấm vào bảng là luyện luôn;
// mỗi dòng luyện MỘT lần, thứ tự + chiều (nghe Hỏi → nói Đáp, hoặc nghe Đáp → nói Hỏi) trộn ngẫu nhiên cho đỡ ngán.
// Dữ liệu: public/ren-luyen/index.json + public/ren-luyen/<bộ>/<bảng>.json { id, ten, svg, dong: [{ h, d, svg? }] } — hiện A1 là MẪU.
// Giao diện dùng lại lớp kt-* / nh-* và AnswerBox (Nói / Gõ) của bài học → cùng một kiểu CSS.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@/lib/router";
import { Mic, Monitor, Volume2, Eye, RotateCcw, ArrowRight, Check, X } from "lucide-react";
import KtShell from "@/components/hkt/KtShell";
import { AnswerBox } from "@/components/hkt/UnitParts";
import { playText, stopAudio } from "@/components/hkt/audioPlayer";
import { scoreOption } from "@/components/hkt/matcher";
import { MATCH } from "@/components/hkt/config";
import { NutCham } from "@/components/hkt/hoTro";

const KQ = (bo, id) => `hkt.ren.${bo}/${id}`; // kết quả tốt nhất (đồng bộ theo tài khoản)
const docKq = (bo, id) => {
  try {
    return JSON.parse(localStorage.getItem(KQ(bo, id)) || "null");
  } catch {
    return null;
  }
};
const ghiKq = (bo, id, v) => {
  try {
    const cu = docKq(bo, id);
    localStorage.setItem(KQ(bo, id), JSON.stringify({ ...v, tot: Math.max(v.dung, cu?.tot || 0), lan: (cu?.lan || 0) + 1 }));
  } catch {
    /* bỏ qua */
  }
};
const tron = (a) => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};
async function tai(url) {
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) throw new Error(`Không tải được ${url}`);
  return r.json();
}
function useMayTinh() {
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const q = window.matchMedia("(min-width: 961px) and (pointer: fine)");
    const f = () => setOk(q.matches);
    f();
    q.addEventListener("change", f);
    return () => q.removeEventListener("change", f);
  }, []);
  return ok;
}
function BaoDienThoai() {
  return (
    <p className="rl-dt">
      <Monitor size={16} aria-hidden="true" /> Rèn luyện nghe nói dùng <b>máy tính</b> (micro tốt, nói liên tục được). Điện thoại vẫn làm được nhưng dễ ngắt mic.
    </p>
  );
}

// ---------- Trang danh sách: 3 bộ ----------
export function RenLuyenHome() {
  const [idx, setIdx] = useState(null);
  const [err, setErr] = useState("");
  const mt = useMayTinh();
  useEffect(() => {
    tai("/ren-luyen/index.json").then(setIdx).catch((e) => setErr(e.message));
  }, []);
  return (
    <KtShell active="ren">
      <h1 className="kt-h1">Rèn luyện</h1>
      <p className="kt-lead">Học thuộc bảng bằng nghe nói thuần: máy đọc một vế, bạn nói vế còn lại. Mỗi dòng một lần, thứ tự và chiều hỏi–đáp trộn ngẫu nhiên. Bấm vào bảng là luyện luôn.</p>
      {!mt && <BaoDienThoai />}
      {err && <p className="nh-err">{err}</p>}
      {!idx && !err && <p className="kt-muted">Đang tải…</p>}
      {idx?.bo.map((bo) => (
        <section key={bo.ma} className="rl-bo">
          <div className="kt-row-head">
            <h2>
              {bo.ten} <small className="kt-muted">· {bo.moTa}</small> {bo.mau && <span className="rl-mau">bản mẫu</span>}
            </h2>
          </div>
          {bo.bang.length ? (
            <div className="rl-luoi">
              {bo.bang.map((b) => {
                const kq = docKq(bo.ma, b.id);
                return (
                  <Link key={b.id} className="kt-card rl-the" to={`/ren-luyen/${bo.ma}/${b.id}`}>
                    <span className="rl-hinh">{b.svg ? <img src={b.svg} alt="" loading="lazy" /> : <Mic size={36} aria-hidden="true" />}</span>
                    <span className="kt-card-body">
                      <h3>{b.ten}</h3>
                      <span className="kt-meta">
                        <span>{b.soDong} dòng</span>
                        {kq ? (
                          <span className={kq.tot >= b.soDong ? "rl-ok" : ""}>
                            tốt nhất {kq.tot}/{b.soDong} · {kq.lan} lần
                          </span>
                        ) : (
                          <span>chưa luyện</span>
                        )}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="kt-muted rl-sap">Sắp có — nội dung đang soạn.</p>
          )}
        </section>
      ))}
    </KtShell>
  );
}

// ---------- Trang luyện một bảng ----------
export function RenLuyenBai({ bo, id }) {
  const [bang, setBang] = useState(null);
  const [err, setErr] = useState("");
  const [vong, setVong] = useState(0); // đổi để làm lại (trộn mới)
  const mt = useMayTinh();
  const navigate = useNavigate();
  useEffect(() => {
    tai(`/ren-luyen/${bo}/${id}.json`).then(setBang).catch((e) => setErr(e.message));
    return () => stopAudio();
  }, [bo, id]);
  // mỗi dòng MỘT việc: chiều ngẫu nhiên (nghe Hỏi → nói Đáp, hoặc nghe Đáp → nói Hỏi), thứ tự trộn
  const viec = useMemo(() => (bang ? tron(bang.dong.filter((d) => String(d.h || "").trim().length > 2 && String(d.d || "").trim().length > 2).map((d, i) => ({ i, ...d, nguoc: Math.random() < 0.5 }))) : []), [bang, vong]);
  const [n, setN] = useState(0);
  const [kq, setKq] = useState([]); // { dung, noi, sim, xemChu }
  const [xemChu, setXemChu] = useState(false);
  const [daNghe, setDaNghe] = useState(false);
  useEffect(() => {
    setN(0);
    setKq([]);
  }, [viec]);
  const v = viec[n];
  const xong = bang && n >= viec.length;
  const nghe = useRef(null);
  nghe.current = () => v && playText(v.nguoc ? v.d : v.h).then(() => setDaNghe(true));
  // vào câu mới → đọc luôn (bấm vào bảng là luyện luôn)
  useEffect(() => {
    setXemChu(false);
    setDaNghe(false);
    if (v && kq[n] === undefined) {
      const t = setTimeout(() => nghe.current?.(), 350);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  const tra = (alts) => {
    if (!v || kq[n]) return;
    const dich = { text: v.nguoc ? v.h : v.d };
    const tot = alts.map((a) => scoreOption(a, dich)).sort((a, b) => b.sim - a.sim)[0] || { sim: 0, wm: 0 };
    const dung = tot.sim >= MATCH.sim;
    const moi = [...kq];
    moi[n] = { dung, noi: alts[0], sim: tot.sim, xemChu };
    setKq(moi);
    if (n + 1 >= viec.length) ghiKq(bo, id, { dung: moi.filter((x) => x?.dung).length, tong: viec.length, luc: Date.now() });
  };
  useEffect(() => {
    const k = (e) => {
      if (e.target.closest("input, textarea")) return;
      if (e.key === "Enter" && kq[n]) setN((x) => x + 1);
      if (e.key.toLowerCase() === "r") nghe.current?.();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [kq, n]);

  return (
    <KtShell active="ren">
      <p className="kt-muted rl-duong">
        <Link to="/ren-luyen">Rèn luyện</Link> › {bang?.ten || id}
      </p>
      {!mt && <BaoDienThoai />}
      {err && <p className="nh-err">{err}</p>}
      {bang && !xong && v && (
        <div className="rl-khung">
          <div className="rl-tren">
            <span>
              Dòng <b>{n + 1}</b>/{viec.length}
            </span>
            <span className="rl-diem">✓ {kq.filter((x) => x?.dung).length}</span>
            <NutCham className="kt-dicon kt-cham" />
          </div>
          <div className="rl-hinh-lon">{v.svg || bang.svg ? <img src={v.svg || bang.svg} alt="" /> : null}</div>
          <p className="rl-yeucau">
            {v.nguoc ? (
              <>
                🎧 Nghe <b>câu trả lời</b> → 🎤 nói lại <b>câu hỏi</b>
              </>
            ) : (
              <>
                🎧 Nghe <b>câu hỏi</b> → 🎤 nói <b>câu trả lời</b>
              </>
            )}
          </p>
          <div className="nh-row rl-nut">
            <button type="button" className="kt-btn" onClick={() => nghe.current?.()}>
              <Volume2 size={16} aria-hidden="true" /> Nghe lại <small className="kt-muted">(R)</small>
            </button>
            {!kq[n] && (
              <button type="button" className="kt-btn" onClick={() => setXemChu((x) => !x)} aria-pressed={xemChu}>
                <Eye size={16} aria-hidden="true" /> {xemChu ? "Ẩn chữ" : "Xem chữ vế đã nghe"}
              </button>
            )}
          </div>
          {(xemChu || kq[n]) && <p className="rl-nghe">“{v.nguoc ? v.d : v.h}”</p>}
          {!kq[n] ? (
            <AnswerBox onSubmit={tra} placeholder={v.nguoc ? "Gõ câu hỏi…" : "Gõ câu trả lời…"} hint={daNghe ? "Bấm Nói rồi nói, xong bấm Gửi." : "Đang đọc…"} compact />
          ) : (
            <div className={`rl-kq ${kq[n].dung ? "is-dung" : "is-sai"}`}>
              <p>
                {kq[n].dung ? <Check size={18} aria-hidden="true" /> : <X size={18} aria-hidden="true" />} <b>{kq[n].dung ? "Đúng" : "Chưa khớp"}</b>{" "}
                <small className="kt-muted">({Math.round(kq[n].sim * 100)}% khớp — cần {Math.round(MATCH.sim * 100)}%)</small>
              </p>
              <p>
                Bạn nói: <i>{kq[n].noi || "—"}</i>
              </p>
              <p>
                Đáp đúng: <b>{v.nguoc ? v.h : v.d}</b>{" "}
                <button type="button" className="kt-linkbtn" onClick={() => playText(v.nguoc ? v.h : v.d)}>
                  🔊 nghe
                </button>
              </p>
              <button type="button" className="kt-btn kt-btn--pri" onClick={() => setN((x) => x + 1)} autoFocus>
                {n + 1 < viec.length ? "Dòng tiếp" : "Xem kết quả"} <ArrowRight size={16} aria-hidden="true" /> <small>(Enter)</small>
              </button>
            </div>
          )}
        </div>
      )}
      {xong && (
        <div className="nh-card rl-ketqua">
          <h2>
            Xong bảng “{bang.ten}”: {kq.filter((x) => x?.dung).length}/{viec.length} dòng đúng
          </h2>
          {kq.some((x) => !x?.dung) && (
            <ul className="rl-sai">
              {viec.map((x, i) =>
                kq[i]?.dung ? null : (
                  <li key={i}>
                    <b>{x.h}</b> → {x.d}
                  </li>
                )
              )}
            </ul>
          )}
          <div className="nh-row">
            <button type="button" className="kt-btn kt-btn--pri" onClick={() => setVong((x) => x + 1)}>
              <RotateCcw size={16} aria-hidden="true" /> Luyện lại (trộn mới)
            </button>
            <button type="button" className="kt-btn" onClick={() => navigate("/ren-luyen")}>
              Chọn bảng khác
            </button>
          </div>
        </div>
      )}
    </KtShell>
  );
}
