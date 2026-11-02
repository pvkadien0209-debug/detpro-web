"use client";
// #414 Chép từ mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — giữ bố cục + logic; #416 đổi màu theo DetPro.
import { openDB, deleteDB } from "idb";
import LinkAPI from "./T0_linkApi";
// ============================================
// CẤU HÌNH DATABASE
// ============================================
const DB_CONFIG = {
  name: "TTS-Audio-DB",
  version: 2, // Tăng version để migrate database cũ
  storeName: "audios",
  maxEntries: 100, // Giới hạn số lượng audio
  maxSize: 50 * 1024 * 1024, // 50MB
};
// ============================================
// UTILITY FUNCTIONS
// ============================================
/**
 * Kiểm tra trình duyệt Safari với cache localStorage
 * @returns {boolean} True nếu là Safari
 */
const isSafari = () => {
  try {
    const cachedResult = localStorage.getItem("isSafariBrowser");
    if (cachedResult !== null) {
      return cachedResult === "true";
    }
    const userAgent = navigator.userAgent.toLowerCase();
    const result =
      /safari/.test(userAgent) &&
      !/chrome/.test(userAgent) &&
      !/chromium/.test(userAgent);
    localStorage.setItem("isSafariBrowser", result.toString());
    return result;
  } catch (error) {
    console.warn("Không thể kiểm tra Safari:", error);
    return false;
  }
};
/**
 * Tạo key chuẩn hóa từ text
 * @param {string} text - Text cần chuẩn hóa
 * @returns {string} Key đã chuẩn hóa
 */
const normalizeKey = (text) => {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
};
// ============================================
// DATABASE FUNCTIONS
// ============================================
/**
 * Khởi tạo IndexedDB với migration support
 * @returns {Promise<IDBPDatabase>} Database instance
 */
const initDB = async () => {
  try {
    return await openDB(DB_CONFIG.name, DB_CONFIG.version, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(
          `🔄 Migrating database từ v${oldVersion} lên v${newVersion}`,
        );
        let store;
        // Tạo object store nếu chưa tồn tại
        if (!db.objectStoreNames.contains(DB_CONFIG.storeName)) {
          store = db.createObjectStore(DB_CONFIG.storeName);
          console.log(`✅ Đã tạo object store: ${DB_CONFIG.storeName}`);
        } else {
          // Lấy object store đã tồn tại từ transaction
          store = transaction.objectStore(DB_CONFIG.storeName);
        }
        // Tạo index nếu chưa tồn tại (hỗ trợ migration)
        if (!store.indexNames.contains("timestamp")) {
          store.createIndex("timestamp", "timestamp", { unique: false });
          console.log("✅ Đã tạo index 'timestamp'");
        }
      },
      blocked() {
        console.warn("⚠️ Database bị block bởi tab khác");
      },
      blocking() {
        console.warn("⚠️ Database đang block tab khác");
      },
    });
  } catch (error) {
    console.error("❌ Lỗi khởi tạo database:", error);
    throw error;
  }
};
/**
 * Tính tổng dung lượng và số lượng entries trong DB
 * @param {IDBPDatabase} db - Database instance
 * @returns {Promise<{totalSize: number, entryCount: number}>}
 */
const getCurrentDBSize = async (db) => {
  try {
    const tx = db.transaction(DB_CONFIG.storeName, "readonly");
    const store = tx.objectStore(DB_CONFIG.storeName);
    const keys = await store.getAllKeys();
    let totalSize = 0;
    for (const key of keys) {
      const data = await store.get(key);
      if (data?.blob) {
        totalSize += data.blob.size;
      }
    }
    await tx.done;
    return {
      totalSize,
      entryCount: keys.length,
    };
  } catch (error) {
    console.error("❌ Lỗi tính toán DB size:", error);
    return { totalSize: 0, entryCount: 0 };
  }
};
/**
 * Xóa các entries cũ nhất dựa trên timestamp
 * @param {IDBPDatabase} db - Database instance
 * @param {number} removeCount - Số lượng entries cần xóa
 * @returns {Promise<number>} Số lượng entries đã xóa
 */
const cleanOldEntries = async (db, removeCount = 10) => {
  try {
    const tx = db.transaction(DB_CONFIG.storeName, "readwrite");
    const store = tx.objectStore(DB_CONFIG.storeName);
    // Kiểm tra index có tồn tại không
    if (!store.indexNames.contains("timestamp")) {
      console.warn("⚠️ Index 'timestamp' không tồn tại, bỏ qua cleanup");
      await tx.done;
      return 0;
    }
    const index = store.index("timestamp");
    let cursor = await index.openCursor(); // Sắp xếp tăng dần (cũ nhất trước)
    let deleteCount = 0;
    // Xóa các entries cũ nhất
    while (cursor && deleteCount < removeCount) {
      await cursor.delete();
      deleteCount++;
      cursor = await cursor.continue();
    }
    await tx.done;
    console.log(`🗑️ Đã xóa ${deleteCount} audio cũ khỏi cache`);
    return deleteCount;
  } catch (error) {
    console.error("❌ Lỗi khi xóa entries cũ:", error);
    return 0;
  }
};
/**
 * Quản lý dung lượng database trước khi thêm entry mới
 * @param {IDBPDatabase} db - Database instance
 * @param {number} newBlobSize - Kích thước blob mới (bytes)
 */
const manageDBSize = async (db, newBlobSize) => {
  try {
    const { totalSize, entryCount } = await getCurrentDBSize(db);
    // Kiểm tra giới hạn số lượng entries
    if (entryCount >= DB_CONFIG.maxEntries) {
      const removeCount = Math.ceil(DB_CONFIG.maxEntries * 0.2); // Xóa 20%
      console.log(
        `📊 Đạt giới hạn entries (${entryCount}/${DB_CONFIG.maxEntries}), xóa ${removeCount} entries`,
      );
      await cleanOldEntries(db, removeCount);
    }
    // Kiểm tra giới hạn dung lượng
    if (totalSize + newBlobSize > DB_CONFIG.maxSize) {
      const needToFree = totalSize + newBlobSize - DB_CONFIG.maxSize;
      const avgEntrySize =
        entryCount > 0 ? totalSize / entryCount : newBlobSize;
      const estimatedEntriesToRemove = Math.ceil(needToFree / avgEntrySize) + 5;
      console.log(
        `💾 Đạt giới hạn dung lượng (${(totalSize / 1024 / 1024).toFixed(
          2,
        )}MB/${(DB_CONFIG.maxSize / 1024 / 1024).toFixed(
          2,
        )}MB), xóa ${estimatedEntriesToRemove} entries`,
      );
      await cleanOldEntries(db, estimatedEntriesToRemove);
    }
  } catch (error) {
    console.error("❌ Lỗi quản lý DB size:", error);
  }
};
/**
 * Lưu audio blob vào database với metadata
 * @param {IDBPDatabase} db - Database instance
 * @param {string} key - Key để lưu
 * @param {Blob} blob - Audio blob
 */
const saveAudioToDB = async (db, key, blob) => {
  try {
    // Quản lý dung lượng trước khi lưu
    await manageDBSize(db, blob.size);
    const audioData = {
      blob: blob,
      timestamp: Date.now(),
      size: blob.size,
      created: new Date().toISOString(),
    };
    await db.put(DB_CONFIG.storeName, audioData, key);
    console.log(
      `💾 Đã lưu audio vào cache (${(blob.size / 1024).toFixed(2)}KB)`,
    );
  } catch (error) {
    console.error("❌ Lỗi lưu audio vào DB:", error);
    throw error;
  }
};
/**
 * Lấy audio từ database
 * @param {IDBPDatabase} db - Database instance
 * @param {string} key - Key cần tìm
 * @returns {Promise<Object|null>} Audio data hoặc null
 */
const getAudioFromDB = async (db, key) => {
  try {
    const cachedData = await db.get(DB_CONFIG.storeName, key);
    if (cachedData?.blob) {
      // Cập nhật timestamp để đánh dấu là được sử dụng gần đây
      cachedData.timestamp = Date.now();
      await db.put(DB_CONFIG.storeName, cachedData, key);
      return cachedData;
    }
    return null;
  } catch (error) {
    console.error("❌ Lỗi đọc audio từ DB:", error);
    return null;
  }
};
// ============================================
// AUDIO PLAYBACK FUNCTIONS
// ============================================
/**
 * Phát audio từ Blob với hỗ trợ Safari
 * @param {Blob} blob - Audio blob cần phát
 * @returns {Promise<void>}
 */
const playFromBlob = (blob) => {
  return new Promise((resolve, reject) => {
    try {
      const audioUrl = URL.createObjectURL(blob);
      const audioElement = document.createElement("audio");
      audioElement.src = audioUrl;
      audioElement.style.display = "none";
      audioElement.preload = "auto";
      document.body.appendChild(audioElement);
      // Event handlers
      const cleanup = () => {
        URL.revokeObjectURL(audioUrl);
        audioElement.remove();
      };
      audioElement.onended = () => {
        cleanup();
        resolve();
      };
      audioElement.onerror = (error) => {
        console.error("❌ Lỗi phát audio:", error);
        cleanup();
        reject(error);
      };
      // Xử lý đặc biệt cho Safari
      if (isSafari()) {
        audioElement.addEventListener(
          "canplaythrough",
          () => {
            audioElement.play().catch((error) => {
              console.error("❌ Safari audio play error:", error);
              cleanup();
              reject(error);
            });
          },
          { once: true },
        );
        // Trigger load bằng click
        audioElement.click();
      } else {
        // Trình duyệt khác
        audioElement.autoplay = true;
        // Fallback: thử play() nếu autoplay không hoạt động
        audioElement.addEventListener(
          "loadeddata",
          () => {
            if (audioElement.paused) {
              audioElement.play().catch((error) => {
                console.warn("⚠️ Autoplay prevented:", error);
                cleanup();
                reject(error);
              });
            }
          },
          { once: true },
        );
      }
    } catch (error) {
      console.error("❌ Lỗi trong playFromBlob:", error);
      reject(error);
    }
  });
};
// ============================================
// NETWORK FUNCTIONS
// ============================================
/**
 * Fetch audio từ server với timeout
 * @param {string} text - Text cần chuyển thành audio
 * @param {number} timeout - Timeout (ms)
 * @returns {Promise<Blob>} Audio blob
 */
const fetchAudioFromServer = async (text, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    console.log("📡 Đang tải audio từ server...");
    const response = await fetch(LinkAPI + "tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error("Received empty audio blob");
    }
    return blob;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};
// ============================================
// MAIN FUNCTION
// ============================================
/**
 * Hàm chính: Đọc text bằng TTS với cache
 * @param {string} text - Text cần đọc
 * @param {Function} fnReadClient - Fallback function khi lỗi
 * @param {Function} [disableButton] - Vô hiệu hóa nút khi audio bắt đầu phát
 * @param {Function} [enableButton] - Kích hoạt lại nút khi audio phát xong
 */
export default async function read_by_Tts(
  text,
  fnReadClient,
  disableButton,
  enableButton,
) {
  // Validate input
  if (!text || typeof text !== "string") {
    console.warn("⚠️ Text không hợp lệ");
    if (typeof fnReadClient === "function") {
      fnReadClient();
    }
    return;
  }
  if (!fnReadClient || typeof fnReadClient !== "function") {
    console.warn("⚠️ Fallback function không hợp lệ");
    return;
  }
  let db;
  try {
    // Khởi tạo database
    db = await initDB();
  } catch (error) {
    console.error("❌ Không thể khởi tạo database:", error);
    fnReadClient();
    return;
  }
  const key = normalizeKey(text);
  try {
    // BƯỚC 1: Kiểm tra cache trong IndexedDB
    const cachedData = await getAudioFromDB(db, key);
    if (cachedData?.blob) {
      if (typeof disableButton === "function") disableButton();
      try {
        await playFromBlob(cachedData.blob);
        console.log("🎵 Phát audio từ cache");
      } finally {
        if (typeof enableButton === "function") enableButton();
      }
      return;
    }
    // BƯỚC 2: Fetch từ server
    try {
      const blob = await fetchAudioFromServer(text, 5000);
      // BƯỚC 3: Lưu vào cache
      await saveAudioToDB(db, key, blob);
      // BƯỚC 4: Phát audio
      if (typeof disableButton === "function") disableButton();
      try {
        await playFromBlob(blob);
        console.log("✅ Đã lưu và phát audio từ server");
      } finally {
        if (typeof enableButton === "function") enableButton();
      }
    } catch (fetchError) {
      // Xử lý lỗi fetch
      if (fetchError.name === "AbortError") {
        console.log("⏱️ Request timeout sau 5 giây, chuyển sang TTS client");
      } else {
        console.error("❌ Lỗi fetch audio:", fetchError.message);
      }
      fnReadClient();
    }
  } catch (error) {
    console.error("❌ TTS error:", error);
    console.log("🔄 Chuyển sang TTS client");
    fnReadClient();
  }
}
// ============================================
// UTILITY EXPORTS
// ============================================
/**
 * Lấy thống kê database
 * @returns {Promise<Object|null>} Thống kê database
 */
export const getDBStats = async () => {
  try {
    const db = await initDB();
    const stats = await getCurrentDBSize(db);
    return {
      ...stats,
      maxSize: DB_CONFIG.maxSize,
      maxEntries: DB_CONFIG.maxEntries,
      sizePercentage:
        ((stats.totalSize / DB_CONFIG.maxSize) * 100).toFixed(2) + "%",
      entryPercentage:
        ((stats.entryCount / DB_CONFIG.maxEntries) * 100).toFixed(2) + "%",
      sizeMB: (stats.totalSize / 1024 / 1024).toFixed(2) + "MB",
      maxSizeMB: (DB_CONFIG.maxSize / 1024 / 1024).toFixed(2) + "MB",
    };
  } catch (error) {
    console.error("❌ Lỗi lấy DB stats:", error);
    return null;
  }
};
/**
 * Xóa toàn bộ database (reset)
 * @returns {Promise<boolean>} True nếu thành công
 */
export const resetDB = async () => {
  try {
    await deleteDB(DB_CONFIG.name);
    console.log("🗑️ Đã reset database thành công");
    return true;
  } catch (error) {
    console.error("❌ Lỗi reset database:", error);
    return false;
  }
};
/**
 * Xóa một entry cụ thể khỏi cache
 * @param {string} text - Text tương ứng với entry cần xóa
 * @returns {Promise<boolean>} True nếu thành công
 */
export const deleteAudioFromCache = async (text) => {
  try {
    const db = await initDB();
    const key = normalizeKey(text);
    await db.delete(DB_CONFIG.storeName, key);
    console.log("🗑️ Đã xóa audio khỏi cache");
    return true;
  } catch (error) {
    console.error("❌ Lỗi xóa audio:", error);
    return false;
  }
};
/**
 * Xóa tất cả entries cũ hơn X ngày
 * @param {number} days - Số ngày
 * @returns {Promise<number>} Số lượng entries đã xóa
 */
export const cleanOldAudio = async (days = 7) => {
  try {
    const db = await initDB();
    const tx = db.transaction(DB_CONFIG.storeName, "readwrite");
    const store = tx.objectStore(DB_CONFIG.storeName);
    if (!store.indexNames.contains("timestamp")) {
      console.warn("⚠️ Index không tồn tại");
      await tx.done;
      return 0;
    }
    const index = store.index("timestamp");
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    let cursor = await index.openCursor();
    let deleteCount = 0;
    while (cursor) {
      if (cursor.value.timestamp < cutoffTime) {
        await cursor.delete();
        deleteCount++;
      }
      cursor = await cursor.continue();
    }
    await tx.done;
    console.log(`🗑️ Đã xóa ${deleteCount} audio cũ hơn ${days} ngày`);
    return deleteCount;
  } catch (error) {
    console.error("❌ Lỗi xóa audio cũ:", error);
    return 0;
  }
};
