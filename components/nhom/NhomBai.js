"use client";
// #230 Học cùng — /nhom/<mã>/<id>/<người-nghe>/<bài>/<phần?>: trang bài TRONG NHÓM = UnitPage + ngữ cảnh nhóm.
// Tiến độ đọc/ghi trên máy chủ (gom 2,5 giây), thanh "Đang ở nhóm … — Về cây nhóm" + đồng hồ + chuông nhắc,
// khoá bài chưa mở, báo vị trí mỗi 30 giây ("ai đang làm gì"), Hỏi đáp gắn nhãn câu.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "@/lib/router";
import { Users, Lock } from "lucide-react";
import UnitPage from "@/components/hkt/UnitPage";
import { PinGate } from "./NhomVao";
import { NhomCtx, api, getPin } from "./nhomClient";
import { HdrButton, hdrFor } from "./NhomHdr"; // #232 hướng dẫn riêng
import { VongDetLoading } from "@/components/hkt/VongDet";
import { useNhomView, useNow, changInfo, baiLabel, Countdown, NhacBell, NhomChat } from "./NhomShared";
import { NGUONG_MAC_DINH, PART_SHORT, nhomPath, nhomUnitPath, baiKey } from "@/components/hkt/nhomRules";

const SAVE_MS = 2500;

function Inner({ ma, id, initialProg, initialUnit }) {
  const { audience, slug, part = "" } = useParams();
  const view = useNhomView(ma, { every: 15000 });
  const [tienDo, setTienDo] = useState(initialProg || {});
  const tdRef = useRef(tienDo);
  tdRef.current = tienDo;
  const pending = useRef(new Map()); // bài → tiến độ chờ ghi
  const timer = useRef(null);
  const cauRef = useRef(0);

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
          if (view.data && r.changHienTai !== view.data.nhom.changHienTai) view.reload();
        }
      } catch (e) {
        if (e.status !== 423) pending.current.set(bai, prog); // lỗi mạng → thử lại lượt sau
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
        pending.current.set(bai, p);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => flushRef.current(), SAVE_MS);
      },
      setCau: (i) => (cauRef.current = i),
      renderBar: () => <Bar ma={ma} id={id} nhom={nhom} me={me} skew={view.skew} hdr={hdrFor(view.data?.hdr, `${audience}/${slug}`, part)} place={PART_SHORT[part]} />,
      renderLocked: (k) => (
        <div className="nh-locked">
          <Lock size={40} aria-hidden="true" />
          <h1 className="kt-h1">{baiLabel(nhom.chuoi.bai[k], k)} chưa mở</h1>
          <p>Bài này mở khi cả nhóm xong 5 phần của {baiLabel(nhom.chuoi.bai[k - 1], k - 1)} (bạn được làm trước tối đa 1 chặng).</p>
          <Link className="kt-btn kt-btn--pri" to={nhomPath(ma, id)}>
            Về cây nhóm
          </Link>
        </div>
      ),
      renderChat: () => {
        const k = nhom.chuoi.bai.findIndex((u) => u.audience === audience && u.slug === slug);
        const lbl = `${baiLabel(nhom.chuoi.bai[k], k)} · ${PART_SHORT[part] ?? part}${["quiz", "listen-speak", "true-or-false"].includes(part) ? ` · câu ${cauRef.current + 1}` : ""}`;
        return (
          <NhomChat
            ma={ma}
            who={{ id }}
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
      <UnitPage initialUnit={initialUnit} />
    </NhomCtx.Provider>
  );
}

function Bar({ ma, id, nhom, me, skew, hdr, place }) {
  const now = useNow(skew);
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
      <HdrButton ma={ma} nhom={nhom} list={hdr || []} place={place} />
      <span id="nh-chat-slot" />
      <Link className="nh-bar-back" to={nhomPath(ma, id)}>
        Về cây nhóm
      </Link>
    </div>
  );
}

export default function NhomBai({ ma, id, initialUnit }) {
  return (
    <PinGate ma={ma} id={id}>
      {(prog) => <Inner ma={ma} id={id} initialProg={prog} initialUnit={initialUnit} />}
    </PinGate>
  );
}
