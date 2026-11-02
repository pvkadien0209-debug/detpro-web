"use client";
// #414 Chép y nguyên mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — chỉ đổi đường import.
import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "@/components/renLuyen/cu/routerShim";
import { socket } from "@/components/renLuyen/cu/appShim";
import PracticeDIV from "./pracPages/B101_FINAL_PROJECTS";
import CountdownTimer from "./pracPages/B101_FINAL_CounterTime";
import LinkAPI, { nopBaiTaiCho } from "@/components/renLuyen/cu/ulti/T0_linkApi";
import sendMessageToServer from "@/components/renLuyen/cu/ulti/sendMessage";
import shuffleArray from "@/components/renLuyen/cu/ulti/shuffleArray";
import DataPracticeComponent from "./pracPages/C_RoomOffline_LAYDULIEUTH";
import Dictaphone from "@/components/renLuyen/cu/ulti/RegcognitionOnly";
const Room = ({ setSttRoom }) => {
  const { roomCode, currentIndex } = useParams();
  const locationSet = useLocation();
  const params = new URLSearchParams(locationSet.search);
  const [users, setUsers] = useState(null);
  const [roomInfo, setRoomInfo] = useState({
    fileName: roomCode,
    objList: [0, 1, 2, 3, 4, 5, 6],
    reverse: 1,
  });
  const [StartToGetData, setStartToGetData] = useState(false);
  const [IndexSets, setIndexSets] = useState(null);
  const [userClient, setUserClient] = useState(null);
  const [allReady, setAllReady] = useState(false);
  const [IsPause, setIsPause] = useState(false);
  const [numberBegin, setNumberBegin] = useState(0);
  const [SttCoundown, setSttCoundown] = useState("00");
  const [DataPracticingCharactor, setDataPracticingCharactor] = useState(null);
  const [DataPracticingOverRoll, setDataPracticingOverRoll] = useState(null);
  const [AllHDTBIPA, setAllHDTBIPA] = useState(null);
  const [AllHDTBHD, setAllHDTBHD] = useState(null);
  const [Score, setScore] = useState(0);
  const [NumberOneByOneHost, setNumberOneByOneHost] = useState(0);
  const [Message, setMessage] = useState(null);
  const [IsReading, setIsReading] = useState(false);
  const navigate = useNavigate();

  // ── Score effect (logic giữ nguyên) ──────────────────────────────────────
  useEffect(() => {
    if (typeof Score !== "number" || isNaN(Score)) return;
    const executeScoreEffect = async () => {
      try {
        const saveScoreToStorage = () => {
          try {
            const paramB = params?.get?.("b") || "";
            const paramA = params?.get?.("a") || "";
            const scoreKey = `score${roomCode}${paramB}${paramA}`;

            if (Score > 1) {
              saveNumberWithDailyExpiry(scoreKey, Score);
            }

            if (Score === 1) {
              const currentScore =
                typeof getNumberWithDailyExpiry === "function"
                  ? getNumberWithDailyExpiry(scoreKey) || 0
                  : JSON.parse(localStorage.getItem(scoreKey) || '{"value":0}')
                      .value || 0;

              setScore(currentScore + 1);
            }
          } catch (storageError) {
            console.error("Error saving score:", storageError);
          }
        };
        const emitSocketMessage = () => {
          try {
            if (Score < 0 || !socket || typeof socket.emit !== "function")
              return;
            let idDinhDanh = null,
              nameDinhDanh = null;
            try {
              idDinhDanh = localStorage.getItem("dinhDanh");
              nameDinhDanh = localStorage.getItem("nameDinhDanh");
            } catch (e) {}
            const displayName =
              nameDinhDanh ||
              (idDinhDanh ? String(idDinhDanh).slice(0, 4) : "") ||
              "Anonymous";
            socket.emit("messageReg", {
              text: `[${Score}] Điểm | `,
              time: String(displayName),
              type: "notify",
              id: idDinhDanh || null,
            });
          } catch (socketError) {
            console.error("Error emitting socket:", socketError);
          }
        };
        const sendEmailNotification = async () => {
          try {
            if (Score === 0 || Score % 10 !== 0 || !LinkAPI) return;
            if (typeof formatTime !== "function") return;
            let nameValue = "NAMENULL";
            try {
              nameValue = localStorage.getItem("nameDinhDanh") || "NAMENULL";
            } catch (e) {}
            let timeParam = "N/A",
              formattedTime = new Date().toLocaleString();
            try {
              const raw = params?.get?.("time");
              if (raw) timeParam = decodeURIComponent(raw);
            } catch (e) {}
            try {
              formattedTime = formatTime(new Date());
            } catch (e) {}
            const requestBody = {
              subjectText: [
                nameValue,
                "UPDATE",
                String(Score),
                String(timeParam),
                String(formattedTime),
                `Link: ${window.location.href}`,
              ].join(" | "),
              contentText: String(window.location.href),
              toEmail: "pvkadien0209@gmail.com",
            };
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            const response = await nopBaiTaiCho(`${LinkAPI}mail-homework`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok)
              console.warn(`Email API status ${response.status}`);
          } catch (emailError) {
            if (emailError.name === "AbortError") console.warn("Email timeout");
            else console.error("Error sending email:", emailError);
          }
        };
        saveScoreToStorage();
        emitSocketMessage();
        await sendEmailNotification();
      } catch (generalError) {
        console.error("General error in score effect:", generalError);
      }
    };
    executeScoreEffect();
  }, [Score]);

  useEffect(() => {
    if (numberBegin !== 0) setSttCoundown("01");
  }, [numberBegin]);
  useEffect(() => {
    setSttRoom(true);
  }, []);

  const fetchTitle = async () => {
    try {
      let response;
      if (roomInfo.fileName.charAt(1) === "z") {
        response = await fetch(`/jsonData/forseo/${roomInfo.fileName}.json`);
      } else {
        response = await fetch(`/jsonData/${roomInfo.fileName}.json`);
      }
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setDataPracticingOverRoll(data);
      let firstList = [currentIndex || 0];
      const aParam = params.get("a");
      if (aParam === "all") {
        firstList = Array.from({ length: data.length }, (_, i) => i);
      } else if (aParam) {
        try {
          const newList = parseStringToNumbers(aParam);
          if (newList && newList.length > 0) firstList = newList;
        } catch (error) {
          console.warn('Failed to parse "a" parameter:', error.message);
        }
      }
      const random = params.get("random") === "true";

      const get_data = interleaveCharacters(
        data,
        firstList,
        params.get("b"),
        params.get("up"),
        random,
        params.get("fsp"),
      );
      setDataPracticingCharactor(get_data.interleaveCharacters_DATA);
      setIndexSets(get_data.IndexSets);
      setAllHDTBIPA(get_data.all_HDTB_IPA);
      setAllHDTBHD(get_data.all_HDTB_HD);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleUpdateNewElenment = (key, value, mode) => {
    socket.emit("updateOneELEMENT", roomCode, socket.id, key, value, mode);
  };

  // ── Screen states ─────────────────────────────────────────────────────────
  // #415 anh dặn: vô thẳng THỰC HÀNH — bỏ màn "Nhập tên → Lấy dữ liệu": tự lấy tên (tài khoản / đã lưu / "Bạn") rồi tải dữ liệu luôn
  useEffect(() => {
    try {
      if (!localStorage.getItem("nameDinhDanh")) {
        let ten = "Bạn";
        try {
          ten = JSON.parse(localStorage.getItem("dp.tk") || "null")?.tenHien || ten;
        } catch {
          /* bỏ qua */
        }
        localStorage.setItem("nameDinhDanh", String(ten).trim().slice(0, 8));
      }
    } catch {
      /* bỏ qua */
    }
    setStartToGetData(true);
    fetchTitle();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!StartToGetData) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f9f9f9",
        }}
      >
        <DataPracticeComponent
          roomCode={roomCode}
          currentIndex={currentIndex}
          setStartToGetData={setStartToGetData}
          fetchTitle={fetchTitle}
        />
      </div>
    );
  }

  if (params && IndexSets && params.get("qstable")) {
    return (
      <div style={{ padding: "5%", fontSize: "larger" }}>
        <h1 style={{ color: "blue" }}>
          Buổi phỏng vấn qua video giữa học viên và người hướng dẫn
        </h1>
        <h5>
          Nhiệm vụ của các học viên trong buổi phỏng vấn này bao gồm:
          <br />
          + Lắng nghe những câu hỏi từ người hướng dẫn;
          <br />
          + Sử dụng bảng thông tin để hỗ trợ quá trình trả lời;
          <br />+ Phân tích tình huống, đặt câu hỏi để làm rõ thông tin và tìm
          kiếm đáp án hợp lý.
        </h5>
        <i>
          Qua quá trình trao đổi, người hướng dẫn sẽ có cơ hội đánh giá quá
          trình thực hành...
        </i>
        <hr />
        {IndexSets.map((e, i) => (
          <div key={i}>
            <b>
              {i + 1}.{DataPracticingCharactor[e].fsp}
            </b>
            <hr />
            {DataPracticingCharactor[e].data.map((e1, i1) => (
              <div key={i1} style={{ padding: "0 5px" }}>
                {e1.qs} ==== {e1.aw}
              </div>
            ))}
            <hr />
          </div>
        ))}
      </div>
    );
  }

  if (roomInfo === null) {
    return (
      <div className="container mt-3">
        <h1>Đang tải thông tin bài thực hành</h1>
        <h1>Vui lòng đợi trong giây lát</h1>
      </div>
    );
  }
  if (DataPracticingCharactor === null) {
    return (
      <div className="container mt-3">
        <h1>Đang tải dữ liệu thực hành. Vui lòng đợi trong giây lát!</h1>
      </div>
    );
  }

  // ── Helpers for compact info bar ──────────────────────────────────────────
  const savedName = localStorage.getItem("nameDinhDanh") || "—";
  const timeParam = params.get("time")
    ? decodeURIComponent(params.get("time")).slice(0, 9)
    : null;
  const noteParam = params.get("note");
  const isStarted = SttCoundown === "01" || numberBegin === 0;

  // ── Main practice view ────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .room-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          background: #f5f6fa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ── Compact top bar ── */
        .room-topbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: #e6ccff;
          border-bottom: 1px solid #d0aaff;
          flex-shrink: 0;
          min-height: 44px;
          overflow: hidden;
        }
        .room-topbar-logo {
          width: 30px;
          height: 30px;
          border-radius: 7px;
          border: 1.5px solid #7c3aed;
          object-fit: cover;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.15s;
        }
        .room-topbar-logo:active { transform: scale(0.93); }

        .room-topbar-info {
          display: flex;
          align-items: center;
          gap: 0;
          flex: 1;
          overflow: hidden;
          flex-wrap: nowrap;
        }
        .room-info-chip {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 2px 7px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .room-info-chip.name   { background: rgba(124,58,237,0.12); color: #5b21b6; }
        .room-info-chip.score  { background: rgba(37,99,235,0.12);  color: #1d4ed8; font-size: 0.8rem; font-weight: 800; }
        .room-info-chip.turns  { background: rgba(5,150,105,0.1);   color: #065f46; }
        .room-info-chip.time   { background: rgba(217,119,6,0.1);   color: #92400e; }
        .room-info-chip.code   { background: rgba(100,116,139,0.1); color: #475569; }
        .room-info-sep { color: #b8a0e0; font-size: 0.65rem; padding: 0 1px; flex-shrink: 0; }

        /* ── Camera button ── */
        .room-cam-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #7c3aed;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, transform 0.1s;
          box-shadow: 0 2px 6px rgba(124,58,237,0.35);
        }
        .room-cam-btn:active { transform: scale(0.93); background: #6d28d9; }

        /* ── Start person button (inside welcome card) ── */
        .room-start-person {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #7c3aed;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 18px auto 0;
          box-shadow: 0 4px 16px rgba(124,58,237,0.4);
          transition: transform 0.15s, background 0.15s;
          animation: person-pulse 2s ease-in-out infinite;
        }
        .room-start-person:active { transform: scale(0.93); animation: none; background: #6d28d9; }

        @keyframes person-pulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(124,58,237,0.4); }
          50%       { box-shadow: 0 4px 26px rgba(124,58,237,0.65); }
        }

        /* ── Practice area ── */
        .room-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          min-height: 0;
        }
        .room-practice-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #ddd;
          border-radius: 0;
          background: #fff0e6;
          position: relative;
        }
        .room-practice-inner {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 12px;
          overflow: hidden;
        }

        /* Welcome overlay */
        .room-welcome-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(255, 240, 230, 0.96);
          backdrop-filter: blur(4px);
          z-index: 10;
          padding: 20px;
        }
        .room-welcome-card {
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 24px 20px;
          text-align: center;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          margin-bottom: 100px;
        }
        .room-welcome-card h2 {
          font-size: 1.4rem;
          color: #2c3e50;
          margin: 0 0 8px;
          font-weight: 800;
        }
        .room-welcome-card p {
          font-size: 0.9rem;
          color: #6b7a90;
          margin: 0;
          line-height: 1.5;
        }

        /* ══════════════════════════════════════════════════════════
           ── Footer: transcript bar — luôn dính đáy màn hình ──
        ══════════════════════════════════════════════════════════ */
        .room-footer {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          width: 100%;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-top: 1.5px solid rgba(124, 58, 237, 0.4);
          padding: 6px 4px;
          min-height: 60px;
          box-sizing: border-box;
          z-index: 20;
          box-shadow: 0 -3px 16px rgba(0, 0, 0, 0.25);
        }
        /* iPhone home-bar safe area */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .room-footer {
            padding-bottom: calc(6px + env(safe-area-inset-bottom));
            min-height: calc(60px + env(safe-area-inset-bottom));
          }
        }

        /* ── Desktop enhancements ── */
        @media (min-width: 700px) {
          .room-root { flex-direction: column; }
          .room-topbar { padding: 8px 16px; gap: 12px; }
          .room-topbar-logo { width: 34px; height: 34px; }
          .room-info-chip { font-size: 0.78rem; padding: 3px 9px; }
          .room-info-chip.score { font-size: 0.88rem; }
          .room-practice-inner { padding: 16px 20px; }
          .room-welcome-card { padding: 32px 28px; }
          .room-welcome-card h2 { font-size: 1.7rem; }
          .room-start-fab { width: 64px; height: 64px; }
          .room-footer { min-height: 56px; padding: 6px 12px; }
        }
      `}</style>

      <div className="room-root" id="roomUltiDiv">
        {/* ── Compact top bar: logo | name | score | turns | time | code */}
        <div className="room-topbar">
          <img
            src="/detpro-icon.svg"
            className="room-topbar-logo"
            alt="logo"
            onClick={() =>
              navigate(
                `/learninghub/${roomCode}?ls=${currentIndex}&&Fid=div_01_content_table_to_practice`,
              )
            }
          />
          <div className="room-topbar-info">
            <span className="room-info-chip name">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {savedName}
            </span>

            <span className="room-info-sep">·</span>

            <span className="room-info-chip score">{Score}đ</span>

            <span className="room-info-sep">·</span>

            <span className="room-info-chip turns">×{numberBegin}</span>

            {timeParam && (
              <>
                <span className="room-info-sep">·</span>
                <span className="room-info-chip time">{timeParam}</span>
              </>
            )}

            {noteParam && (
              <>
                <span className="room-info-sep">·</span>
                <span className="room-info-chip code">
                  {noteParam} <em style={{ opacity: 0.7 }}>{currentIndex}</em>
                </span>
              </>
            )}
            <div
              style={{ marginRight: "20px", marginLeft: "20px" }}
              id="chartContainer"
            />
            <span style={{ marginRight: "20px", marginLeft: "20px" }}>
              {" "}
              {DataPracticingCharactor
                ? DataPracticingCharactor.length
                : 0}{" "}
            </span>
          </div>
        </div>

        {/* ── Main practice body ── */}
        <div className="room-body">
          <div className="room-practice-wrap">
            {/* Active practice component */}
            {SttCoundown === "02" && (
              <div className="room-practice-inner">
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <PracticeDIV
                    DataPracticingOverRoll={DataPracticingOverRoll}
                    DataPracticingCharactor={DataPracticingCharactor}
                    Score={Score}
                    setScore={setScore}
                    numberBegin={numberBegin}
                    indexSets={
                      IndexSets
                        ? IndexSets[(numberBegin - 1) % IndexSets.length]
                        : numberBegin - 1
                    }
                    TimeDefault={params.get("t") || 120}
                    regRate={params.get("r") || 0.5}
                    regRate_01={params.get("r01") || 0.6}
                    handleIncrementReadyClick={() =>
                      setNumberBegin((D) => D + 1)
                    }
                    IsPause={false}
                    IsReading={IsReading}
                    NumberOneByOneHost={0}
                    tableView={params.get("tb") || "Normal"}
                    setMessage={setMessage}
                    roomCode={roomCode}
                  />
                </div>
              </div>
            )}

            {/* Welcome / start overlay — shown before first start */}
            {(SttCoundown === "01" || numberBegin === 0) && (
              <div className="room-welcome-overlay">
                <div className="room-welcome-card">
                  <h2>
                    {numberBegin === 0
                      ? "Sẵn sàng thực hành?"
                      : "Tiếp tục lượt mới"}
                  </h2>
                  <p>
                    {numberBegin === 0
                      ? "Bấm vào để bắt đầu lượt đầu tiên"
                      : `Lượt ${numberBegin} vừa kết thúc — bấm để tiếp tục`}
                  </p>
                  {/* Person icon button — ngay dưới text */}

                  <button
                    className="room-start-person"
                    disabled={IsReading}
                    onClick={() => {
                      if (numberBegin === 0) {
                        setNumberBegin((D) => D + 1);
                        setTimeout(() => setSttCoundown("02"), 100);
                      } else {
                        setSttCoundown("02");
                      }
                    }}
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </button>
                  {IsReading && (
                    <p style={{ color: "#7c3aed", fontWeight: "600" }}>
                      Đang đọc nội dung, vui lòng chờ...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer: always-visible transcript listener ── */}
        <div className="room-footer">
          <Dictaphone
            IsReading={IsReading}
            data={AllHDTBIPA}
            dataTable={AllHDTBHD}
          />
          <div style={{ display: "none" }}>
            <button
              id="readingFalse"
              onClick={() => setIsReading(false)}
              style={{ marginLeft: "10px" }}
            >
              Toggle Reading FALSE
            </button>
            <button
              id="readingTrue"
              onClick={() => setIsReading(true)}
              style={{ marginLeft: "10px" }}
            >
              Toggle Reading TRUE
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Room;

function interleaveCharacters(
  data_all,
  index_sets_t_get_pracData,
  filerSets,
  upCode,
  random,
  fsp,
) {
  const numberGetPerOne = Math.floor(200 / index_sets_t_get_pracData.length);

  // Chọn ngẫu nhiên một trong ba giá trị: Math.floor(numberGetPerOne / 2), numberGetPerOne, hoặc 0
  const randomIndex = Math.floor(Math.random() * 3);
  const numberCut = [Math.floor(numberGetPerOne / 2), numberGetPerOne, 0][
    randomIndex
  ];
  let arrRes_gd_1 = [];
  console.log(index_sets_t_get_pracData);
  index_sets_t_get_pracData.forEach((e) => {
    let getUpCode = "charactor";
    if (upCode && data_all[e]["charactor" + upCode]) {
      getUpCode = "charactor" + upCode;
    }
    let resTemp = getArrayElements(
      filer_type_o_charactor(data_all[e][getUpCode], filerSets, fsp),
      numberCut,
      numberGetPerOne,
    );
    arrRes_gd_1.push(resTemp);
  });

  let arrRes = [];

  for (let i = 0; i < numberGetPerOne; i++) {
    arrRes_gd_1.forEach((e) => {
      if (e[i]) {
        arrRes.push(e[i]);
      }
    });
  }
  console.log(arrRes.length, "Số phần tử bài học");

  const all_HDTB_IPA = (Array.isArray(data_all) ? data_all : []).flatMap((e) =>
    Array.isArray(e?.HDTB?.IP) ? e.HDTB.IP : [],
  );
  const all_HDTB_HD = (Array.isArray(data_all) ? data_all : []).flatMap((e) =>
    Array.isArray(e?.HDTB?.HD) ? e.HDTB.HD : [],
  );
  let getdata_indexSet = [];
  if (random === "true") {
    getdata_indexSet = generateRandomArray(arrRes.length, true);
  } else {
    getdata_indexSet = generateRandomArray(arrRes.length, false);
  }
  return {
    interleaveCharacters_DATA: arrRes,
    indexSet_DATA: getdata_indexSet,
    all_HDTB_IPA,
    all_HDTB_HD,
  };
}
function filer_type_o_charactor(charactorSets, filerTypeSetsStringValue, fsp) {
  try {
    // Check if inputs are valid
    if (!filerTypeSetsStringValue || !Array.isArray(charactorSets)) {
      return charactorSets;
    }

    // Split the filter string into an array using "zz" as separator
    let filerTypeSetsArrayValue = filerTypeSetsStringValue.split("zz");
    console.log(filerTypeSetsArrayValue, "filerTypeSetsArrayValue");

    let res_after_filer = [];
    let filerTypeSetsArrayValueAll = [];
    let filerTypeSetsArrayValueSpecific = [];
    let rangeFilters = [];

    // Process each filter part
    filerTypeSetsArrayValue.forEach((e) => {
      if (e.includes("*")) {
        // Store the prefix (string before the "*") for wildcard matching
        filerTypeSetsArrayValueAll.push(e.replace("*", ""));
      } else if (e.includes("-")) {
        // Handle range filter like A1-5 or A9-10
        rangeFilters.push(e);
      } else {
        filerTypeSetsArrayValueSpecific.push(e);
      }
    });

    charactorSets.forEach((e) => {
      let isTypeMatch = false;

      // Check if the type exactly matches any specific filter
      if (filerTypeSetsArrayValueSpecific.includes(e?.type)) {
        isTypeMatch = true;
      } else {
        // Check if the type starts with any wildcard filter prefix
        for (let prefix of filerTypeSetsArrayValueAll) {
          if (e?.type && e.type.startsWith(prefix)) {
            isTypeMatch = true;
            break;
          }
        }

        // Check if the type falls within any range filter
        if (!isTypeMatch && e?.type) {
          for (let rangeFilter of rangeFilters) {
            // Parse the range filter (e.g., "A1-5" → prefix="A", start=1, end=5)
            const matches = rangeFilter.match(/([A-Za-z]*)(\d+)-(\d+)/);
            if (matches) {
              const prefix = matches[1];
              const start = parseInt(matches[2]);
              const end = parseInt(matches[3]);

              // Check if the type has the same prefix and a number in the range
              const typeMatches = e.type.match(new RegExp(`^${prefix}(\\d+)$`));
              if (typeMatches) {
                const typeNumber = parseInt(typeMatches[1]);
                if (typeNumber >= start && typeNumber <= end) {
                  isTypeMatch = true;
                  break;
                }
              }
            }
          }
        }
      }

      // Check if FSP matches (if FSP filter is provided)
      const eFspStr = (e?.fsp || "").toLowerCase();
      const fspStr = (fsp || "").toLowerCase();
      const isFspMatch = fsp ? eFspStr.includes(fspStr) : true;

      if (isTypeMatch && isFspMatch) {
        res_after_filer.push(e);
      }
    });

    return res_after_filer.length > 0 ? res_after_filer : [];
  } catch (error) {
    console.error("Lỗi trong filer_type_o_charactor:", error);
    return charactorSets;
  }
}

function splitAndConcatArray(array, m) {
  const n = array.length;
  const splitIndex = Math.floor((n * m) / 10);

  const arr1 = array.slice(0, splitIndex);
  const arr2 = array.slice(splitIndex);

  const resultArray = arr2.concat(arr1);

  return resultArray;
}

function generateRandomArray(m, stt_random) {
  let randomArray = [];
  for (let i = 0; i < m; i++) {
    randomArray.push(i);
  }
  if (stt_random) {
    return shuffleArray(randomArray);
  }
  return randomArray;
}
function saveNumberWithDailyExpiry(key, value) {
  const now = new Date();

  // Thời gian hết hạn tính bằng mili giây

  const item = {
    value: value,
  };
  localStorage.setItem(key, JSON.stringify(item));
}

function getNumberWithDailyExpiry(key) {
  const itemStr = localStorage.getItem(key);

  // Kiểm tra nếu không có dữ liệu
  if (!itemStr) return 0;

  const item = JSON.parse(itemStr);
  const now = new Date().getTime();

  // Kiểm tra nếu hết hạn
  if (now > item.expiry) {
    localStorage.removeItem(key); // Xóa dữ liệu hết hạn
    return 0;
  }

  return item.value; // Trả về số nếu chưa hết hạn
}

/**
 * Parses a string to extract numbers, handling special separators
 * zz or a: separates individual numbers
 * - or b: defines a range between two numbers
 *
 * Examples:
 * "0zz2-4" => [0, 2, 3, 4]
 * "0a2b4" => [0, 2, 3, 4]
 *
 * @param {string} input - The string to parse
 * @return {Array|null} - Array of numbers or null if invalid
 */
function parseStringToNumbers(input) {
  try {
    // Replace the defined separators with standard markers for processing
    const normalizedInput = input
      .replace(/zz/g, "a") // Replace 'zz' with 'a'
      .replace(/-/g, "b"); // Replace '-' with 'b'

    // Split the string using regex to capture separators and numbers
    const parts = normalizedInput.split(/([ab])/);
    let result = [];
    let currentNumber = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();

      // Skip empty parts
      if (!part) continue;

      if (part === "a") {
        // 'a' is just a separator, we continue to the next part
        continue;
      } else if (part === "b") {
        // 'b' indicates a range, we need the numbers before and after
        if (currentNumber !== null && i + 1 < parts.length) {
          const nextPart = parts[i + 1].trim();
          if (nextPart && !isNaN(nextPart)) {
            const end = parseInt(nextPart);
            // Generate all numbers in the range (inclusive)
            for (let j = currentNumber + 1; j <= end; j++) {
              result.push(j);
            }
            i++; // Skip the next part as we've already processed it
          }
        }
      } else if (!isNaN(part)) {
        // This is a number
        currentNumber = parseInt(part);
        result.push(currentNumber);
      }
    }

    console.log("Parsed result:", result);
    return result.length > 0 ? result : null;
  } catch (error) {
    console.error("Error parsing string:", error);
    return null;
  }
}

function getArrayElements(arr, m, n) {
  // Tính toán chỉ mục m sao cho không vượt quá độ dài mảng
  const startIndex = m % arr.length;

  // Xếp lại mảng từ startIndex đến hết và nối với phần đầu mảng
  const rotatedArr = arr.slice(startIndex).concat(arr.slice(0, startIndex));

  // Nếu n >= arr.length, trả về toàn bộ mảng đã xoay
  if (n >= arr.length) {
    return rotatedArr;
  }

  // Nếu n < arr.length, trả về n phần tử đầu tiên của mảng đã xoay
  return rotatedArr.slice(0, n);
}
function splitIntoChunks(paramB) {
  if (!paramB) {
    return null;
  }

  // Remove all 'zz' from the string
  paramB = paramB.replace(/zz/g, "");

  let chunks = "";
  for (let i = 0; i < paramB.length; i += 6) {
    chunks += " " + paramB.substring(i, i + 6);
  }

  return chunks.trim(); // Remove leading space
}

const formatTime = (date) => {
  if (!date) return "";
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;
};
