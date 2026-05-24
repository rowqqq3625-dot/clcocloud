// SHA-256 hashing helper using Web Crypto API
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getClientHash(): Promise<string> {
  if (typeof window === "undefined") return "";

  // Check cache in localStorage for permanent client identification
  const cached = localStorage.getItem("clco_assistant_client_hash");
  if (cached) return cached;

  try {
    let canvasData = "";
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 30;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("clco_assistant_fingerprint", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("clco_assistant_fingerprint", 4, 17);
        canvasData = canvas.toDataURL();
      }
    } catch (e) {
      // Ignore canvas errors
    }

    const ua = navigator.userAgent || "";
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const rawString = `${canvasData}|${ua}|${tz}`;

    const hash = await sha256(rawString);
    localStorage.setItem("clco_assistant_client_hash", hash);
    return hash;
  } catch (e) {
    // Fallback unique permanent ID if hashing or APIs fail
    const fallback = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    try {
      const hash = await sha256(fallback);
      localStorage.setItem("clco_assistant_client_hash", hash);
      return hash;
    } catch {
      localStorage.setItem("clco_assistant_client_hash", fallback);
      return fallback;
    }
  }
}
