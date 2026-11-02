"use client";
// #414 Vỏ cho phòng rèn luyện cũ (RoomOffline): như App.js bản cũ — nạp giọng đọc của trình duyệt rồi đưa vào ObjREADContext.
import "regenerator-runtime/runtime"; // react-speech-recognition 3.x cần (bản CRA cũ tự có)
import React, { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { ObjREADContext } from "./appShim";
import initializeVoicesAndPlatform from "./ulti/initializeVoicesAndPlatform";
import RoomOffline from "./Roomoffline";

export default function RoomOfflineApp() {
  const [ObjREAD, setObjREAD] = useState(null);
  useEffect(() => {
    let huy = false;
    const nap = async () => {
      const data = await initializeVoicesAndPlatform();
      if (huy) return;
      setObjREAD(data);
      if (data.imale === null || data.ifemale === null) setTimeout(nap, 1000);
    };
    nap();
    return () => {
      huy = true;
    };
  }, []);
  return (
    <ObjREADContext.Provider value={ObjREAD}>
      <div className="rl-phong">
        <RoomOffline setSttRoom={() => {}} />
      </div>
    </ObjREADContext.Provider>
  );
}
