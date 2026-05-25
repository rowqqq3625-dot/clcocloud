"use client";

import React, { useState, useEffect } from "react";
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
          height: 50px;
          border-radius: 25px;
          outline: none;
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          box-sizing: border-box;
          box-shadow: none;
          transition: width 380ms var(--ease-spring),
                      background-color 300ms ease,
                      border-color 300ms ease,
                      box-shadow 300ms ease,
                      transform 380ms var(--ease-spring);
        }

        /* Normal State - Perfect Circle with mascot centered (Transparent background) */
        .bot-launcher-btn.state-dot {
          width: 50px;
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
          width: 160px;
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
          width: 42px;
          height: 42px;
          object-fit: contain;
          flex-shrink: 0;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16)) drop-shadow(0 2px 4px rgba(217, 119, 87, 0.15));
          transition: width 320ms var(--ease-spring),
                      height 320ms var(--ease-spring),
                      filter 320ms ease;
        }
        .bot-launcher-btn.state-pill .mascot-avatar {
          width: 30px;
          height: 30px;
          filter: none;
        }

        /* Label reveal transition - no wrapping, no squishing */
        .launcher-text-label {
          color: var(--cream);
          font-size: 13.5px;
          font-weight: 540;
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
          max-width: 110px;
          margin-left: 6px;
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              fill="none"
              className="mascot-avatar rounded-full overflow-hidden"
            >
              {/* Black circle background */}
              <circle cx="32" cy="32" r="32" fill="#1C1C1E" />
              {/* Orange circle with right-side gap */}
              <path
                d="M 36.85 24 A 16 16 0 1 0 36.85 40"
                stroke="#D97757"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Orange inner connector and dot */}
              <line
                x1="21"
                y1="32"
                x2="35"
                y2="32"
                stroke="#D97757"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <circle
                cx="35"
                cy="32"
                r="4.5"
                fill="#D97757"
              />
              {/* Cloud shape outline (white) */}
              <path
                d="M 34 40 L 49 40 A 8 8 0 0 0 49 24 A 9.5 9.5 0 0 0 34 24 A 8 8 0 0 0 34 40 Z"
                stroke="#FFFFFF"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <span className="launcher-text-label">클코클라우드AI</span>
          </div>
        </button>
      )}

      {/* Renders Chat Panel when activated */}
      {isOpen && <BotPanel onClose={handleClosePanel} />}
    </>
  );
}
