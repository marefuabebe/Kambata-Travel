/** Apply traveler portal dark/light theme to document root */
export function applyExplorerTheme(theme: "light" | "dark" | "system") {
  if (typeof document === "undefined") return;

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    localStorage.setItem("explorer-dark-mode", "1");
  } else if (theme === "light") {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("explorer-dark-mode", "0");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", prefersDark);
    localStorage.removeItem("explorer-dark-mode");
  }
}

export function readExplorerTheme(): "light" | "dark" | "system" {
  if (typeof localStorage === "undefined") return "system";
  const saved = localStorage.getItem("explorer-dark-mode");
  if (saved === "1") return "dark";
  if (saved === "0") return "light";
  return "system";
}

export async function downloadInvoicePdf(apiType: "tour" | "hotel" | "package", id: string) {
  const apiClient = (await import("@/utils/apiClient")).default;
  const response = await apiClient.get(`/traveler/bookings/${apiType}/${id}/invoice`, {
    params: { format: "pdf" },
    responseType: "blob",
  });
  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kambata-invoice-${id.slice(-8)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
