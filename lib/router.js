"use client";
// N1 — Tệp đệm thay react-router-dom (KE-HOACH-NEXTJS §0.3).
// Giữ đúng tên hàm cũ để mỗi tệp chép từ CRA chỉ đổi MỘT dòng import:
//   import { Link, useNavigate, useParams, useLocation, useSearchParams, Navigate } from "@/lib/router";
import React, { useEffect, useMemo } from "react";
import NextLink from "next/link";
import {
  useRouter,
  usePathname,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from "next/navigation";

// Next.js không có "state" đi kèm khi chuyển trang như react-router → giữ tạm ở đây cho trang đích đọc bằng useLocation().state
// (UnitPage dùng state.tab để biết người học bấm vào một phần, không tự nhảy tới phần đang dở).
let pending = null; // { path, state }
const pathOf = (to) => String(to || "").split(/[?#]/)[0];
const remember = (to, state) => {
  pending = state ? { path: pathOf(to), state } : null;
};

/** <Link to="/x" replace state> như react-router. */
export const Link = React.forwardRef(function Link({ to, href, replace, state, onClick, ...rest }, ref) {
  const target = to ?? href ?? "#";
  return (
    <NextLink
      ref={ref}
      href={target}
      replace={replace}
      onClick={(e) => {
        remember(target, state);
        onClick?.(e);
      }}
      {...rest}
    />
  );
});

/** NavLink: thêm class "active" khi đang ở đường dẫn đó (className có thể là hàm như react-router). */
export const NavLink = React.forwardRef(function NavLink({ to, end, className, ...rest }, ref) {
  const path = usePathname() || "";
  const isActive = end ? path === to : path === to || path.startsWith(String(to).replace(/\/$/, "") + "/");
  const cls = typeof className === "function" ? className({ isActive }) : [className, isActive && "active"].filter(Boolean).join(" ");
  return <Link ref={ref} to={to} className={cls} aria-current={isActive ? "page" : undefined} {...rest} />;
});

/** navigate("/x"), navigate("/x", { replace: true }), navigate(-1). */
export function useNavigate() {
  const router = useRouter();
  return useMemo(
    () => (to, opts = {}) => {
      if (typeof to === "number") {
        if (to < 0) router.back();
        else router.forward();
        return;
      }
      remember(to, opts.state);
      if (opts.replace) router.replace(to, { scroll: opts.scroll !== false });
      else router.push(to, { scroll: opts.scroll !== false });
    },
    [router]
  );
}

/** useParams(): trả về chuỗi (Next.js có thể trả mảng cho [[...part]] → lấy phần đầu, giống :part của react-router). */
export function useParams() {
  const p = useNextParams() || {};
  return useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(p)) out[k] = Array.isArray(v) ? v.join("/") : v;
    return out;
  }, [p]);
}

/** useLocation(): { pathname, search, hash } như react-router (hash đọc ở trình duyệt). */
export function useLocation() {
  const pathname = usePathname() || "/";
  // Không dùng useSearchParams của Next.js ở đây: hook đó làm trang dựng sẵn mất HTML (chuyển hết sang trình duyệt).
  const search = typeof window !== "undefined" ? window.location.search : "";
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const state = pending && pending.path === pathname ? pending.state : null;
  return useMemo(() => ({ pathname, search, hash, state, key: pathname + search }), [pathname, search, hash, state]);
}

/** const [params, setParams] = useSearchParams() như react-router. */
export function useSearchParams() {
  const sp = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const params = useMemo(() => new URLSearchParams(sp ? sp.toString() : ""), [sp]);
  const setParams = (next, opts = {}) => {
    const val = typeof next === "function" ? next(params) : next;
    const qs = new URLSearchParams(val).toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    if (opts.replace) router.replace(url, { scroll: false });
    else router.push(url, { scroll: false });
  };
  return [params, setParams];
}

/** <Navigate to="/x" replace /> như react-router. */
export function Navigate({ to, replace = false }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [to, replace, navigate]);
  return null;
}
