// icons.js：所有圖示產生邏輯集中於此，讓資料與 UI 渲染不需要混入 SVG 細節。
function instrumentIcon(item) {
  const name = typeof item === "string" ? item : item.name || "";
  const category = typeof item === "string" ? item : item.category || "";
  const icons = {
    vocal: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="12" y="5" width="8" height="15" rx="4"></rect>
        <path d="M8 15c0 5 3 8 8 8s8-3 8-8"></path>
        <path d="M16 23v5M11 28h10"></path>
      </svg>`,
    guitar: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M20 4l8 8"></path>
        <path d="M18 7l7 7"></path>
        <path d="M10 16c-4 3-5 8-2 11 3 3 8 2 11-2 2-3 2-7-1-9-2-2-5-2-8 0z"></path>
        <circle cx="14" cy="21" r="3"></circle>
        <path d="M16 18l7-7M10 26l4-4"></path>
      </svg>`,
    violin: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M17 5c2 3 2 5 0 8"></path>
        <path d="M13 5c-2 3-2 5 0 8"></path>
        <path d="M10 14c-4 3-4 9 0 12 3 2 6 1 8-2 2 3 5 4 8 2 4-3 4-9 0-12-3-2-6-1-8 2-2-3-5-4-8-2z"></path>
        <path d="M18 4v24M7 8l18 18"></path>
      </svg>`,
    woodwind: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M7 22l18-11 3 5L10 27z"></path>
        <path d="M22 9l5-3"></path>
        <circle cx="14" cy="21" r="1.2"></circle>
        <circle cx="18" cy="18.5" r="1.2"></circle>
        <circle cx="22" cy="16" r="1.2"></circle>
      </svg>`,
    harmonica: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="5" y="11" width="22" height="10" rx="2"></rect>
        <path d="M7 15h18"></path>
        <path d="M10 12v8M14 12v8M18 12v8M22 12v8"></path>
      </svg>`,
    accordion: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="5" y="8" width="7" height="16" rx="2"></rect>
        <rect x="20" y="8" width="7" height="16" rx="2"></rect>
        <path d="M12 10l2 3-2 3 2 3-2 3"></path>
        <path d="M20 10l-2 3 2 3-2 3 2 3"></path>
        <path d="M8 12v8M23 12h2M23 16h2M23 20h2"></path>
      </svg>`,
    brass: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M4 18h14"></path>
        <path d="M8 13h9M10 10h7"></path>
        <path d="M18 13c5-5 10-3 10 4s-6 9-10 3z"></path>
        <path d="M5 18c0-4 4-4 4 0"></path>
      </svg>`,
    drums: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="17" r="9"></circle>
        <circle cx="16" cy="17" r="5"></circle>
        <path d="M8 7l7 6M24 7l-7 6"></path>
      </svg>`,
    bass: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M19 4v24"></path>
        <path d="M19 6l5 3"></path>
        <path d="M17 11c-6 1-9 5-9 10 0 5 5 8 10 6 5-2 6-8 2-12"></path>
        <circle cx="15" cy="21" r="3"></circle>
        <path d="M19 13h5M19 17h4"></path>
      </svg>`,
    keyboard: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="4" y="8" width="24" height="16" rx="2"></rect>
        <path d="M8 8v16M12 8v10M16 8v16M20 8v10M24 8v16"></path>
        <path d="M4 18h24"></path>
      </svg>`,
    warning: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 5l12 22H4z"></path>
        <path d="M16 12v7"></path>
        <path d="M16 24h.01"></path>
      </svg>`,
    playback: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M7 10v12"></path>
        <path d="M7 16h6l9-7v14l-9-7z"></path>
        <path d="M25 12c2 2 2 6 0 8"></path>
      </svg>`
  };

  if (category === "warning") return icons.warning;
  if (category === "playback") return icons.playback;
  if (category === "vocal") return icons.vocal;
  if (name.includes("Kick") || name.includes("大鼓")) return icons.drums;
  if (name.includes("Bass")) return icons.bass;
  if (name.includes("吉他")) return icons.guitar;
  if (name.includes("Violin") || name.includes("Viola") || name.includes("Cello")) return icons.violin;
  if (name.includes("Harmonica") || name.includes("口琴")) return icons.harmonica;
  if (name.includes("Accordion") || name.includes("手風琴") || name.includes("Bandoneon") || name.includes("班多鈕琴")) return icons.accordion;
  if (name.includes("Piano") || category === "keyboard") return icons.keyboard;
  if (category === "woodwind") return icons.woodwind;
  if (category === "brass") return icons.brass;
  if (category === "drums") return icons.drums;
  if (category === "bass") return icons.bass;
  if (category === "strings") return icons.violin;
  return icons.keyboard;
}

function micTypeIcon(type) {
  const normalized = String(type || "");
  if (normalized.includes("過載") || normalized.includes("增益過高")) return "warning";
  if (normalized.includes("Bluetooth") || normalized.includes("USB") || normalized.includes("3.5mm")) return "playback";
  if (normalized.includes("DI") || normalized.includes("負載盒")) return "di";
  if (normalized.includes("低頻")) return "kick";
  if (normalized.includes("小振膜")) return "sdc";
  if (normalized.includes("電容") && normalized.includes("動圈")) return "hybrid";
  if (normalized.includes("電容")) return "condenser";
  if (normalized.includes("動圈")) return "dynamic";
  return "mic";
}

