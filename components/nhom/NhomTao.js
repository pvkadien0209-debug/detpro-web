"use client";
// #230 Học cùng — /nhom/tao?chu-de=<nhánh>/<chủ đề>: người hướng dẫn mở lớp (thiết kế mục 4a).
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router";
import { Users, Link2, ShieldCheck } from "lucide-react";
import KtShell from "@/components/hkt/KtShell";
import { loadUnitsIndex, allTopics } from "@/components/hkt/unitData";
import { api, saveK, rememberGroup, myGroups, loadK } from "./nhomClient";
import { CopyBtn, origin, errText } from "./NhomShared";
import { HAN_MAC_DINH, NHAC_MAC_DINH, TOI_DA } from "@/components/hkt/nhomRules";

function Choice({ label, value, onChange, options, custom }) {
  const isPreset = options.some(([v]) => v === value);
  return (
    <div className="nh-field">
      <span className="nh-flabel">{label}</span>
      <div className="nh-chips" role="group" aria-label={label}>
        {options.map(([v, t]) => (
          <button key={String(v)} type="button" className={value === v ? "is-on" : ""} aria-pressed={value === v} onClick={() => onChange(v)}>
            {t}
          </button>
        ))}
        {custom && (
          <label className={`nh-custom ${!isPreset ? "is-on" : ""}`}>
            {custom.label}
            <input type="number" min={custom.min} max={custom.max} value={isPreset ? "" : value} placeholder={custom.ph} onChange={(e) => e.target.value && onChange(+e.target.value)} />
            {custom.unit}
          </label>
        )}
      </div>
    </div>
  );
}

export default function NhomTao() {
  const [idx, setIdx] = useState(null);
  const [topicKey, setTopicKey] = useState("");
  const [ten, setTen] = useState("");
  const [tenHD, setTenHD] = useState("");
  const [quiz, setQuiz] = useState(40);
  const [say, setSay] = useState(40);
  const [tf, setTf] = useState("xong");
  const [han, setHan] = useState(HAN_MAC_DINH);
  const [nhac, setNhac] = useState(NHAC_MAC_DINH);
  const [kenh, setKenh] = useState("");
  const [pin, setPin] = useState(false);
  const [toiDa, setToiDa] = useState(TOI_DA);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);
  const [mine, setMine] = useState([]);

  useEffect(() => {
    setTopicKey(new URLSearchParams(window.location.search).get("chu-de") || "");
    setMine(myGroups().filter((g) => loadK(g.ma)));
    loadUnitsIndex().then(setIdx).catch(() => setErr("Không tải được danh sách chủ đề"));
  }, []);
  const topics = useMemo(() => allTopics(idx).filter((t) => t.units?.length), [idx]);
  const topic = topics.find((t) => `${t.branch}/${t.slug}` === topicKey);

  const submit = async (e) => {
    e.preventDefault();
    if (!topic) return setErr("Chọn chuỗi bài");
    setBusy(true);
    setErr("");
    try {
      const r = await api("", {
        body: {
          topic: topicKey, ten: ten || topic.title.vi, tenHuongDan: tenHD,
          nguong: { quiz, "listen-speak": say, tf }, hanChangGio: han, nhacGio: nhac, kenhGuiBai: kenh, batBuocPin: pin, toiDa,
        },
      });
      saveK(r.ma, r.k);
      rememberGroup(r.ma, ten || topic.title.vi);
      setDone(r);
    } catch (x) {
      setErr(errText(x));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const hv = `${origin()}/nhom/${done.ma}`;
    const hd = `${origin()}/nhom/${done.ma}/huong-dan?k=${done.k}`;
    return (
      <KtShell active="topics">
        <div className="nh-wrap">
          <h1 className="kt-h1">Đã mở lớp {done.ma}</h1>
          <div className="nh-card">
            <h2>
              <Link2 size={18} aria-hidden="true" /> Link nhóm — gửi cho học viên (Zalo…)
            </h2>
            <p className="nh-link">{hv}</p>
            <CopyBtn text={`Vào nhóm học "${ten || topic.title.vi}" trên DetPro: ${hv}`} className="kt-btn kt-btn--pri">
              Chép lời mời + link
            </CopyBtn>
          </div>
          <div className="nh-card is-warn">
            <h2>
              <ShieldCheck size={18} aria-hidden="true" /> Link hướng dẫn — CHỈ của bạn, đừng gửi ai
            </h2>
            <p className="nh-link">{hd}</p>
            <p className="kt-muted">
              Mã hướng dẫn <b className="nh-code">{done.k}</b> — lưu lại (ghi chú điện thoại). Máy này đã nhớ mã; sang máy khác thì mở link trên.
            </p>
            <div className="nh-row">
              <CopyBtn text={hd}>Chép link hướng dẫn</CopyBtn>
              <Link className="kt-btn kt-btn--pri" to={`/nhom/${done.ma}/huong-dan?k=${done.k}`}>
                Vào trang hướng dẫn
              </Link>
            </div>
          </div>
          <p className="kt-muted">
            Tự học? Bạn vừa là người hướng dẫn: mở <Link to={`/nhom/${done.ma}`}>link nhóm</Link> để tạo ID học của mình.
          </p>
        </div>
      </KtShell>
    );
  }

  return (
    <KtShell active="topics">
      <form className="nh-wrap" onSubmit={submit}>
        <p className="kt-kicker">
          <Users size={16} aria-hidden="true" /> Học cùng · có người hướng dẫn
        </p>
        <h1 className="kt-h1">Mở lớp hướng dẫn</h1>
        {mine.length > 0 && (
          <p className="nh-mine">
            Lớp bạn đã mở trên máy này:{" "}
            {mine.map((g, i) => (
              <React.Fragment key={g.ma}>
                {i > 0 && " · "}
                <Link to={`/nhom/${g.ma}/huong-dan?k=${loadK(g.ma)}`}>
                  {g.ten} ({g.ma})
                </Link>
              </React.Fragment>
            ))}
          </p>
        )}
        <p className="kt-lead">
          Một lớp học <b>một chuỗi bài</b>. Học viên mở link bạn gửi, chọn ID của mình (không cần tài khoản). <b>Bài sau chỉ mở khi cả lớp xong 5 phần của bài trước.</b>
        </p>

        <div className="nh-card">
          <label className="nh-field">
            <span className="nh-flabel">Chuỗi bài</span>
            <select value={topicKey} onChange={(e) => setTopicKey(e.target.value)} required>
              <option value="">— Chọn chủ đề —</option>
              {topics.map((t) => (
                <option key={`${t.branch}/${t.slug}`} value={`${t.branch}/${t.slug}`}>
                  {t.title.vi} ({t.units.length} bài)
                </option>
              ))}
            </select>
          </label>
          {topic && (
            <ol className="nh-blist">
              {topic.units.map((u, i) => (
                <li key={u.slug}>
                  <b>{u.kind === "tong" ? "Bài tổng" : `Bài ${i}`}</b> {u.title}
                </li>
              ))}
            </ol>
          )}
          <label className="nh-field">
            <span className="nh-flabel">Tên lớp</span>
            <input value={ten} maxLength={80} placeholder={topic?.title.vi || "Ví dụ: Lớp phỏng vấn 12A"} onChange={(e) => setTen(e.target.value)} />
          </label>
          <label className="nh-field">
            <span className="nh-flabel">Tên người hướng dẫn (hiện trong Hỏi đáp)</span>
            <input value={tenHD} maxLength={40} placeholder="Ví dụ: Cô Hà" onChange={(e) => setTenHD(e.target.value)} />
          </label>
        </div>

        <div className="nh-card">
          <h2>Qua phần khi…</h2>
          <Choice label="Trắc nghiệm — chọn đúng" value={quiz} onChange={setQuiz} options={[[20, "20/40"], [30, "30/40"], [40, "40/40"]]} custom={{ label: "Số khác", min: 1, max: 40, unit: "/40", ph: "35" }} />
          <Choice label="Nghe nói — nói đúng" value={say} onChange={setSay} options={[[20, "20/40"], [30, "30/40"], [40, "40/40"]]} custom={{ label: "Số khác", min: 1, max: 40, unit: "/40", ph: "35" }} />
          <Choice label="True or false" value={tf} onChange={setTf} options={[["xong", "Làm xong lượt"], [70, "Đúng ≥ 70%"], [80, "Đúng ≥ 80%"]]} custom={{ label: "Đúng ≥", min: 1, max: 100, unit: "%", ph: "90" }} />
        </div>

        <div className="nh-card">
          <h2>Giữ nhịp</h2>
          <Choice label="Đếm ngược mỗi chặng (tính từ lúc chặng mở)" value={han} onChange={setHan} options={[[12, "12 giờ"], [24, "24 giờ"], [48, "48 giờ"], [72, "72 giờ"], [0, "Tắt"]]} custom={{ label: "Số khác", min: 1, max: 720, unit: "giờ", ph: "36" }} />
          <Choice label="Nhắc hối thúc người chưa xong" value={nhac} onChange={setNhac} options={[[2, "Mỗi 2 giờ"], [4, "4 giờ"], [8, "8 giờ"], [12, "12 giờ"], [24, "24 giờ"], [0, "Tắt"]]} custom={{ label: "Mỗi", min: 1, max: 168, unit: "giờ", ph: "6" }} />
        </div>

        <div className="nh-card">
          <h2>Bài nói tự do & vào lớp</h2>
          <label className="nh-field">
            <span className="nh-flabel">Kênh gửi bài nói tự do (link nhóm Zalo, Messenger, Drive…)</span>
            <input type="url" value={kenh} placeholder="https://zalo.me/g/…" onChange={(e) => setKenh(e.target.value)} />
          </label>
          <Choice label="PIN" value={pin} onChange={setPin} options={[[false, "Không bắt buộc"], [true, "Bắt buộc mọi ID"]]} />
          <Choice label="Số học viên tối đa" value={toiDa} onChange={setToiDa} options={[[4, "4"], [8, "8"], [15, "15"], [30, "30"]]} />
        </div>

        {err && <p className="hkt-u-err">{err}</p>}
        <button type="submit" className="kt-btn kt-btn--pri kt-btn--big" disabled={busy || !topic}>
          {busy ? "Đang mở lớp…" : "Mở lớp"}
        </button>
        <p className="kt-muted nh-note">
          Lớp lưu: ID tự đặt, tiến độ, lời nhắn trên cây, tin Hỏi đáp. Không ghi giọng phần luyện; bài nói tự do gửi qua kênh của bạn. Không lưu email, số điện thoại. Dữ liệu tự xoá 30 ngày sau khi cả lớp về đích, hoặc sau 180 ngày không ai học.
        </p>
      </form>
    </KtShell>
  );
}
