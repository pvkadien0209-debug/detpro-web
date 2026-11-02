"use client";
// #414 Chép từ mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — giữ bố cục + logic; #416 đổi màu theo DetPro.
// Hàm lưu số vào localStorage
function saveNumberToLocalStorage(id, number) {
  if (typeof id !== "string" || typeof number !== "number") {
    console.error(
      "Invalid parameters: id must be a string and number must be a valid number."
    );
    return;
  }
  localStorage.setItem(id, number.toString()); // Chuyển số thành chuỗi để lưu
}

// Hàm lấy số từ localStorage
function getNumberFromLocalStorage(id) {
  if (typeof id !== "string") {
    console.error("Invalid parameter: id must be a string.");
    return null;
  }
  const data = localStorage.getItem(id);
  return data !== null ? parseFloat(data) : null; // Chuyển chuỗi về số
}

// Gán object vào biến trước khi export
const localStorageHelpers = {
  saveNumberToLocalStorage,
  getNumberFromLocalStorage,
};

export default localStorageHelpers;
