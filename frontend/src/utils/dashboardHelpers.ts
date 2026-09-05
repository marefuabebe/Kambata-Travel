/** Export rows as CSV download in the browser */
export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getLocalizedText(obj: any, lang: string = "en"): string {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  if (typeof obj === "object") {
    if (lang === "am") {
      return obj.am || obj.en || "";
    }
    return obj.en || obj.am || "";
  }
  return String(obj);
}

export function tourTitle(tour: any, lang: string = "en"): string {
  if (!tour) return "Tour";
  const titleObj = tour.title || tour.name;
  if (!titleObj) return "Tour";
  return getLocalizedText(titleObj, lang) || "Tour";
}

