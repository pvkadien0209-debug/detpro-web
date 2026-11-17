"use client";
// #900 (anh chốt 17/11) Người học đăng ký email để nhận: ⏰ thư nhắc (1 thư/ngày 19:00, kèm cả nhóm tới đâu)
// · 🎉 chúc mừng + báo cáo khi xong một phần · 🎤 nhận xét bài nói mới. Email phải bấm link xác nhận mới bắt đầu gửi.
// 3 chỗ hiện: kieu="bang" dải nổi đầu trang nhóm (ẩn 3 ngày khi bấm "Để sau") · kieu="xong" ngay sau khi bấm "Đã xong"
// · kieu="cai-dat" trong tab "Của tôi" (đổi / tắt). Email không bao giờ hiện cho người khác.
import { useEffect, useState } from "react";
import { MailPlus, MailCheck, X } from "lucide-react";
import { api } from "./nhomClient";
import { errText } from "./NhomShared";

const SAU = (ma, id) => `dp.nhom.email.sau.${ma}/${id}`;
const BA_NGAY = 3 * 864e5;
const docSau = (ma, id) => {
  try {
    return Date.now() - Number(localStorage.getItem(SAU(ma, id)) || 0) < BA_NGAY;
  } catch {
    return false;
  }
};
const ghiSau = (ma, id) => {
  try {
    localStorage.setItem(SAU(ma, id), String(Date.now()));
  } catch {
    /* bỏ qua */
  }
};
const LOI_BAO = { ok: "✅ Đã xác nhận email — từ giờ bạn sẽ nhận báo cáo qua email.", het: "⌛ Link xác nhận đã quá 48 giờ — gõ lại email để nhận link mới.", tat: "Đã tắt thư báo cáo qua email.", sai: "Link trong thư không còn đúng — gõ lại email để nhận link mới." };

// một lần tải trạng thái cho mỗi trang (dải nổi + tab Của tôi dùng chung)
const cache = new Map();
const nghe = new Set();
function useEmail(ma, id) {
  const k = `${ma}/${id}`;
  const [st, setSt] = useState(() => cache.get(k) || null);
  useEffect(() => {
    if (!ma || !id) return;
    const on = () => setSt(cache.get(k) || null);
    nghe.add(on);
    if (!cache.has(k))
      api(`${ma}/email`, { id })
        .then((x) => {
          cache.set(k, x);
          nghe.forEach((f) => f());
        })
        .catch(() => {});
    return () => nghe.delete(on);
  }, [ma, id, k]);
  const dat = (x) => {
    cache.set(k, x);
    nghe.forEach((f) => f());
  };
  return [st, dat];
}

function Form({ ma, id, st, dat, onXong, nutChu = "Gửi link xác nhận" }) {
  const [v, setV] = useState(st?.email || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const gui = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const x = await api(`${ma}/email`, { id, body: { email: v.trim() } });
      dat(x);
      onXong?.(x);
    } catch (er) {
      setMsg(errText(er));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="nh-email-form" onSubmit={gui}>
      <input type="email" inputMode="email" autoComplete="email" required maxLength={120} placeholder="email của bạn (vd. ten@gmail.com)" value={v} onChange={(e) => setV(e.target.value)} aria-label="Email nhận báo cáo" />
      <button type="submit" className="kt-btn kt-btn--pri" disabled={busy || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())}>
        {busy ? "Đang gửi…" : nutChu}
      </button>
      {msg && <p className="nh-email-loi">{msg}</p>}
    </form>
  );
}

const ChoXn = ({ st }) => (
  <p className="nh-email-cho">
    📬 Đã gửi link xác nhận tới <b>{st.email}</b> — mở hộp thư, bấm <b>“Xác nhận email”</b> (không thấy thì xem mục Spam / Quảng cáo).
  </p>
);

export default function EmailBaoCao({ ma, id, kieu = "bang" }) {
  const [st, dat] = useEmail(ma, id);
  const [an, setAn] = useState(() => kieu === "bang" && docSau(ma, id));
  const [mo, setMo] = useState(kieu !== "bang");
  const [bao, setBao] = useState("");
  // về từ link trong thư: ?email=ok|het|tat|sai
  useEffect(() => {
    if (kieu !== "bang") return;
    try {
      const q = new URLSearchParams(window.location.search).get("email");
      if (q && LOI_BAO[q]) {
        setBao(LOI_BAO[q]);
        cache.delete(`${ma}/${id}`);
        api(`${ma}/email`, { id }).then(dat).catch(() => {});
        const u = new URL(window.location.href);
        u.searchParams.delete("email");
        window.history.replaceState(null, "", u);
      }
    } catch {
      /* bỏ qua */
    }
  }, [kieu, ma, id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (bao && kieu === "bang")
    return (
      <div className="nh-email is-bao" role="status">
        <span>{bao}</span>
        <button type="button" className="nh-email-x" onClick={() => setBao("")} aria-label="Đóng">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    );
  if (!st) return null; // chưa tải / lỗi mạng → không làm phiền

  if (kieu === "cai-dat")
    return (
      <section className="nh-card nh-email-cd">
        <h2>
          <MailCheck size={18} aria-hidden="true" /> Báo cáo qua email
        </h2>
        <p className="kt-muted">⏰ Nhắc khi chưa xong bài (tối đa 1 thư/ngày, 19:00) · 🎉 chúc mừng + báo cáo khi xong một phần · 🎤 nhận xét bài nói mới. Chỉ bạn thấy email này.</p>
        {st.xn ? (
          <>
            <p>
              ✅ Đang gửi về <b>{st.email}</b>
            </p>
            <Form ma={ma} id={id} st={{}} dat={dat} nutChu="Đổi email" />
            <button type="button" className="kt-btn" onClick={() => api(`${ma}/email`, { id, body: { tat: true } }).then(dat).catch(() => {})}>
              Tắt thư báo cáo
            </button>
          </>
        ) : (
          <>
            {st.cho && <ChoXn st={st} />}
            <Form ma={ma} id={id} st={st} dat={dat} nutChu={st.cho ? "Gửi lại link" : "Gửi link xác nhận"} />
          </>
        )}
      </section>
    );

  if (st.xn) return null; // đã nhận báo cáo → dải nổi / lời mời không hiện nữa
  if (kieu === "xong")
    return an ? null : (
      <div className="nh-email is-xong" role="region" aria-label="Nhận báo cáo qua email">
        <p>
          <MailPlus size={18} aria-hidden="true" /> <b>Muốn nhận báo cáo này qua email?</b> Điểm, câu cần xem lại, và lời nhắc khi nhóm sang bài mới.
        </p>
        {st.cho ? <ChoXn st={st} /> : <Form ma={ma} id={id} st={st} dat={dat} />}
        <button type="button" className="nh-email-x" onClick={() => setAn(true)} aria-label="Không, cảm ơn">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    );

  if (an) return null;
  return (
    <div className="nh-email is-bang" role="region" aria-label="Nhận báo cáo qua email">
      {!mo ? (
        <>
          <span>
            📩 <b>Nhận báo cáo qua email</b> — nhắc bài mỗi tối, chúc mừng khi xong bài, nhận xét bài nói mới.
          </span>
          {st.cho ? (
            <button type="button" className="kt-btn" onClick={() => setMo(true)}>
              Chờ xác nhận · gửi lại?
            </button>
          ) : (
            <button type="button" className="kt-btn kt-btn--pri nh-email-nut" onClick={() => setMo(true)}>
              <MailPlus size={16} aria-hidden="true" /> Đăng ký email
            </button>
          )}
          <button type="button" className="kt-linkbtn" onClick={() => (ghiSau(ma, id), setAn(true))}>
            Để sau
          </button>
        </>
      ) : (
        <div className="nh-email-mo">
          {st.cho && <ChoXn st={st} />}
          <Form ma={ma} id={id} st={st} dat={dat} nutChu={st.cho ? "Gửi lại link" : "Gửi link xác nhận"} />
          <button type="button" className="kt-linkbtn" onClick={() => setMo(false)}>
            Thu gọn
          </button>
        </div>
      )}
    </div>
  );
}
