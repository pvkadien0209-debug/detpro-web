"use client";
// #230 Học cùng — /nhom/<mã>/<id>/<người-nghe>/<bài>/<phần?>: trang bài TRONG NHÓM = UnitPage + ngữ cảnh nhóm.
// Tiến độ đọc/ghi trên máy chủ (gom 2,5 giây), thanh "Đang ở nhóm … — Về cây nhóm" + đồng hồ + chuông nhắc,
// khoá bài chưa mở, báo vị trí mỗi 30 giây ("ai đang làm gì"), Hỏi đáp gắn nhãn câu.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "@/lib/router";
import { Users, Lock } from "lucide-react";
import UnitPage from "@/components/hkt/UnitPage";
import { PinGate } from "./NhomVao";
import { NhomCtx, api, getPin, inPopup, docCho, ghiCho } from "./nhomClient"; // #250: bỏ "Hướng dẫn riêng" (NHA H) — dùng Hỏi đáp
import { VongDetLoading } from "@/components/hkt/VongDet";
import { useBodyClass } from "@/components/hkt/KtShell";
import { NhomChatHd } from "./NhomSoiNoi"; // #298 Hỏi đáp có dòng hoạt động
import { useNhomView, useNow, changInfo, baiLabel, Countdown, NhacBell, NhomChat } from "./NhomShared";
import { NGUONG_MAC_DINH, PART_SHORT, nhomPath, nhomUnitPath, baiKey, gopTienDo } from "@/components/hkt/nhomRules";

const SAVE_MS = 2500;
// #262: trang bài trong nhóm dựng lại mỗi lần đổi phần → giữ tiến độ mới nhất trong bộ nhớ trang (bản đọc từ máy chủ có thể chưa kịp nhận lần ghi vừa rồi)
const memProg = new Map(); // "MA/id" → { bài: tiến độ }

function Inner({ ma, id, initialProg, initialUnit }) {
  const { audience, slug, part = "" } = useParams();
  const view = useNhomView(ma, { every: 15000 });
  const [tienDo, setTienDo] = useState(() => ({ ...(initialProg || {}), ...(memProg.get(`${ma}/${id}`) || {}) }));
  const tdRef = useRef(tienDo);
  tdRef.current = tienDo;
  const pending = useRef(new Map()); // bài → tiến độ chờ ghi
  const timer = useRef(null);
  const cauRef = useRef(0);
  const [matMang, setMatMang] = useState(false); // #298 TD-Q1
  // #298 TD-Q1: lần trước mất mạng / đóng trang khi chưa lưu → gộp hàng chờ trong máy vào rồi gửi lại
  useEffect(() => {
    const q = docCho(ma, id);
    const ks = Object.keys(q);
    if (!ks.length) return;
    const td = { ...tdRef.current };
    ks.forEach((bai) => {
      td[bai] = gopTienDo(td[bai], q[bai]);
      pending.current.set(bai, td[bai]);
    });
    tdRef.current = td;
    setTienDo(td);
    memProg.set(`${ma}/${id}`, { ...(memProg.get(`${ma}/${id}`) || {}), ...Object.fromEntries(ks.map((b) => [b, td[b]])) });
    setTimeout(() => flushRef.current(), 300);
  }, [ma, id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const on = () => flushRef.current();
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, []);
  const subs = useRef(new Set()); // #290 trang bài nghe bản gộp từ máy chủ

  const flush = useCallback(async (keepalive) => {
    clearTimeout(timer.current);
    const items = [...pending.current.entries()];
    pending.current.clear();
    for (const [bai, prog] of items) {
      try {
        if (keepalive) {
          // rời trang: gửi kiểu keepalive (không chờ)
          fetch(`/api/nhom/${ma}/tien-do`, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json", "x-nhom-id": id, ...(getPin(ma, id) ? { "x-nhom-pin": getPin(ma, id) } : {}) }, body: JSON.stringify({ bai, prog, id }) }).catch(() => {});
        } else {
          const r = await api(`${ma}/tien-do`, { id, body: { bai, prog } });
          setMatMang(false);
          if (!pending.current.has(bai)) ghiCho(ma, id, bai, null); // #298 đã lưu lên máy chủ → bỏ khỏi hàng chờ trong máy
          if (view.data && r.changHienTai !== view.data.nhom.changHienTai) view.reload();
          // #290 máy chủ trả bản đã gộp (có câu máy khác vừa làm) → gộp vào bản trên trang
          if (r.prog) {
            const local = tdRef.current[bai];
            const g = gopTienDo(r.prog, local);
            if (JSON.stringify(g) !== JSON.stringify(local)) {
              tdRef.current = { ...tdRef.current, [bai]: g };
              setTienDo((t) => ({ ...t, [bai]: g }));
              memProg.set(`${ma}/${id}`, { ...(memProg.get(`${ma}/${id}`) || {}), [bai]: g });
              if (pending.current.has(bai)) pending.current.set(bai, gopTienDo(g, pending.current.get(bai)));
              subs.current.forEach((fn) => fn(bai, g));
            }
          }
        }
      } catch (e) {
        if (e.status !== 423) {
          pending.current.set(bai, gopTienDo(prog, pending.current.get(bai))); // lỗi mạng → thử lại lượt sau
          if (!e.status || e.status >= 500) {
            setMatMang(true);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => flushRef.current(), 15000); // tự thử lại
          }
        } else ghiCho(ma, id, bai, null);
      }
    }
  }, [ma, id, view]);
  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flushRef.current(true);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flushRef.current();
    };
  }, []);

  // báo vị trí "đang làm gì": khi đổi phần + mỗi 30 giây
  useEffect(() => {
    const bai = `${audience}/${slug}`;
    const ping = () => document.visibilityState === "visible" && api(`${ma}/tien-do`, { id, body: { bai, phan: part } }).catch(() => {});
    ping();
    const t = setInterval(ping, 30000);
    return () => clearInterval(t);
  }, [ma, id, audience, slug, part]);

  const nhom = view.data?.nhom;
  const me = view.data?.members.find((m) => m.id === id);

  const ctx = useMemo(() => {
    if (!nhom) return null;
    return {
      ma,
      id,
      nhom,
      ng: nhom.nguong || NGUONG_MAC_DINH,
      treePath: nhomPath(ma, id),
      path: (aud, sl, pt) => nhomUnitPath(ma, id, aud, sl, pt),
      readProg: (aud, sl) => tdRef.current[`${aud}/${sl}`] || null,
      writeProg: (aud, sl, p) => {
        const bai = `${aud}/${sl}`;
        setTienDo((t) => ({ ...t, [bai]: p }));
        tdRef.current = { ...tdRef.current, [bai]: p };
        memProg.set(`${ma}/${id}`, { ...(memProg.get(`${ma}/${id}`) || {}), [bai]: p });
        pending.current.set(bai, p);
        ghiCho(ma, id, bai, gopTienDo(docCho(ma, id)[bai], p)); // #298 TD-Q1 giữ trong máy tới khi máy chủ nhận
        clearTimeout(timer.current);
        timer.current = setTimeout(() => flushRef.current(), SAVE_MS);
      },
      onSync: (fn) => (subs.current.add(fn), () => subs.current.delete(fn)), // #290
      flushNow: () => setTimeout(() => flushRef.current(), 60), // #258 ghi ngay (nút "Đã xong mốc này")
      setCau: (i) => { cauRef.current = i; }, // #255 không trả giá trị (useEffect coi là hàm dọn)
      renderBar: () => <Bar ma={ma} id={id} nhom={nhom} me={me} skew={view.skew} />,
      renderLocked: (k) => (
        <div className="nh-locked">
          <Lock size={40} aria-hidden="true" />
          <h1 className="kt-h1">{baiLabel(nhom.chuoi.bai[k], k)} chưa mở</h1>
          <p>
            {k === (nhom.changHienTai || 0) + 1
              ? <>Bạn được làm trước bài này khi <b>chính bạn</b> đã xong cả 5 phần của {baiLabel(nhom.chuoi.bai[k - 1], k - 1)} (bấm "Đã xong mốc này" ở từng phần).</>
              : <>Bài này mở khi cả nhóm xong 5 phần của {baiLabel(nhom.chuoi.bai[k - 1], k - 1)}.</>}
          </p>
          <Link className="kt-btn kt-btn--pri" to={nhomPath(ma, id)}>
            Về cây nhóm
          </Link>
        </div>
      ),
      renderChat: () => {
        const k = nhom.chuoi.bai.findIndex((u) => u.audience === audience && u.slug === slug);
        const lbl = `${baiLabel(nhom.chuoi.bai[k], k)} · ${PART_SHORT[part] ?? part}${["quiz", "listen-speak", "true-or-false"].includes(part) ? ` · câu ${cauRef.current + 1}` : ""}`;
        return (
          <NhomChatHd
            ma={ma}
            who={{ id }}
            members={view.data?.members || []}
            floating
            slotId="nh-chat-slot"
            chatTat={nhom.chatTat}
            gan={{ bai: `${audience}/${slug}`, phan: part, cau: cauRef.current, nhan: lbl }}
            linkFor={(gan) => {
              const [a, s] = gan.bai.split("/");
              return nhomUnitPath(ma, id, a, s, gan.phan);
            }}
          />
        );
      },
    };
  }, [nhom, me, ma, id, audience, slug, part]); // eslint-disable-line react-hooks/exhaustive-deps

  // chưa có dữ liệu nhóm → chờ (không dựng UnitPage kiểu học riêng, tránh ghi tiến độ vào máy)
  if (!ctx)
    return (
      <div className="nh-center">
        <VongDetLoading />
      </div>
    );
  return (
    <NhomCtx.Provider value={ctx}>
      {matMang && (
        <p className="nh-matmang" role="status">
          📶 Đang mất mạng — câu bạn làm vẫn giữ trong máy, có mạng sẽ tự lưu.
        </p>
      )}
      <UnitPage initialUnit={initialUnit} />
    </NhomCtx.Provider>
  );
}

function Bar({ ma, id, nhom, me, skew }) {
  const now = useNow(skew);
  const pop = inPopup(); // #250: đang mở trong cửa sổ nổi trên cây → không có nút "Về cây nhóm"
  const ci = changInfo(nhom, now);
  const myDone = me && ci.u ? (me.tom?.[baiKey(ci.u)]?.g || []).filter(Boolean).length === 5 : true;
  return (
    <div className="nh-bar" role="region" aria-label="Đang ở nhóm">
      <Users size={16} aria-hidden="true" />
      <span className="nh-bar-t">
        Đang ở nhóm <b>{ma}</b> · {me?.ten || id}
      </span>
      {ci.u && <Countdown dh={ci.dh} label={baiLabel(ci.u, ci.ch)} />}
      <NhacBell nhom={nhom} now={now} chuaXong={me?.trangThai === "hoc" && !myDone} />
      <span id="nh-chat-slot" />
      {!pop && (
        <Link className="nh-bar-back" to={nhomPath(ma, id)}>
          Về cây nhóm
        </Link>
      )}
    </div>
  );
}

export default function NhomBai({ ma, id, initialUnit }) {
  useBodyClass("nh-in"); // #253 không có lối ra khỏi nhóm
  // #250: trong cửa sổ nổi → ẩn khung web (thanh trên, thanh trái, chân trang)
  useEffect(() => {
    if (!inPopup()) return undefined;
    document.body.classList.add("nh-inpop");
    return () => document.body.classList.remove("nh-inpop");
  }, []);
  return (
    <PinGate ma={ma} id={id}>
      {(prog) => <Inner ma={ma} id={id} initialProg={prog} initialUnit={initialUnit} />}
    </PinGate>
  );
}
