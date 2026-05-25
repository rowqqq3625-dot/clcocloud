"use client";
 
import React from "react";
 
export type OSType = "macos" | "powershell" | "cmd" | "linux";
 
interface OSChipsProps {
  selectedOs: OSType | null;
  onChange: (os: OSType) => void;
}
 
const AppleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 170 170" className={className} style={{ width: "14px", height: "14px" }} fill="#8E8E93" aria-hidden="true">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.22-9.13-1.78-14.37-6.02-3.43-2.79-7.25-7.38-11.45-13.78-8.23-12.65-14.48-26.79-18.75-42.44-4.28-15.65-6.42-30.08-6.42-43.29 0-14.73 3.61-26.6 10.84-35.61 7.23-9.01 16.08-13.56 26.56-13.67 5.06 0 10.87 1.58 17.43 4.75 6.56 3.17 11.13 4.75 13.7 4.75 2.11 0 6.64-1.58 13.57-4.75 6.93-3.17 12.33-4.64 16.2-4.43 11.83.53 21.05 4.88 27.67 13.06 6.62 8.18 10.15 17.9 10.59 29.17-11.4 6.86-17.15 16.03-17.26 27.53-.11 9.4 3.27 17.38 10.14 23.95 6.87 6.57 15.08 10.37 24.63 11.4-.87 2.64-1.79 5.23-2.77 7.77zM119.22 17.58c0 7.7-2.79 14.88-8.38 20.53-5.59 5.65-12.59 9.17-21.01 8.55-.11-.74-.17-1.6-.17-2.58 0-7.39 3.01-14.61 9.02-21.65 6.01-7.04 13.17-10.74 21.5-11.1 0 .95.04 1.9.04 2.87z" />
  </svg>
);

const WindowsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} style={{ width: "14px", height: "14px" }} fill="#8E8E93" aria-hidden="true">
    <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.55v-8.1zM10.8 1.95L24 0v11.55H10.8V1.95zM10.8 12.45H24v11.55l-13.2-1.95v-9.6z" />
  </svg>
);

const PenguinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 448 512" className={className} style={{ width: "14px", height: "14px" }} fill="#8E8E93" aria-hidden="true">
    <path d="M224 96C135.6 96 64 167.6 64 256c0 15 2.1 29.6 6 43.3C52.7 306.7 32 328.6 32 355.2c0 28.2 23 51.2 51.2 51.2c5.8 0 11.4-.9 16.7-2.7c22.6 31 59.2 51.1 100.1 51.1c2 0 4-.1 6-.2c3.4 9.1 8.8 17.1 15.6 23.5c7.3 6.9 16.8 11.2 27.2 12.2c16.2 1.6 31.9-5.1 41.7-17.7c6.2 3.1 13 4.7 20.3 4.7c23.6 0 43-17.7 45.6-40.8c24.7-11.4 44.5-30.8 56.6-54.8c12.2-24.2 18.6-51.4 18.6-79.4c0-88.4-71.6-160-160-160zm16 80c0-8.8 7.2-16 16-16s16 7.2 16 16s-7.2 16-16 16s-16-7.2-16-16zm-80 0c0-8.8 7.2-16 16-16s16 7.2 16 16s-7.2 16-16 16s-16-7.2-16-16zm56 120c-13.3 0-24-10.7-24-24h48c0 13.3-10.7 24-24 24z" />
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
