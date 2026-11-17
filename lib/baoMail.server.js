// #709 Báo mail cho người hướng dẫn (anh Điện): mỗi lần một người học bấm "Đã xong" một phần bài tập
// → gửi 1 thư từ Gmail của anh về chính mail anh, có tên nhóm, tên người, bài, điểm, câu sai, thời gian làm.
// Khoá (Vercel + .env.local, gốc ở KD-QuanTri\bi-mat\khoa.env): GMAIL_USER, GMAIL_APP_PASSWORD (mật khẩu ứng dụng 16 ký tự),
//   BAO_MAIL_TO (không có → gửi về GMAIL_USER), BAO_MAIL_TAT=1 để tạm tắt.
// Thư báo xong bài (dungThu) CHỈ gửi về mail anh (HĐ điều 9 sửa #709). #900: thư cho người học (thuHv*) chỉ gửi về email CHÍNH người đó đã bấm xác nhận. Lỗi / thiếu khoá → ghi loi_web (không im lặng), không làm hỏng việc lưu bài.
import "server-only";
import nodemailer from "nodemailer";
import { getCollection } from "./mongodb";
import { getUnit } from "./data.server";
import { banCuaPhan, cauCuaBan } from "@/components/hkt/unitData";

export const SITE = (process.env.SITE_URL || "https://detpro.vercel.app").replace(/\/$/, "");
let tp = null;
let daBaoThieu = false;

export const coMail = () => !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) && process.env.BAO_MAIL_TAT !== "1";

async function ghiLoi(loai, chiTiet) {
  try {
    await (await getCollection("loi_web")).insertOne({ loai, chiTiet: String(chiTiet || "").slice(0, 300), trang: "/api/nhom (mail)", ua: "may-chu", luc: new Date() });
  } catch {
    /* bỏ qua */
  }
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const gioVN = (d) => new Date(+new Date(d) + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " ");
const phut = (ms) => (ms > 0 ? (ms < 60e3 ? "dưới 1 phút" : ms < 3600e3 ? `${Math.round(ms / 60e3)} phút` : `${Math.floor(ms / 3600e3)} giờ ${Math.round((ms % 3600e3) / 60e3)} phút`) : "—");

/** Chi tiết Trắc nghiệm: bản đang làm (20 câu), số đúng, câu từng chọn sai (kèm đáp án đã chọn + đáp án đúng). */
export function chiTietQuiz(unit, prog) {
  const qs = unit?.questions || [];
  const pick = prog?.pick || {};
  const ban = banCuaPhan(prog, "quiz");
  const idx = qs.length ? cauCuaBan(qs, "quiz", ban) : [];
  const ok = pick.ok || {};
  const saiTheo = {};
  for (const key of Object.keys(pick.bad || {})) {
    const [g, o] = key.split("-").map(Number);
    (saiTheo[g] ||= []).push(o);
  }
  const sai = idx
    .map((g, l) => ({ g, l }))
    .filter(({ g }) => saiTheo[g])
    .map(({ g, l }) => {
      const q = qs[g];
      const chon = saiTheo[g].map((k) => q?.options?.[q.order?.[k]]).filter(Boolean);
      return { so: l + 1, cau: q?.q, vi: q?.vi, chon, dung: q?.options?.[0], sauDung: !!ok[g] };
    });
  const dung = idx.filter((g) => ok[g] && !saiTheo[g]).length;
  return { ban, tong: idx.length, dungNgay: dung, daDung: idx.filter((g) => ok[g]).length, sai };
}

/** Chi tiết True or false: lượt đang làm, số đúng / đã làm, các câu sai (mệnh đề, đáp số đúng, người học chọn). */
export function chiTietTf(unit, prog) {
  const qs = unit?.questions || [];
  const qa = prog?.qa || {};
  const items = qa.items || [];
  const done = qa.done || {};
  const lam = Object.keys(done).length;
  const dung = Object.values(done).filter((d) => d?.right).length;
  const sai = Object.entries(done)
    .filter(([, d]) => d && !d.right)
    .map(([pos, d]) => {
      const it = items[+pos] || {};
      const q = qs[it.i];
      return { so: +pos + 1, cau: q?.q, menhDe: q?.options?.[it.cand], dapSo: it.truth ? "TRUE" : "FALSE", chon: d.chose === true ? "TRUE" : d.chose === false ? "FALSE" : String(d.chose ?? "") };
    })
    .sort((a, b) => a.so - b.so);
  return { ban: qa.ban || 1, tong: items.length, lam, dung, luot: qa.runs || 1, sai };
}

/** Dựng thư (tiêu đề + html + chữ thường). */
export function dungThu({ nhom, nguoi, tenBai, tieuDeBai, phan, phanTen, ct, batDau, xongLuc, maNhom }) {
  const tg = batDau ? phut(+new Date(xongLuc) - +new Date(batDau)) : "—";
  const diem = phan === "quiz" ? `${ct.daDung}/${ct.tong} câu đúng (đúng ngay lần đầu ${ct.dungNgay}/${ct.tong}) · Bản ${ct.ban}` : `${ct.dung}/${ct.lam} câu đúng (lượt ${ct.luot}, ${ct.lam}/${ct.tong} câu đã làm) · Bản ${ct.ban}`;
  const subject = `[DetPro] ${nguoi} đã xong ${phanTen} · ${tenBai} — ${nhom}`;
  const dong = [
    ["Nhóm", nhom],
    ["Người học", nguoi],
    ["Bài", `${tenBai}${tieuDeBai ? ` — ${tieuDeBai}` : ""}`],
    ["Phần", phanTen],
    ["Kết quả", diem],
    ["Bắt đầu", batDau ? gioVN(batDau) : "—"],
    ["Xong lúc", gioVN(xongLuc)],
    ["Thời gian", tg],
  ];
  const saiHtml = ct.sai.length
    ? ct.sai
        .map((s) =>
          phan === "quiz"
            ? `<li><b>Câu ${s.so}.</b> ${esc(s.cau)}${s.vi ? `<br><i>${esc(s.vi)}</i>` : ""}<br>Đã chọn: <span style="color:#b42318">${esc(s.chon.join(" · "))}</span><br>Đáp án đúng: <span style="color:#0f6e5a">${esc(s.dung)}</span>${s.sauDung ? " <small>(làm lại đã đúng)</small>" : ""}</li>`
            : `<li><b>Câu ${s.so}.</b> ${esc(s.cau)}<br>Mệnh đề: “${esc(s.menhDe)}”<br>Đáp số: <span style="color:#0f6e5a">${s.dapSo}</span> · Đã chọn: <span style="color:#b42318">${esc(s.chon)}</span></li>`
        )
        .join("")
    : "<li>Không sai câu nào 🎉</li>";
  const link = `${SITE}/nhom/${encodeURIComponent(maNhom)}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;color:#1d2b27">
<h2 style="color:#0b5747;margin:0 0 8px">✅ ${esc(nguoi)} đã xong ${esc(phanTen)}</h2>
<table style="border-collapse:collapse;width:100%;font-size:14px">${dong.map(([k, v]) => `<tr><td style="padding:4px 8px;background:#eef7f3;width:110px"><b>${k}</b></td><td style="padding:4px 8px;border-bottom:1px solid #cfe9e1">${esc(v)}</td></tr>`).join("")}</table>
<h3 style="color:#0b5747;margin:16px 0 6px">Câu sai (${ct.sai.length})</h3>
<ol style="padding-left:20px;font-size:14px;line-height:1.5">${saiHtml}</ol>
<p><a href="${link}" style="background:#0f6e5a;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none">Mở cây nhóm</a></p>
<p style="color:#6b7c77;font-size:12px">Thư tự động từ web DetPro — chỉ gửi về mail người hướng dẫn.</p></div>`;
  const text = `${dong.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nCâu sai (${ct.sai.length}):\n${ct.sai.map((s) => (phan === "quiz" ? `- Câu ${s.so}: ${s.cau} | chọn: ${s.chon.join(" · ")} | đúng: ${s.dung}` : `- Câu ${s.so}: ${s.menhDe} | đáp số ${s.dapSo}, chọn ${s.chon}`)).join("\n") || "- không"}\n\n${link}`;
  return { subject, html, text };
}

export async function guiThu({ subject, html, text, to, tatLink }) {
  if (!coMail()) {
    if (!daBaoThieu && process.env.BAO_MAIL_TAT !== "1") {
      daBaoThieu = true;
      await ghiLoi("mail-thieu-khoa", "Chưa có GMAIL_USER / GMAIL_APP_PASSWORD trên máy chủ — thư báo xong bài chưa gửi");
    }
    return false;
  }
  try {
    tp ||= process.env.BAO_MAIL_THU_HOST // chỉ để chạy thử ở máy (hộp thư giả), web thật không đặt biến này
      ? nodemailer.createTransport({ host: process.env.BAO_MAIL_THU_HOST, port: +process.env.BAO_MAIL_THU_PORT || 2525, secure: false, ignoreTLS: true })
      : nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, "") } });
    await tp.sendMail({
      from: `"DetPro báo bài" <${process.env.GMAIL_USER}>`,
      to: to || process.env.BAO_MAIL_TO || process.env.GMAIL_USER, // #900 thư cho người học: to = email đã xác nhận của chính họ
      subject, html, text,
      ...(tatLink ? { headers: { "List-Unsubscribe": `<${tatLink}>` } } : {}),
    });
    return true;
  } catch (e) {
    tp = null;
    await ghiLoi("mail-loi", `${e?.code || ""} ${e?.responseCode || ""} ${String(e?.message || "").slice(0, 160)}`);
    return false;
  }
}

/** #900 Trên Vercel, hàm /api/** KHÔNG mang theo public/jsonData (next.config outputFileTracingExcludes) → getUnit() ra null
 *  và thư báo chỉ còn "0/0 câu". Đọc tệp; không có thì tải chính tệp tĩnh đó từ web. */
async function docBai(audience, slug) {
  const u = await getUnit(audience, slug);
  if (u || !/^[a-z0-9][a-z0-9-]*$/i.test(audience) || !/^[a-z0-9][a-z0-9-]*$/i.test(slug)) return u;
  try {
    const r = await fetch(`${SITE}/jsonData/units/${audience}/${slug}.json`, { cache: "force-cache" });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

/** #900 link cây nhóm + link tắt thư của một người học. */
export const linkHv = (ma, m) => ({
  link: `${SITE}/nhom/${encodeURIComponent(ma)}/${encodeURIComponent(m.id)}`,
  tatLink: m.mail?.tat ? `${SITE}/api/nhom/${encodeURIComponent(ma)}/email-tat?id=${encodeURIComponent(m.id)}&t=${m.mail.tat}` : "",
});

/** Gọi sau khi lưu: dựng + gửi thư cho một phần vừa "Đã xong". Không ném lỗi. */
export async function baoXongPhan({ g, m, bai, phan, phanTen, tenBai, prog, batDau }) {
  try {
    const u = g.chuoi.bai.find((x) => `${x.audience}/${x.slug}` === bai);
    const unit = u ? await docBai(u.audience, u.slug) : null;
    const ct = phan === "quiz" ? chiTietQuiz(unit, prog) : chiTietTf(unit, prog);
    const xongLuc = new Date();
    const thu = dungThu({ nhom: g.ten || g._id, nguoi: m.ten || m.id, tenBai, tieuDeBai: unit?.meta?.title || u?.title, phan, phanTen, ct, batDau, xongLuc, maNhom: g._id });
    const kq = await guiThu(thu);
    // #900 người học đã xác nhận email → thư chúc mừng + báo cáo của chính họ
    if (m.mail?.xn && m.mail.dc) {
      const l = linkHv(g._id, m);
      await guiThu({ ...thuHvXong({ nguoi: m.ten || m.id, nhom: g.ten || g._id, tenBai, tieuDeBai: unit?.meta?.title || u?.title, phan, phanTen, ct, batDau, xongLuc, ...l }), to: m.mail.dc, tatLink: l.tatLink });
    }
    return kq;
  } catch (e) {
    await ghiLoi("mail-loi", `dung thu: ${String(e?.message || "").slice(0, 160)}`);
    return false;
  }
}

// ---------- #900 Thư cho NGƯỜI HỌC (chỉ gửi về email chính họ đã xác nhận) ----------
const khung = (tieuDe, than, { link, nutChu, tatLink } = {}) => `<div style="font-family:Arial,sans-serif;max-width:640px;color:#1d2b27">
<h2 style="color:#0b5747;margin:0 0 10px">${tieuDe}</h2>${than}
${link ? `<p style="margin:18px 0"><a href="${link}" style="background:#0f6e5a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold">${esc(nutChu || "Mở cây nhóm")}</a></p>` : ""}
<p style="color:#6b7c77;font-size:12px;margin-top:20px">Thư tự động từ DetPro (detpro.vercel.app).${tatLink ? ` Không muốn nhận nữa: <a href="${tatLink}" style="color:#6b7c77">tắt thư báo cáo</a>.` : ""}</p></div>`;
const bang = (dong) => `<table style="border-collapse:collapse;width:100%;font-size:14px">${dong.map(([k, v]) => `<tr><td style="padding:4px 8px;background:#eef7f3;width:120px"><b>${esc(k)}</b></td><td style="padding:4px 8px;border-bottom:1px solid #cfe9e1">${esc(v)}</td></tr>`).join("")}</table>`;
/** **đậm**, gạch đầu dòng, xuống dòng — giống ô nhận xét trên web (NhanXet). */
const nhanXetHtml = (t) => esc(String(t || "").replace(/\r/g, "")).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/^\s*[-•*]\s+/gm, "• ").replace(/\n/g, "<br>");
const nhanXetChu = (t) => String(t || "").replace(/\*\*/g, "");

export function thuXacNhan({ nguoi, nhom, link }) {
  const subject = `[DetPro] Xác nhận email nhận báo cáo — ${nhom}`;
  const html = khung(`📩 Chào ${esc(nguoi)}!`, `<p>Bạn vừa đăng ký nhận báo cáo học tập của nhóm <b>${esc(nhom)}</b> qua email này.</p><p>Bấm nút dưới để xác nhận (link dùng được trong 48 giờ). Nếu không phải bạn đăng ký, cứ bỏ qua thư này — sẽ không có thư nào nữa.</p><p>Sau khi xác nhận, bạn sẽ nhận: ⏰ thư nhắc khi chưa xong bài (tối đa 1 thư/ngày, kèm cả nhóm đang tới đâu) · 🎉 thư chúc mừng + báo cáo khi xong một phần bài tập · 🎤 nhận xét bài nói mới của người hướng dẫn.</p>`, { link, nutChu: "Xác nhận email" });
  return { subject, html, text: `Chào ${nguoi}! Xác nhận email nhận báo cáo nhóm ${nhom}: ${link}\n(Link dùng được 48 giờ. Không phải bạn đăng ký thì bỏ qua thư này.)` };
}

/** Chúc mừng xong một phần + báo cáo (điểm, câu sai, thời gian) — cùng số liệu với thư báo anh. */
export function thuHvXong({ nguoi, nhom, tenBai, tieuDeBai, phan, phanTen, ct, batDau, xongLuc, link, tatLink }) {
  const tg = batDau ? phut(+new Date(xongLuc) - +new Date(batDau)) : "—";
  const diem = phan === "quiz" ? `${ct.daDung}/${ct.tong} câu đúng (đúng ngay lần đầu ${ct.dungNgay}/${ct.tong})` : `${ct.dung}/${ct.lam} câu đúng (${ct.lam}/${ct.tong} câu đã làm)`;
  const saiHtml = ct.sai.length
    ? `<h3 style="color:#0b5747;margin:16px 0 6px">Câu cần xem lại (${ct.sai.length})</h3><ol style="padding-left:20px;font-size:14px;line-height:1.5">${ct.sai
        .map((s) =>
          phan === "quiz"
            ? `<li>${esc(s.cau)}${s.vi ? `<br><i>${esc(s.vi)}</i>` : ""}<br>Bạn chọn: <span style="color:#b42318">${esc(s.chon.join(" · "))}</span><br>Đáp án đúng: <span style="color:#0f6e5a">${esc(s.dung)}</span>${s.sauDung ? " <small>(làm lại đã đúng 👍)</small>" : ""}</li>`
            : `<li>“${esc(s.menhDe)}”<br>Đáp số: <span style="color:#0f6e5a">${s.dapSo}</span> · Bạn chọn: <span style="color:#b42318">${esc(s.chon)}</span></li>`
        )
        .join("")}</ol>`
    : "<p>Không sai câu nào — tuyệt vời! 🌟</p>";
  const subject = `[DetPro] 🎉 Chúc mừng ${nguoi} đã xong ${phanTen} · ${tenBai}`;
  const html = khung(`🎉 Chúc mừng ${esc(nguoi)} đã xong ${esc(phanTen)}!`, bang([["Nhóm", nhom], ["Bài", `${tenBai}${tieuDeBai ? ` — ${tieuDeBai}` : ""}`], ["Kết quả", diem], ["Thời gian làm", tg], ["Xong lúc", gioVN(xongLuc)]]) + saiHtml, { link, nutChu: "Học tiếp trên cây nhóm", tatLink });
  const text = `Chúc mừng ${nguoi} đã xong ${phanTen} · ${tenBai} (${nhom}).\nKết quả: ${diem}\nThời gian làm: ${tg}\n${ct.sai.map((s) => (phan === "quiz" ? `- ${s.cau} | bạn chọn: ${s.chon.join(" · ")} | đúng: ${s.dung}` : `- ${s.menhDe} | đáp số ${s.dapSo}, bạn chọn ${s.chon}`)).join("\n")}\n\n${link}${tatLink ? `\nTắt thư: ${tatLink}` : ""}`;
  return { subject, html, text };
}

/** Nhận xét bài nói mới từ người hướng dẫn. */
export function thuHvNhanXet({ nguoi, nhom, tenBai, ghiChu, xanh, link, tatLink }) {
  const subject = `[DetPro] 🎤 Nhận xét mới cho bài nói ${tenBai} — ${nhom}`;
  const html = khung(`🎤 ${esc(nguoi)} ơi, có nhận xét mới cho bài nói!`, `${bang([["Nhóm", nhom], ["Bài", tenBai], ["Trạng thái", xanh ? "✅ Đã đạt" : "Chưa đạt — sửa theo nhận xét rồi gửi lại"]])}<div style="margin-top:14px;padding:12px 14px;background:#fffbea;border-left:4px solid #ffd23f;border-radius:6px;font-size:15px;line-height:1.6">${nhanXetHtml(ghiChu)}</div>`, { link, nutChu: "Mở cây nhóm", tatLink });
  return { subject, html, text: `Nhận xét mới cho bài nói ${tenBai} (${nhom}) — ${xanh ? "Đã đạt" : "Chưa đạt"}:\n${nhanXetChu(ghiChu)}\n\n${link}${tatLink ? `\nTắt thư: ${tatLink}` : ""}` };
}

/** Nhắc hằng ngày: việc của tôi + cả nhóm đang tới đâu (tên + bước, như cây nhóm). */
export function thuHvNhac({ nguoi, nhom, tenBai, hanTxt, viecToi, ds, link, tatLink }) {
  const xong = ds.filter((x) => x.xong).length;
  const subject = `[DetPro] ⏰ ${nguoi} ơi, ${tenBai} đang chờ bạn${hanTxt ? ` (${hanTxt})` : ""}`;
  const dong = ds.map((x) => `<tr><td style="padding:4px 8px;border-bottom:1px solid #eef2f1">${x.laToi ? "<b>" : ""}${esc(x.ten)}${x.laToi ? " (bạn)</b>" : ""}</td><td style="padding:4px 8px;border-bottom:1px solid #eef2f1">${x.xong ? "✅ Đã xong" : esc(x.buoc)}</td></tr>`).join("");
  const html = khung(`⏰ ${esc(nguoi)} ơi, ${esc(tenBai)} đang chờ bạn!`, `<p>Nhóm <b>${esc(nhom)}</b>${hanTxt ? ` · <b>${esc(hanTxt)}</b>` : ""}.</p><p>Việc của bạn bây giờ: <b>${esc(viecToi)}</b></p><h3 style="color:#0b5747;margin:16px 0 6px">Cả nhóm đang tới đâu (${xong}/${ds.length} bạn đã xong)</h3><table style="border-collapse:collapse;width:100%;font-size:14px">${dong}</table>`, { link, nutChu: "Học tiếp ngay", tatLink });
  return { subject, html, text: `${nguoi} ơi, ${tenBai} đang chờ bạn${hanTxt ? ` (${hanTxt})` : ""}. Việc của bạn: ${viecToi}\nCả nhóm (${xong}/${ds.length} đã xong):\n${ds.map((x) => `- ${x.ten}${x.laToi ? " (bạn)" : ""}: ${x.xong ? "Đã xong" : x.buoc}`).join("\n")}\n\n${link}${tatLink ? `\nTắt thư: ${tatLink}` : ""}` };
}
