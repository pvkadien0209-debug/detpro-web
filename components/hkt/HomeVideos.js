"use client";
// #206 — Trang chủ: băng video "Bắt đầu với DetPro" — quẹt ngang qua 6 video slide-show (TC1–TC6, TC-Q6).
// Không tự phát (#160): bấm mới phát. Video đã render và có trên Drive (trang-chu-<id>--w01.mp4) → phát bằng khung Drive;
// chưa có → phát bản xem trước ngay trên trang: từng slide + phụ đề Việt, giọng tiếng Anh qua /api/tts (TC-Q1).
import DriveVideo from "./DriveVideo"; // #272
import React, { useEffect, useRef, useState } from "react";
import {
  Play, Pause, ChevronLeft, ChevronRight, Volume2, VolumeX, RotateCcw, LayoutGrid, FileText, ListChecks, Gift, Footprints, Home, Table, BarChart3,
  ThumbsUp, Mic, ShieldCheck, AudioLines, MessageSquareText, Percent, Keyboard, BookOpen, TrendingUp, Split, Timer, DoorOpen, Users, Search,
  Headphones, Repeat, CalendarDays, CircleCheck, Eye, Zap, Brain, Route, BedDouble,
} from "lucide-react";
import VongDet, { SIGN } from "./VongDet";
import { HOME_VIDEOS, videoSeconds, fmtSec } from "./trangChuVideoData";
import { loadDriveList } from "./UnitVideo";
import { playText, stopAudio } from "./audioPlayer";

const ICON = {
  cards: LayoutGrid, article: FileText, abc: ListChecks, free: Gift, steps: Footprints, "screen-home": Home, table: Table, report: BarChart3,
  thumb: ThumbsUp, mic: Mic, allow: ShieldCheck, wave: AudioLines, text: MessageSquareText, half: Percent, keyboard: Keyboard, book: BookOpen,
  curve: TrendingUp, split: Split, clock: Timer, doors: DoorOpen, people: Users, search: Search,
  headphones: Headphones, repeat: Repeat, calendar: CalendarDays, check: CircleCheck, eye: Eye, zap: Zap, brain: Brain, route: Route, bed: BedDouble, // #228
};

/** "**tô vàng**" và "~~gạch~~" trong chữ trên slide. */
function Rich({ text }) {
  return text.split(/(\*\*[^*]+\*\*|~~[^~]+~~)/).map((p, i) =>
    p.startsWith("**") ? <mark key={i}>{p.slice(2, -2)}</mark> : p.startsWith("~~") ? <s key={i}>{p.slice(2, -2)}</s> : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

function Art({ art }) {
  if (art === "ring" || art === "logo") return <VongDet sweep={art === "logo" ? SIGN : 360} track={false} size={88} />;
  const num = { n10000: "10.000", n20: "20" }[art] || (/^n\d+$/.test(art) ? art.slice(1) : null);
  if (num) return <span className={`kt-hv-num ${art === "n10000" ? "is-off" : ""}`}>{num}</span>;
  const I = ICON[art] || BookOpen;
  return <I size={84} strokeWidth={1.6} aria-hidden="true" />;
}

const wait = (ms, alive) => new Promise((r) => setTimeout(r, ms)).then(() => alive());

/** Bản xem trước bằng slide (khi video chưa render). */
function SlidePlayer({ v, onNext }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [sound, setSound] = useState(true);
  const [ended, setEnded] = useState(false);
  const s = v.slides[i];

  useEffect(() => {
    if (!playing || ended) return;
    let live = true;
    const alive = () => live;
    (async () => {
      const t0 = Date.now();
      if (sound) {
        // giọng lỗi / không báo xong → không treo slide: tối đa gấp đôi thời lượng dự kiến
        await Promise.race([playText(s.en), new Promise((r) => setTimeout(r, s.sec * 2000))]);
        if (!live) return;
        const rest = Math.max(700, s.sec * 1000 * 0.5 - (Date.now() - t0));
        if (!(await wait(Math.min(rest, 1200), alive))) return;
      } else if (!(await wait(s.sec * 1000, alive))) return;
      if (i + 1 < v.slides.length) setI(i + 1);
      else {
        setEnded(true);
        setPlaying(false);
      }
    })();
    return () => {
      live = false;
      stopAudio();
    };
  }, [i, playing, sound, ended, s, v.slides.length]);

  useEffect(() => () => stopAudio(), []);

  const go = (n) => {
    setEnded(false);
    setI(Math.max(0, Math.min(v.slides.length - 1, n)));
  };
  return (
    <div className="kt-hv-player" style={{ "--hv": v.color }}>
      <div className="kt-hv-slide" key={i}>
        <div className="kt-hv-art">
          <Art art={s.art} />
        </div>
        <p className="kt-hv-show">
          <Rich text={s.show} />
        </p>
        <img className="kt-hv-det" src="/brand/det-think.png" alt="" />
      </div>
      <div className="kt-hv-sub">
        <span lang="en">{s.en}</span>
        <b>{s.vi}</b>
      </div>
      <div className="kt-hv-bar" aria-hidden="true">
        {v.slides.map((x, k) => (
          <i key={k} className={k < i ? "is-done" : k === i ? (playing ? "is-on" : "is-paused") : ""} style={k === i ? { "--d": `${x.sec}s` } : undefined} />
        ))}
      </div>
      {ended ? (
        <div className="kt-hv-end">
          <button type="button" onClick={() => { go(0); setPlaying(true); }}>
            <RotateCcw size={18} aria-hidden="true" /> Xem lại
          </button>
          {onNext && (
            <button type="button" className="is-pri" onClick={onNext}>
              Video tiếp <ChevronRight size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      ) : (
        <div className="kt-hv-ctl">
          <button type="button" onClick={() => go(i - 1)} aria-label="Slide trước" disabled={i === 0}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => setPlaying(!playing)} aria-label={playing ? "Tạm dừng" : "Phát"}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button type="button" onClick={() => go(i + 1)} aria-label="Slide sau" disabled={i === v.slides.length - 1}>
            <ChevronRight size={18} />
          </button>
          <span>
            {i + 1}/{v.slides.length}
          </span>
          <button type="button" onClick={() => setSound(!sound)} aria-label={sound ? "Tắt giọng đọc" : "Bật giọng đọc"}>
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      )}
    </div>
  );
}

// #228: dùng chung cho trang chủ (HOME_VIDEOS) và trang /huong-dan (GUIDE_VIDEOS)
export default function HomeVideos({ list = HOME_VIDEOS, title = "Bắt đầu với DetPro", sub, id = "kt-hv-h" }) {
  const [drive, setDrive] = useState({});
  const [open, setOpen] = useState(null);
  const track = useRef(null);
  useEffect(() => {
    loadDriveList().then(setDrive);
  }, []);

  const scroll = (dir) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  const openAt = (k) => {
    setOpen(k);
    track.current?.children[k]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  return (
    <section className="kt-hv" aria-labelledby={id}>
      <div className="kt-row-head">
        <div>
          <h2 id={id}>{title}</h2>
          <p className="kt-muted">{sub || `${list.length} video ngắn · tiếng Anh, phụ đề Việt · quẹt để xem tiếp`}</p>
        </div>
        <div className="kt-hv-arrows">
          <button type="button" onClick={() => scroll(-1)} aria-label="Video trước">
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Video sau">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="kt-hv-track" ref={track}>
        {list.map((v, k) => {
          const base = v.file || `trang-chu-${v.id}`;
          const mp4 = drive[`${base}--w01.mp4`];
          const jpg = drive[`${base}--w01.jpg`];
          const sec = videoSeconds(v);
          return (
            <article key={v.id} className={`kt-hv-card ${open === k ? "is-open" : ""}`} style={{ "--hv": v.color }}>
              <div className="kt-hv-frame">
                {open === k && mp4 ? (
                  <DriveVideo id={mp4} poster={jpg ? `https://drive.google.com/thumbnail?id=${jpg}&sz=w960` : undefined} title={v.title} />
                ) : open === k ? (
                  <SlidePlayer v={v} onNext={k + 1 < list.length ? () => openAt(k + 1) : null} />
                ) : (
                  <button type="button" className="kt-hv-cover" onClick={() => openAt(k)} aria-label={`Xem video: ${v.title} (${fmtSec(sec)})`}>
                    {jpg ? (
                      <img src={`https://drive.google.com/thumbnail?id=${jpg}&sz=w960`} alt="" loading="lazy" />
                    ) : (
                      <>
                        <span className="kt-hv-no">{String(k + 1).padStart(2, "0")}</span>
                        <span className="kt-hv-ct">{v.title}</span>
                        <img className="kt-hv-det" src="/brand/det-think.png" alt="" />
                      </>
                    )}
                    <span className="kt-hv-play">
                      <Play size={24} fill="currentColor" aria-hidden="true" />
                    </span>
                    <span className="kt-hv-dur">{fmtSec(sec)}</span>
                  </button>
                )}
              </div>
              <h3>{v.title}</h3>
              <p>{v.blurb}</p>
              {v.source && <small>{v.source}</small>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
