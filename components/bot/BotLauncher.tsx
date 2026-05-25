"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { BotPanel } from "./BotPanel";

export function BotLauncher() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  // Initialize hasOpened status from sessionStorage
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const opened = sessionStorage.getItem("clco_bot_has_opened") === "true";
      setHasOpened(opened);
    }
  }, []);

  // Proximity tracker for pointer coordinates
  useEffect(() => {
    if (typeof window === "undefined" || isOpen) return;

    const checkProximity = (clientX: number, clientY: number) => {
      const rightDistance = window.innerWidth - clientX;
      const bottomDistance = window.innerHeight - clientY;
      const distance = Math.sqrt(rightDistance * rightDistance + bottomDistance * bottomDistance);

      if (distance <= 240) {
        setIsExpanded(true);
      } else {
        setIsExpanded(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      checkProximity(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        checkProximity(touch.clientX, touch.clientY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        checkProximity(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      setIsExpanded(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpen]);

  const handleOpenPanel = () => {
    setIsOpen(true);
    setIsExpanded(false);
    setHasOpened(true);
    sessionStorage.setItem("clco_bot_has_opened", "true");
  };

  const handleClosePanel = () => {
    setIsOpen(false);
  };

  if (!mounted) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Launcher positioning and transitions */
        .bot-launcher-btn {
          position: fixed;
          right: 36px;
          bottom: 36px;
          z-index: 45; /* Under modal, above page contents */
          display: flex;
          align-items: center;
          justify-content: center;
          outline: none;
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          box-sizing: border-box;
          box-shadow: none;
          transition: width 380ms var(--ease-spring),
                      height 380ms var(--ease-spring),
                      border-radius 380ms var(--ease-spring),
                      background-color 300ms ease,
                      border-color 300ms ease,
                      box-shadow 300ms ease,
                      transform 380ms var(--ease-spring);
        }

        /* Normal State - Perfect Circle with mascot centered (Transparent background) */
        .bot-launcher-btn.state-dot {
          width: 76px;
          height: 76px;
          border-radius: 38px;
          background-color: transparent;
          border: none;
          box-shadow: none;
          animation: launcher-pop-out 260ms ease-out forwards;
        }
        .bot-launcher-btn.state-dot.has-opened-once {
          border: none;
          box-shadow: none;
        }

        /* Expanded State - Perfect Pill with slide reveal */
        .bot-launcher-btn.state-pill {
          width: 200px;
          height: 60px;
          border-radius: 30px;
          background-color: var(--coral);
          border: 1.5px solid transparent;
          box-shadow: 0 8px 24px rgba(217, 119, 87, 0.35);
          animation: launcher-pop-in 380ms var(--ease-spring) forwards;
        }

        /* Snappy pop animations preserving aspect ratio */
        @keyframes launcher-pop-in {
          0% { transform: scale(0.85); }
          60% { transform: scale(1.06); }
          85% { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        @keyframes launcher-pop-out {
          0% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        /* Hover states */
        .bot-launcher-btn.state-pill:hover {
          box-shadow: 0 8px 32px rgba(217, 119, 87, 0.45);
        }
        .bot-launcher-btn.state-dot:hover {
          box-shadow: none;
          transform: scale(1.1);
        }

        /* Centered content wrapper */
        .launcher-content-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          padding: 0 10px;
          position: relative;
        }

        /* Mascot character image styling and transitions */
        .mascot-avatar {
          width: 66px;
          height: 66px;
          object-fit: contain;
          flex-shrink: 0;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16)) drop-shadow(0 2px 4px rgba(217, 119, 87, 0.15));
          transition: width 320ms var(--ease-spring),
                      height 320ms var(--ease-spring),
                      filter 320ms ease;
        }
        .bot-launcher-btn.state-pill .mascot-avatar {
          width: 44px;
          height: 44px;
          filter: none;
        }

        /* Label reveal transition - no wrapping, no squishing */
        .launcher-text-label {
          color: var(--cream);
          font-size: 14.5px;
          font-weight: 700;
          white-space: nowrap;
          opacity: 0;
          max-width: 0;
          overflow: hidden;
          transition: opacity 200ms ease,
                      max-width 320ms var(--ease-spring),
                      margin-left 320ms var(--ease-spring);
          margin-left: 0;
        }
        .bot-launcher-btn.state-pill .launcher-text-label {
          opacity: 1;
          max-width: 130px;
          margin-left: 10px;
        }

        /* Accessibility focus ring */
        .bot-launcher-btn:focus-visible {
          outline: 2px solid var(--coral) !important;
          outline-offset: 3px !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .bot-launcher-btn, .launcher-text-label, .mascot-avatar {
            transition: none !important;
            animation: none !important;
            transform: none !important;
          }
        }
      `}} />

      {/* Renders the Launcher button if panel is closed */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpenPanel}
          className={`bot-launcher-btn ${isExpanded ? "state-pill" : "state-dot"} ${hasOpened ? "has-opened-once" : ""}`}
          aria-expanded={isExpanded}
          aria-controls="bot-panel"
          aria-label={isExpanded ? "클코클라우드AI 닫기" : "클코클라우드AI 열기"}
        >
          <div className="launcher-content-wrapper">
            <Image
              src="/ai-icon.png"
              alt="클코클라우드AI 아바타"
              width={76}
              height={76}
              className="mascot-avatar rounded-full overflow-hidden"
            />
            <span className="launcher-text-label">클코클라우드AI</span>
          </div>
        </button>
      )}

      {/* Renders Chat Panel when activated */}
      {isOpen && <BotPanel onClose={handleClosePanel} />}
    </>
  );
}
