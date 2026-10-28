"use client";
// #230 Học cùng — Hỏi đáp nhóm cả trang (/nhom/<mã>/hoi-dap?id=<ID>).
import React, { useEffect, useState } from "react";
import { Link } from "@/lib/router";
import KtShell from "@/components/hkt/KtShell";
import { PinGate } from "./NhomVao";
import { NhomChat } from "./NhomShared";
import { nhomPath, nhomUnitPath } from "@/components/hkt/nhomRules";

export default function NhomHoiDap({ ma }) {
  const [id, setId] = useState(null);
  useEffect(() => setId((new URLSearchParams(window.location.search).get("id") || "").toLowerCase()), []);
  if (id === null) return null;
  return (
    <KtShell>
      <div className="nh-wrap">
        {!id ? (
          <p>
            Mở Hỏi đáp từ cây nhóm của bạn: <Link to={nhomPath(ma)}>chọn ID</Link>.
          </p>
        ) : (
          <PinGate ma={ma} id={id}>
            {() => (
              <>
                <p>
                  <Link to={nhomPath(ma, id)}>‹ Về cây nhóm</Link>
                </p>
                <NhomChat ma={ma} who={{ id }} linkFor={(gan) => { const [a, s] = gan.bai.split("/"); return nhomUnitPath(ma, id, a, s, gan.phan); }} />
              </>
            )}
          </PinGate>
        )}
      </div>
    </KtShell>
  );
}
