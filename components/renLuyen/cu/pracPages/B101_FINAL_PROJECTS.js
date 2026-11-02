"use client";
// #414 Chép từ mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — giữ bố cục + logic; #416 đổi màu theo DetPro.
import {
  useEffect,
  useState,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
import "./B101_FINAL_PROJECTS.css";
import ReadMessage from "@/components/renLuyen/cu/ulti/ReadMessage_2024";
import Dictaphone from "@/components/renLuyen/cu/ulti/RegcognitionV2024-05-NG";
import TableHD from "./B101_FINAL_TABLE-HD";
import StartButton from "./B101_FINAL_StartButton";
import RegButton from "./B101_FINAL_BUTTON_REG";
import { ObjREADContext } from "@/components/renLuyen/cu/appShim";
import isImageUrl from "@/components/renLuyen/cu/ulti/isImageUrl";
import useImagePreloader from "@/components/renLuyen/cu/useImagePreloader";
import helper_fn_localStorage from "@/components/renLuyen/cu/ulti/helper_fn_localStorage";

let stt_justone_plus = false;

function FINAL_PROJECT({
  DataPracticingOverRoll,
  DataPracticingCharactor,
  Score,
  setScore,
  numberBegin,
  indexSets,
  TimeDefault,
  regRate,
  regRate_01,
  handleIncrementReadyClick,
  IsPause,
  IsReading,
  NumberOneByOneHost,
  tableView,
  setMessage,
  roomCode,
}) {
  const ObjREAD = useContext(ObjREADContext);

  const [StartSTT, setStartSTT] = useState(true);
  const [INDEXtoPlay, setINDEXtoPlay] = useState(-1);
  const [IsMobile, setIsMobile] = useState(false);
  const [playData, setPlayData] = useState(null);
  const [HINT, setHINT] = useState(null);
  const [Submit, setSubmit] = useState(null);
  const [CMD, setCMD] = useState(null);
  const [GENDER, setGENDER] = useState(null);
  const [PushAW, setPushAW] = useState([]);
  const [Lang, setLang] = useState("en-GB");
  const [Clue, setClue] = useState(null);
  const [OnTable, setOnTable] = useState(
    helper_fn_localStorage.getNumberFromLocalStorage(roomCode) >= 0
      ? helper_fn_localStorage.getNumberFromLocalStorage(roomCode)
      : null,
  );
  const [getSTTDictaphone, setGetSTTDictaphone] = useState(false);
  const [bottomOpen, setBottomOpen] = useState(false);
  const [styleMain, setStyles] = useState({
    opacity: 0,
    transition: "opacity 1s ease",
  });

  const resizeTimer = useRef(null);

  // ── Không cần useState — dùng thẳng prop ──────────────────────────
  // AlldataToPractice → DataPracticingCharactor

  // ── useMemo: tính imageUrls 1 lần, không dùng useState+useEffect ──
  const imageUrls = useMemo(() => {
    if (IsMobile) return [];
    const urls = [];
    DataPracticingOverRoll.forEach((e) => {
      e.HDTB.TB.forEach((url) => urls.push(...url));
    });
    return urls;
  }, [DataPracticingOverRoll, IsMobile]);

  useImagePreloader(imageUrls);

  // ── useMemo: table of content — không tính lại mỗi render ─────────
  const tableOfContent = useMemo(
    () => fn_f_allTable_t_tableOfContent(DataPracticingOverRoll),
    [DataPracticingOverRoll],
  );

  // ── useMemo: nav slice — không tính lại trong .map() ──────────────
  const navSlice = useMemo(() => {
    const cur = OnTable ?? 0;
    const total = DataPracticingOverRoll.length;
    let start = Math.max(0, cur - 4);
    let end = Math.min(total, cur + 5);
    if (end - start < 9) {
      if (start === 0) end = Math.min(9, total);
      else start = Math.max(0, total - 9);
    }
    return { start, end };
  }, [OnTable, DataPracticingOverRoll.length]);

  // ── useCallback: stable ref → tránh child re-render ───────────────
  const addElementIfNotExist = useCallback((element) => {
    setPushAW((prev) => (prev.includes(element) ? prev : [...prev, element]));
  }, []);

  // ── Debounced resize ───────────────────────────────────────────────
  const checkScreenSize = useCallback(() => {
    clearTimeout(resizeTimer.current);
    resizeTimer.current = setTimeout(() => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setBottomOpen(true);
    }, 120); // chỉ setState sau 120ms dừng resize
  }, []);

  // ── Effects ───────────────────────────────────────────────────────

  useEffect(() => {
    setTimeout(() => setStyles((p) => ({ ...p, opacity: 1 })), 200);
  }, []);

  useEffect(() => {
    helper_fn_localStorage.saveNumberToLocalStorage(roomCode, OnTable);
  }, [OnTable, roomCode]);

  useEffect(() => {
    // initial check (không debounce lần đầu)
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    if (!mobile) setBottomOpen(true);

    window.addEventListener("resize", checkScreenSize);
    return () => {
      window.removeEventListener("resize", checkScreenSize);
      clearTimeout(resizeTimer.current);
    };
  }, [checkScreenSize]);

  useEffect(() => {
    if (IsPause) {
      setStyles((p) => ({ ...p, opacity: 0 }));
      setTimeout(() => setStartSTT(true), 1000);
    }
  }, [IsPause]);

  useEffect(() => {
    if (!IsPause) {
      if (numberBegin !== 0) {
        setStartSTT(false);
        setINDEXtoPlay(indexSets);
      }
    } else {
      setStyles((p) => ({ ...p, opacity: 0 }));
      setTimeout(() => setStartSTT(true), 1000);
    }
  }, [numberBegin]); // eslint-disable-line

  useEffect(() => {
    if (StartSTT) {
      setPlayData(null);
      // setGetSTTDictaphone(false);
      if (INDEXtoPlay !== -1) handleIncrementReadyClick();
    } else if (INDEXtoPlay >= 0) {
      try {
        setPlayData(
          DataPracticingCharactor[INDEXtoPlay % DataPracticingCharactor.length],
        );
      } catch {}
    }
  }, [StartSTT, INDEXtoPlay]); // eslint-disable-line

  useEffect(() => {
    if (playData === null) {
      // React 18 tự batch — vẫn gom lại cho rõ
      setHINT(null);
      setSubmit(null);
      setCMD(null);
      setGENDER(null);
      setPushAW([]);
      setClue(null);
      setLang("en-GB");
      stt_justone_plus = false;
    } else {
      setHINT(playData.hint);
      setSubmit(playData.submit);
      setClue(playData.clue);
      setCMD(playData.data);
      setGENDER(playData.gender === "female" ? 1 : 0);
      setLang(playData.lang === "VN" ? "vi-VN" : "en-US");
      if ((!IsMobile && NumberOneByOneHost === 0) || playData.fspSets) {
        ReadMessage(
          ObjREAD,
          playData.fsp,
          playData.gender === "female" ? 1 : 0,
          playData.fspSets,
        );
      }
    }
  }, [playData]); // eslint-disable-line

  useEffect(() => {
    if (stt_justone_plus || Submit === null || PushAW.length === 0) return;
    const checkIndex = checkArrays(Submit, PushAW);
    if (checkIndex === 1) {
      stt_justone_plus = true;
      setStyles((p) => ({ ...p, opacity: 0 }));
      setTimeout(() => {
        setStartSTT(true);
        setScore((D) => D + 1);
      }, 1000);
    } else if (checkIndex === 2) {
      setStyles((p) => ({ ...p, opacity: 0 }));
      setTimeout(() => {
        setStartSTT(true);
        setScore((D) => D - 1);
      }, 1000);
    } else if (checkIndex === 3) {
      setScore((D) => D - 1);
    }
  }, [Submit, PushAW]); // eslint-disable-line

  useEffect(() => {
    if (getSTTDictaphone) disableButtonFsp();
    else {
      enableButtonFsp();
      setBottomOpen(false);
    }
  }, [getSTTDictaphone]);

  // ── Mode 1 ────────────────────────────────────────────────────────
  if (NumberOneByOneHost === 1) {
    try {
      return (
        <div style={{ padding: "12px" }}>
          {Clue && isImageUrl(Clue) ? (
            <img
              style={{ border: "4px solid blue", borderRadius: "10px" }}
              width={IsMobile ? "80px" : "150px"}
              src={Clue}
              loading="lazy"
            />
          ) : (
            <img
              width={IsMobile ? "80px" : "120px"}
              style={{ borderRadius: "5px" }}
              src={playData.img}
              loading="lazy"
            />
          )}
          <hr />
          {Clue && !isImageUrl(Clue) && (
            <>
              <hr />
              <b>Clue:</b>
              <h5 style={{ color: "#0f6e5a" }}>{Clue}</h5>
            </>
          )}
          <hr />
          <b>{playData.fsp}</b>
          <br />
          {playData.data.map((e, i) => (
            <div key={i}>
              <b>{e.aw}</b>
            </div>
          ))}
          <br />
          <button
            className="btn btn-outline-primary fp-btn-lg"
            onClick={() => {
              setStyles((p) => ({ ...p, opacity: 0 }));
              setTimeout(() => {
                setStartSTT(true);
                setScore((D) => D + 1);
              }, 1000);
            }}
          >
            Done
          </button>
        </div>
      );
    } catch {}
  }

  // ── Mode 2 ────────────────────────────────────────────────────────
  if (NumberOneByOneHost === 2) {
    try {
      return (
        <div style={{ padding: "12px" }}>
          {/* NEXT chỉ hiện khi có playData */}
          {playData !== null && (
            <button
              className="btn btn-outline-primary fp-btn-lg"
              onClick={() => {
                setStyles((p) => ({ ...p, opacity: 0 }));
                setTimeout(() => {
                  setStartSTT(true);
                  setScore((D) => D - 1);
                }, 1000);
              }}
            >
              NEXT
            </button>
          )}
          {/* Dictaphone LUÔN hiển thị khi getSTTDictaphone=true, bất kể playData */}
          <div
            className={`transition-container ${getSTTDictaphone ? "show-dictaphone" : "show-regbutton"}`}
          >
            DDDDDDDDDDDĐ
            {getSTTDictaphone ? (
              <Dictaphone
                getSTTDictaphone={getSTTDictaphone}
                setGetSTTDictaphone={setGetSTTDictaphone}
                CMDlist={CMD}
                GENDER={GENDER}
                setScore={setScore}
                addElementIfNotExist={addElementIfNotExist}
                ObjVoices={ObjREAD}
                Lang={Lang}
                regRate={regRate}
                regRate_01={regRate_01}
                setStartSTT={setStartSTT}
                setMessage={setMessage}
              />
            ) : playData !== null ? (
              <RegButton setGetSTTDictaphone={setGetSTTDictaphone} />
            ) : null}
          </div>
        </div>
      );
    } catch {}
  }

  // ── Main mode ─────────────────────────────────────────────────────
  try {
    return (
      <div
        style={{
          ...styleMain,
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          overflow: "hidden",
        }}
      >
        {StartSTT ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <StartButton
              setINDEXtoPlay={setINDEXtoPlay}
              INDEXtoPlay={INDEXtoPlay}
              setStartSTT={setStartSTT}
              Score={Score}
            />
          </div>
        ) : (
          <>
            {/* ── TOP: Table area ── */}
            <div className="fp-table-area">
              <div className="fp-nav-bar">
                <button
                  className={`fp-nav-btn fp-nav-all ${OnTable === null ? "active" : ""}`}
                  onClick={() => setOnTable(null)}
                >
                  All
                </button>
                {DataPracticingOverRoll.map((e, i) => {
                  if (i < navSlice.start || i >= navSlice.end) return null;
                  return (
                    <button
                      key={i}
                      className={`fp-nav-btn ${OnTable === i ? "active" : ""}`}
                      onClick={() => setOnTable(i)}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              {/* {PushAW.length > 0 && (
                <div className="fp-pushaw-strip">
                  <span className="fp-pushaw-label">✓ Đã chọn:</span>
                  {PushAW.map((item, i) =>
                    isImageUrl(item) ? (
                      <img
                        key={i}
                        src={item}
                        className="fp-pushaw-chip-img"
                        alt={`aw-${i}`}
                      />
                    ) : (
                      <span key={i} className="fp-pushaw-chip">
                        {item.length > 12 ? item.slice(0, 10) + "…" : item}
                      </span>
                    ),
                  )}
                </div>
              )} */}

              <div className="fp-table-scroll">
                {(tableView === "Normal" ||
                  tableView.toLowerCase() === "tv") && (
                  <TableHD
                    data={
                      OnTable !== null
                        ? DataPracticingOverRoll[OnTable]["HDTB"][
                            tableView === "Normal" ? "HD" : "TV"
                          ]
                        : tableOfContent
                    }
                    data_TB={
                      OnTable !== null
                        ? DataPracticingOverRoll[OnTable]["HDTB"]["TB"]
                        : []
                    }
                    HINT={OnTable !== null ? HINT : null}
                    PushAW={OnTable !== null ? PushAW : []}
                    fnOnclick={(e, cmd) => {
                      if (OnTable !== null) {
                        try {
                          if (cmd === "submit") addElementIfNotExist(e);
                        } catch {}
                      } else {
                        const m = e.match(/\((\d+)\)/);
                        if (m) setOnTable(parseInt(m[1], 10) - 1);
                      }
                    }}
                  />
                )}
                <div style={{ height: "16px" }} />
              </div>
            </div>

            <button
              style={{ display: "none" }}
              id="setGetSTTDictaphone"
              onClick={() => setGetSTTDictaphone(false)}
            />
          </>
        )}
        {/* ── BOTTOM: Speech panel ── */}
        <div
          className={`fp-bottom-panel ${getSTTDictaphone ? "speaking" : bottomOpen ? "open" : "closed"}`}
        >
          {(bottomOpen || getSTTDictaphone) && (
            <div className="fp-panel-body">
              {Clue && !isImageUrl(Clue) && (
                <div className="fp-clue-box">
                  <span>📌</span>
                  <b>Gợi ý: </b>
                  <span style={{ color: "#0f6e5a" }}>{Clue}</span>
                </div>
              )}

              {playData?.hint ? (
                isImageUrl(playData.hint) ? (
                  <img
                    className="fp-hint-img"
                    src={playData.hint}
                    loading="lazy"
                    alt="hint"
                  />
                ) : (
                  <div className="fp-hint-text">
                    <div className="fp-hint-title">💡 Gợi ý</div>
                    {playData.hint.includes("zzzz") ? (
                      <div style={{ whiteSpace: "pre-line" }}>
                        {
                          playData.hint.split("zzzz")[
                            numberBegin % playData.hint.split("zzzz").length
                          ]
                        }
                      </div>
                    ) : (
                      <div>{playData.hint}</div>
                    )}
                  </div>
                )
              ) : playData?.img ? (
                <img
                  className="fp-thumb-img"
                  src={playData.img}
                  loading="lazy"
                  alt="thumb"
                />
              ) : null}
              <p id="aw01Textcontent"></p>
            </div>
          )}

          <div className="fp-panel-header">
            <button
              className="fp-toggle-btn"
              onClick={() => {
                if (getSTTDictaphone) {
                  window.dispatchEvent(new CustomEvent("dtph-soft-exit"));
                  setTimeout(() => setBottomOpen(false), 320);
                } else {
                  setBottomOpen((b) => !b);
                }
              }}
            >
              <span className="fp-toggle-arrow">
                {bottomOpen || getSTTDictaphone ? "▼" : "▲"}
              </span>
              <span className="fp-toggle-label">
                {bottomOpen || getSTTDictaphone
                  ? "Thu gọn"
                  : playData?.hint
                    ? "Gợi ý . . ."
                    : "🎙 Thông tin thêm"}
              </span>
            </button>

            {!bottomOpen && Clue && !isImageUrl(Clue) && (
              <span className="fp-collapsed-clue">
                📌 {String(Clue).slice(0, 24)}
                {Clue.length > 24 ? "…" : ""}
              </span>
            )}

            <div className="fp-panel-actions">
              <Dictaphone
                getSTTDictaphone={getSTTDictaphone}
                setGetSTTDictaphone={setGetSTTDictaphone}
                CMDlist={CMD}
                GENDER={GENDER}
                setScore={setScore}
                addElementIfNotExist={addElementIfNotExist}
                ObjVoices={ObjREAD}
                Lang={Lang}
                regRate={regRate}
                regRate_01={regRate_01}
                setStartSTT={setStartSTT}
                setMessage={setMessage}
              />
              {/* {playData?.hint ? (
                isImageUrl(playData.hint) ? (
                  <img
                    className="fp-hint-img"
                    src={playData.hint}
                    loading="lazy"
                    alt="hint"
                  />
                ) : (
                  <div className="fp-hint-text">
                    <div className="fp-hint-title">💡 Gợi ý</div>
                    {playData.hint.includes("zzzz") ? (
                      <div style={{ whiteSpace: "pre-line" }}>
                        {
                          playData.hint.split("zzzz")[
                            numberBegin % playData.hint.split("zzzz").length
                          ]
                        }
                      </div>
                    ) : (
                      <div>{playData.hint}</div>
                    )}
                  </div>
                )
              ) : null} */}

              <button
                id="ngheLaiBtn"
                className="btn btn-outline-primary fp-btn-lg"
                disabled={IsReading}
                onClick={() => {
                  try {
                    ReadMessage(
                      ObjREAD,
                      playData.fsp,
                      playData.gender === "female" ? 1 : 0,
                      playData.fspSets,
                    );
                  } catch {}
                }}
                title="Nghe lại"
              >
                Nghe lại
              </button>
              <button
                id="btnBoQua"
                className="fp-icon-btn fp-skip-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    setStyles((p) => ({ ...p, opacity: 0 }));
                    setTimeout(() => {
                      setStartSTT(true);
                      setScore((D) => D - 1);
                    }, 1000);
                  } catch {}
                }}
                title="Bỏ qua"
              >
                ⏭
              </button>
              <span>____________</span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}

export default FINAL_PROJECT;

// ── Helpers ───────────────────────────────────────────────────────────

function checkArrays(array01, array02) {
  const allInArray02 = array01.every((e) => array02.includes(e));
  const extra = array02.filter((e) => !array01.includes(e));
  if (extra.length >= 2) return 2;
  if (extra.length > 0 && !allInArray02) return 3;
  if (allInArray02 && extra.length < 2) return 1;
  return 0;
}

function enableButtonFsp() {
  const b = document.getElementById("BtnFsp");
  if (b) {
    b.disabled = false;
    b.style.cursor = "pointer";
    b.style.opacity = "1";
  }
}

function disableButtonFsp() {
  const b = document.getElementById("BtnFsp");
  if (b) {
    b.disabled = true;
    b.style.cursor = "not-allowed";
    b.style.opacity = "0.2";
  }
}

function fn_f_allTable_t_tableOfContent(input) {
  const resSets = [];
  input.forEach((e, i) => {
    if (i % 4 === 0) resSets.push({});
    resSets[resSets.length - 1]["id" + (i % 4)] =
      (e.HDTB.IF.IFname || e.HDTB.IF.Ifname) + " (" + (i + 1) + ")";
  });
  return resSets;
}
