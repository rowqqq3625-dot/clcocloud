"use client";
 
import React from "react";
 
export type OSType = "macos" | "powershell" | "cmd" | "linux";
 
interface OSChipsProps {
  selectedOs: OSType | null;
  onChange: (os: OSType) => void;
}
 
const AppleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.61.7-1.15 1.84-1.01 2.96 1.12.09 2.27-.58 2.96-1.41z" />
  </svg>
);

const WindowsIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM10.95 1.935L24 0v11.55H10.95V1.935zM10.95 12.45H24v11.55l-13.05-1.935v-9.615z" />
  </svg>
);

const PenguinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2c-1.3 0-2.4.5-3.2 1.4-1 .8-1.5 2.1-1.5 3.4 0 1.2.4 2.3 1.1 3.2C8 10.3 7 11.5 7 13c0 2 1.5 3.5 3.5 3.5.5 0 1-.1 1.5-.3.5.2 1 .3 1.5.3 2 0 3.5-1.5 3.5-3.5 0-1.5-1-2.7-1.4-3 .7-.9 1.1-2 1.1-3.2 0-1.3-.5-2.6-1.5-3.4C14.4 2.5 13.3 2 12 2zm-2.5 4c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm5 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm-2.5 6c-1.5 0-2.5-1.2-2.5-2.5H14.5c0 1.3-1 2.5-2.5 2.5zm0 3c-2.5 0-4.5 1.5-4.5 3 0 .8.8 1.5 1.8 1.5h5.4c1 0 1.8-.7 1.8-1.5 0-1.5-2-3-4.5-3z" />
  </svg>
);
 
const osConfig = [
  { id: "macos", name: "macOS", icon: <AppleIcon className="text-current" /> },
  { id: "powershell", name: "PowerShell", icon: <WindowsIcon className="text-current" /> },
  { id: "cmd", name: "Windows CMD", icon: <WindowsIcon className="text-current" /> },
  { id: "linux", name: "Linux", icon: <PenguinIcon className="text-current" /> }
] as const;

export function OSChips({ selectedOs, onChange }: OSChipsProps) {
  return (
    <div 
      className="flex flex-wrap gap-3" 
      role="radiogroup" 
      aria-label="운영체제 선택"
    >
      {osConfig.map((item, index) => {
        const isActive = selectedOs === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(item.id)}
            className={`os-chip focus-none ${isActive ? "active" : ""} animate-stagger-item flex items-center gap-2`}
            style={{ animationDelay: `${index * 60}ms` }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(item.id);
              }
            }}
          >
            <span className={`indicator flex items-center justify-center shrink-0 ${isActive ? "text-coral" : "text-ink-65"}`}>
              {item.icon}
            </span>
            <span>{item.name}</span>
            <span 
              className={`w-1.5 h-1.5 rounded-full ml-1 shrink-0 transition-opacity duration-150 ${isActive ? "bg-cream opacity-100" : "bg-transparent opacity-0"}`}
              aria-hidden="true" 
            />
          </button>
        );
      })}
    </div>
  );
}
