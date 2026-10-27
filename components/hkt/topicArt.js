"use client";
// #072 — Hình đại diện chủ đề (30 hình, Claude vẽ): nét trắng bo tròn trên nền màu chủ đề.
// viewBox 0 0 160 120 · lớp "f" = tô trắng mờ · "s" = tô trắng đặc · kiểu nét trong kt.css (.kt-art).
// Thêm chủ đề mới: thêm một khoá slug → chuỗi SVG; không có thì ảnh bìa hiện dấu "?" như cũ.
import React from "react";
import { artFor } from "./topicArtMore"; // #199: hình cho mọi chủ đề còn lại, không còn dấu "?"

export const TOPIC_ART = {
  "job-interview-preparation":
    '<rect class="f" x="52" y="22" width="56" height="76" rx="6"/><rect x="52" y="22" width="56" height="76" rx="6"/><rect class="s" x="68" y="16" width="24" height="12" rx="4"/><circle cx="80" cy="46" r="8"/><path d="M66 70h28M66 82h18"/><path d="M112 74l8 8 16-18"/>',
  "communication-at-work":
    '<path class="f" d="M24 30h62a8 8 0 0 1 8 8v26a8 8 0 0 1-8 8H50l-14 12V72H24a8 8 0 0 1-8-8V38a8 8 0 0 1 8-8z"/><path d="M24 30h62a8 8 0 0 1 8 8v26a8 8 0 0 1-8 8H50l-14 12V72H24a8 8 0 0 1-8-8V38a8 8 0 0 1 8-8z"/><path d="M104 50h32a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8h-4v12l-12-12h-16a8 8 0 0 1-8-8"/><path d="M34 46h40M34 58h26"/>',
  "first-months-at-work":
    '<rect class="f" x="30" y="26" width="100" height="78" rx="8"/><rect x="30" y="26" width="100" height="78" rx="8"/><path d="M30 46h100M54 18v16M106 18v16"/><path d="M46 64l5 5 9-10M76 64l5 5 9-10M106 64l5 5 9-10M46 88l5 5 9-10"/><circle class="s" cx="111" cy="90" r="5"/>',
  "first-time-team-leader":
    '<circle cx="40" cy="56" r="10"/><path d="M22 96c0-12 8-20 18-20s18 8 18 20"/><circle cx="120" cy="56" r="10"/><path d="M102 96c0-12 8-20 18-20s18 8 18 20"/><circle class="f" cx="80" cy="44" r="14"/><circle cx="80" cy="44" r="14"/><path d="M56 104c0-16 10-26 24-26s24 10 24 26"/><path class="s" d="M80 10l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"/>',
  "presenting-to-managers":
    '<rect class="f" x="22" y="18" width="98" height="66" rx="6"/><rect x="22" y="18" width="98" height="66" rx="6"/><path d="M44 70V58M64 70V46M84 70V38M104 70V30"/><path d="M60 84l-10 22M82 84l10 22M71 84v14"/><circle cx="138" cy="58" r="8"/><path d="M128 104c0-14 4-28 10-28s10 14 10 28M131 84l-14-12"/>',
  "starting-university-away-from-home":
    '<path class="f" d="M18 60l42-24 42 24-42 24z"/><path d="M18 60l42-24 42 24-42 24z"/><path d="M36 70v18c8 8 40 8 48 0V70M102 60v24"/><path class="f" d="M108 104V78l20-16 20 16v26z"/><path d="M108 104V78l20-16 20 16v26zM122 104V90h12v14"/>',
  "part-time-jobs":
    '<path class="f" d="M40 50h56v34a20 20 0 0 1-20 20H60a20 20 0 0 1-20-20z"/><path d="M40 50h56v34a20 20 0 0 1-20 20H60a20 20 0 0 1-20-20z"/><path d="M96 58h8a12 12 0 0 1 0 24h-8"/><path d="M56 40c-6-8 6-12 0-22M72 40c-6-8 6-12 0-22"/><circle cx="130" cy="36" r="16"/><path d="M130 28v8l6 4"/>',
  "before-graduating":
    '<path class="f" d="M14 50l46-24 46 24-46 24z"/><path d="M14 50l46-24 46 24-46 24z"/><path d="M32 60v20c10 10 46 10 56 0V60M106 50v24"/><circle class="s" cx="106" cy="78" r="5"/><rect class="f" x="116" y="70" width="36" height="22" rx="4"/><rect x="116" y="70" width="36" height="22" rx="4"/><path d="M134 92v14l5-4 5 4V92"/>',
  "first-job-after-graduating":
    '<rect class="f" x="30" y="40" width="100" height="62" rx="8"/><rect x="30" y="40" width="100" height="62" rx="8"/><path d="M62 40v-8a6 6 0 0 1 6-6h24a6 6 0 0 1 6 6v8M30 66h100"/><rect class="s" x="72" y="60" width="16" height="12" rx="3"/><path d="M140 22l4 8 8 4-8 4-4 8-4-8-8-4 8-4z"/>',
  "problem-solving":
    '<path class="f" d="M80 16a30 30 0 0 0-18 54c4 4 6 8 6 14h24c0-6 2-10 6-14a30 30 0 0 0-18-54z"/><path d="M80 16a30 30 0 0 0-18 54c4 4 6 8 6 14h24c0-6 2-10 6-14a30 30 0 0 0-18-54z"/><path d="M68 94h24M72 104h16M80 84V64l-8-8M80 64l8-8"/><path d="M30 30l-10-6M24 50H12M130 30l10-6M136 50h12"/>',
  "time-management":
    '<circle class="f" cx="80" cy="62" r="40"/><circle cx="80" cy="62" r="40"/><path d="M80 36v26l18 12"/><path d="M60 14h40M80 14v8M118 26l8-8"/><circle class="s" cx="80" cy="62" r="4"/>',
  "critical-thinking":
    '<rect class="f" x="18" y="22" width="76" height="80" rx="6"/><rect x="18" y="22" width="76" height="80" rx="6"/><path d="M32 42h48M32 56h40M32 70h28"/><circle cx="100" cy="70" r="22"/><path d="M116 86l20 20"/><path d="M92 70l6 6 12-12"/>',
  "teamwork":
    '<circle class="f" cx="62" cy="50" r="28"/><circle cx="62" cy="50" r="28"/><circle class="f" cx="98" cy="50" r="28"/><circle cx="98" cy="50" r="28"/><circle class="f" cx="80" cy="80" r="28"/><circle cx="80" cy="80" r="28"/><circle class="s" cx="80" cy="60" r="6"/>',
  "handling-conflict":
    '<path class="f" d="M16 26h52a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8H40L28 78V66H16a8 8 0 0 1-8-8V34a8 8 0 0 1 8-8z"/><path d="M16 26h52a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8H40L28 78V66H16a8 8 0 0 1-8-8V34a8 8 0 0 1 8-8z"/><path d="M22 46l8-8 8 8 8-8 8 8 8-8"/><path d="M92 48h52a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8h-12v12l-12-12H92a8 8 0 0 1-8-8V56a8 8 0 0 1 8-8z"/><path d="M98 68c6-6 10 6 16 0s10 6 16 0s10 6 16 0"/>',
  "persuasion-negotiation":
    '<path d="M80 18v86M52 104h56M30 34h100"/><circle class="s" cx="80" cy="18" r="5"/><path d="M30 34l-16 34h32zM130 34l-16 34h32z"/><path class="f" d="M14 68a16 10 0 0 0 32 0zM114 68a16 10 0 0 0 32 0z"/><path d="M14 68a16 10 0 0 0 32 0zM114 68a16 10 0 0 0 32 0z"/>',
  "customer-service":
    '<path d="M40 70V58a40 40 0 0 1 80 0v12"/><rect class="f" x="30" y="62" width="20" height="30" rx="8"/><rect x="30" y="62" width="20" height="30" rx="8"/><rect class="f" x="110" y="62" width="20" height="30" rx="8"/><rect x="110" y="62" width="20" height="30" rx="8"/><path d="M120 92c0 10-10 14-26 14"/><circle class="s" cx="88" cy="106" r="5"/>',
  "presentation-skills":
    '<rect class="f" x="62" y="12" width="36" height="56" rx="18"/><rect x="62" y="12" width="36" height="56" rx="18"/><path d="M50 52a30 30 0 0 0 60 0M80 82v20M60 106h40"/><path d="M72 30h16M72 42h16"/><path d="M28 34c-6 8-6 22 0 30M134 34c6 8 6 22 0 30"/>',
  "learning-how-to-learn":
    '<path class="f" d="M80 36c-14-10-36-12-56-8v68c20-4 42-2 56 8 14-10 36-12 56-8V28c-20-4-42-2-56 8z"/><path d="M80 36c-14-10-36-12-56-8v68c20-4 42-2 56 8 14-10 36-12 56-8V28c-20-4-42-2-56 8zM80 36v68"/><path d="M38 50h26M38 62h26M96 50h26M96 62h18"/><path class="s" d="M134 8l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',
  "small-shop":
    '<path class="f" d="M24 50h112v54H24z"/><path d="M24 50v54h112V50"/><path d="M18 26h124l-6 24H24z"/><path d="M24 50c0 8 14 8 14 0 0 8 14 8 14 0 0 8 14 8 14 0 0 8 14 8 14 0 0 8 14 8 14 0 0 8 14 8 14 0 0 8 14 8 14 0"/><path d="M40 104V74h24v30"/><rect x="82" y="72" width="38" height="20" rx="3"/>',
  "online-selling":
    '<rect class="f" x="26" y="14" width="54" height="94" rx="10"/><rect x="26" y="14" width="54" height="94" rx="10"/><path d="M46 24h14M40 92h26"/><path d="M38 46h6l6 22h20l6-16H48"/><circle class="s" cx="54" cy="76" r="3"/><circle class="s" cx="68" cy="76" r="3"/><path class="f" d="M98 58l26-12 26 12-26 12z"/><path d="M98 58l26-12 26 12-26 12zM98 58v32l26 12 26-12V58M124 70v32"/>',
  "introduce-yourself":
    '<rect class="f" x="34" y="30" width="92" height="66" rx="10"/><rect x="34" y="30" width="92" height="66" rx="10"/><path d="M34 52h92"/><path d="M52 40h56"/><circle cx="62" cy="72" r="8"/><path d="M80 68h30M80 80h22"/><path d="M118 14c6 2 10 6 10 12"/>',
  "answer-interview-questions":
    '<path class="f" d="M18 22h64a8 8 0 0 1 8 8v30a8 8 0 0 1-8 8H48l-14 12V68H18a8 8 0 0 1-8-8V30a8 8 0 0 1 8-8z"/><path d="M18 22h64a8 8 0 0 1 8 8v30a8 8 0 0 1-8 8H48l-14 12V68H18a8 8 0 0 1-8-8V30a8 8 0 0 1 8-8z"/><path d="M42 38a8 8 0 1 1 10 8v4"/><circle class="s" cx="52" cy="58" r="3"/><path d="M84 54h58a8 8 0 0 1 8 8v26a8 8 0 0 1-8 8h-10v12l-14-12H84a8 8 0 0 1-8-8"/><path d="M96 74l8 8 18-18"/>',
  "grammar-structures":
    '<rect class="f" x="16" y="58" width="40" height="40" rx="6"/><rect x="16" y="58" width="40" height="40" rx="6"/><rect class="f" x="60" y="58" width="40" height="40" rx="6"/><rect x="60" y="58" width="40" height="40" rx="6"/><rect class="f" x="38" y="16" width="40" height="40" rx="6"/><rect x="38" y="16" width="40" height="40" rx="6"/><path d="M28 88l8-20 8 20M31 82h10M74 68v20h8a5 5 0 0 0 0-10h-8 7a5 5 0 0 0 0-10h-7M66 26"/><path d="M66 30a10 10 0 1 0 0 12"/><path d="M112 98h34M112 86h26M112 74h30"/>',
  "solar-system":
    '<circle class="f" cx="44" cy="62" r="22"/><circle cx="44" cy="62" r="22"/><path d="M44 28v-8M44 104v-8M10 62h8M70 62h8M20 38l-6-6M68 38l6-6M20 86l-6 6M68 86l6 6"/><ellipse cx="80" cy="62" rx="72" ry="30" stroke-dasharray="4 10"/><circle class="s" cx="128" cy="38" r="9"/><ellipse cx="128" cy="38" rx="17" ry="6" transform="rotate(-20 128 38)"/><circle class="s" cx="110" cy="90" r="4"/>',
  "world-heritage":
    '<path class="f" d="M50 104V76h60v28z"/><path d="M40 104h80M54 104V76M106 104V76M72 104V86h16v18"/><path d="M36 76h88l-12-14H48z"/><path class="f" d="M48 62h64l-10-14H58z"/><path d="M48 62h64l-10-14H58zM60 48V36h40v12M54 36h52l-8-12H62zM80 24v-12"/><circle class="s" cx="80" cy="10" r="4"/>',
  "travel-abroad-skills":
    '<circle class="f" cx="80" cy="60" r="42"/><circle cx="80" cy="60" r="42"/><path class="s" d="M80 30l10 30-10 30-10-30z"/><path d="M80 30l10 30-10 30-10-30z"/><path d="M80 12v8M80 100v8M32 60h8M120 60h8"/><circle cx="80" cy="60" r="4"/>',
  "first-trip-abroad":
    '<path d="M14 100c30 0 40-30 70-40" stroke-dasharray="4 10"/><path class="f" d="M84 60l58-34c8-4 14 4 8 10l-34 30 4 30-8 6-10-26-22 18 2 12-6 4-8-18-18-8 4-6 12 2 18-22-26-10 6-8z"/><path d="M84 60l58-34c8-4 14 4 8 10l-34 30 4 30-8 6-10-26-22 18 2 12-6 4-8-18-18-8 4-6 12 2 18-22-26-10 6-8z"/>',
  "business-trip-abroad":
    '<rect class="f" x="36" y="38" width="72" height="66" rx="8"/><rect x="36" y="38" width="72" height="66" rx="8"/><path d="M58 38V26a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v12M56 50v42M88 50v42"/><circle cx="124" cy="46" r="18"/><path d="M106 46h36M124 28c-8 10-8 26 0 36M124 28c8 10 8 26 0 36"/><path d="M108 56l-8 8"/>',
  "vietnamese-food":
    '<path class="f" d="M22 60h116a58 40 0 0 1-116 0z"/><path d="M22 60h116a58 40 0 0 1-116 0zM60 100h40"/><path d="M58 50c-6-8 6-12 0-22M80 50c-6-8 6-12 0-22M102 50c-6-8 6-12 0-22"/><path d="M96 74l52-60M110 76l44-56"/><path d="M40 70c10 6 24 6 34 0"/>',
  "running-for-beginners":
    '<circle class="s" cx="98" cy="20" r="9"/><path d="M92 34l-14 26 16 14-6 26M78 60l-22 8-8 18M92 34l18 14 18-4M88 46l-22-4-12 12"/><path d="M14 104h40M120 104h28M30 92h20" stroke-dasharray="2 8"/>',
  "living-on-24-hours":
    '<path class="f" d="M80 18a44 44 0 0 1 0 88z"/><circle cx="80" cy="62" r="44"/><path d="M80 32v30l-16 12"/><circle class="s" cx="80" cy="62" r="4"/><path d="M80 18v6M80 100v6M36 62h6M118 62h6"/><path d="M132 22c-10 0-14 8-10 14 6 0 14-4 10-14z"/><path d="M14 104h28M20 96h16"/><path d="M128 96a10 10 0 0 1 20 0z"/>',
};

export default function TopicArt({ slug, className = "" }) {
  const art = artFor(slug, TOPIC_ART); // #199: hình riêng → hình ghép → đoán theo slug
  return <svg className={`kt-art ${className}`} viewBox="0 0 160 120" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: art }} />;
}
