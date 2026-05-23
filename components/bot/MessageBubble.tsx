import React, { useState } from "react";
import { MessageWithTime } from "@/lib/bot/sessionStore";

interface MessageBubbleProps {
  message: MessageWithTime;
  showTimestampHeader?: boolean;
}

// Helper to format Date string to time (e.g. "오후 1:15")
function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return "";
  }
}

// Helper to format Date string to Date separator (e.g. "2026년 5월 23일 금요일")
function formatDateHeader(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long"
    });
  } catch {
    return "";
  }
}

// Safe parser to render bullets and bold **text** with clean paragraph and newline handling
function renderContent(text: string) {
  if (!text) return null;

  // Split by double newlines or more to isolate actual logical paragraphs
  const paragraphs = text.split(/\n\n+/);
  const parsedElements: React.ReactNode[] = [];
  let listKey = 0;

  paragraphs.forEach((para, pIdx) => {
    const lines = para.split("\n");
    
    // Check if this paragraph is a list of bullet points
    const isBulletList = lines.some(line => {
      const trimmed = line.trim();
      return trimmed.startsWith("- ") || trimmed.startsWith("· ");
    });

    if (isBulletList) {
      const listItems: React.ReactNode[] = [];
      lines.forEach((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("· ");
        const rawContent = isBullet ? trimmed.substring(2) : trimmed;

        // Parse **bold** markers
        const parts = rawContent.split(/\*\*([^*]+)\*\*/g);
        const contentSpans = parts.map((part, idx) => {
          if (idx % 2 === 1) {
            return <strong key={idx} className="font-semibold">{part}</strong>;
          }
          return part;
        });

        listItems.push(
          <li key={`li-${pIdx}-${lIdx}`} className="text-[14px] leading-[1.6] text-inherit">
            {contentSpans}
          </li>
        );
      });

      parsedElements.push(
        <ul key={`list-${listKey++}`} className="list-disc pl-5 my-2 space-y-1" data-lenis-prevent>
          {listItems}
        </ul>
      );
    } else {
      // General paragraph: link lines with soft <br /> tags instead of splitting into distinct <p> blocks
      const contentNodes: React.ReactNode[] = [];
      lines.forEach((line, lIdx) => {
        // Parse **bold** markers
        const parts = line.split(/\*\*([^*]+)\*\*/g);
        const contentSpans = parts.map((part, idx) => {
          if (idx % 2 === 1) {
            return <strong key={idx} className="font-semibold">{part}</strong>;
          }
          return part;
        });

        contentSpans.forEach(span => contentNodes.push(span));
        
        if (lIdx < lines.length - 1) {
          contentNodes.push(<br key={`br-${pIdx}-${lIdx}`} />);
        }
      });

      parsedElements.push(
        <p key={`p-${pIdx}`} className="text-[14px] leading-[1.6] mb-2.5 last:mb-0">
          {contentNodes}
        </p>
      );
    }
  });

  return parsedElements;
}

export function MessageBubble({ message, showTimestampHeader }: MessageBubbleProps) {
  const isBot = message.role === "assistant" || message.role === "system";
  const formattedTime = formatTime(message.timestamp);
  const formattedDate = formatDateHeader(message.timestamp);

  const hasTicketForm = isBot && message.content.includes("[TICKET_FORM]");
  const cleanContent = hasTicketForm ? message.content.replace("[TICKET_FORM]", "").trim() : message.content;

  // Form states for inquiries requiring admin verification
  const [email, setEmail] = useState("");
  const [ticketContent, setTicketContent] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [ticketId, setTicketId] = useState("");

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !ticketContent.trim()) return;

    setStatus("submitting");
    setErrorMsg("");

    try {
      const response = await fetch("/api/bot/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, content: ticketContent, clientHash: "" })
      });

      if (response.ok) {
        const data = await response.json();
        setTicketId(data.ticketId);
        setStatus("success");
      } else {
        const data = await response.json();
        setErrorMsg(data.error || "티켓 접수에 실패했습니다.");
        setStatus("error");
      }
    } catch (err) {
      setErrorMsg("네트워크 연결 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col w-full gap-1" data-lenis-prevent>
      <style dangerouslySetInnerHTML={{ __html: `
        .msg-bubble-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 4px;
          animation: msg-slide-up var(--dur-fast) var(--ease-out) forwards;
          opacity: 0;
          transform: translateY(6px);
        }
        @keyframes msg-slide-up {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .msg-bubble-container {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}} />
      {/* Timestamp header separator if 5 minutes elapsed or new day */}
      {showTimestampHeader && (
        <div className="flex justify-center my-3">
          <span className="font-mono text-[11px] select-none text-[var(--ink-soft)] opacity-60">
            {formattedDate} {formattedTime}
          </span>
        </div>
      )}

      <div className={`msg-bubble-container ${isBot ? "items-start" : "items-end"}`}>
        <div
          className={`max-w-[88%] px-4 py-3 text-[14px] shadow-sm transition-all duration-200 ${
            isBot
              ? "bg-[var(--cream-2)] text-[var(--ink)] border border-[var(--border-subtle)] rounded-2xl rounded-tl-md"
              : "bg-[var(--coral)] text-[var(--cream)] rounded-2xl rounded-tr-md"
          }`}
          style={{
            wordBreak: "keep-all",
            overflowWrap: "break-word"
          }}
        >
          {message.image && (
            <div className="mb-2 max-w-full overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--cream)]">
              <img
                src={message.image}
                alt="첨부 이미지"
                className="max-h-[160px] w-auto max-w-full object-contain"
              />
            </div>
          )}
          {renderContent(cleanContent)}

          {/* Inline ticket submission form */}
          {hasTicketForm && (
            <div className="mt-3">
              {status === "success" ? (
                <div className="p-3.5 bg-[rgba(90,138,107,0.06)] border border-[rgba(90,138,107,0.22)] rounded-xl text-[var(--success)] text-xs flex flex-col gap-1 animate-fade-in">
                  <span className="font-bold text-[13px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                    문의가 성공적으로 접수되었습니다! 🍀
                  </span>
                  <p className="text-[11.5px] leading-relaxed text-[var(--ink-soft)] mt-1">
                    티켓 번호: <strong className="font-mono text-[var(--success)]">{ticketId}</strong><br />
                    기재해 주신 <strong>{email}</strong> 주소로 신속하게 검토하여 답변 메일을 보내드리겠습니다. 조금만 기다려 주세요! 😊
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="p-3 bg-[var(--cream)] border border-[var(--line)] rounded-xl flex flex-col gap-2.5 animate-fade-in text-[var(--ink)]">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">이메일 주소</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="reply@example.com"
                      disabled={status === "submitting"}
                      data-lenis-prevent
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--cream-2)] focus:outline-none focus:border-[var(--coral-soft)] transition-colors text-[var(--ink)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">상세 문의 사항</label>
                    <textarea
                      required
                      rows={3}
                      value={ticketContent}
                      onChange={(e) => setTicketContent(e.target.value)}
                      placeholder="결제 실패 시간, 오류 메시지, 혹은 상세 요청 사항을 기재해 주세요..."
                      disabled={status === "submitting"}
                      data-lenis-prevent
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--cream-2)] focus:outline-none focus:border-[var(--coral-soft)] transition-colors resize-none text-[var(--ink)] leading-normal"
                    />
                  </div>

                  {errorMsg && (
                    <div className="text-[11px] text-[var(--coral-deep)] font-medium bg-[var(--coral)]/8 px-2 py-1.5 rounded-lg">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "submitting" || !email.trim() || !ticketContent.trim()}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      status === "submitting"
                        ? "bg-[var(--line)] text-[var(--ink-faint)] cursor-not-allowed"
                        : "bg-[var(--coral)] hover:bg-[var(--coral-deep)] text-[var(--cream)] cursor-pointer shadow-sm"
                    }`}
                  >
                    {status === "submitting" ? "문의 접수 중..." : "티켓 문의 접수하기 📬"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

