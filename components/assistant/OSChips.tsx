"use client";
 
import React from "react";
 
export type OSType = "macos" | "powershell" | "cmd" | "linux";
 
interface OSChipsProps {
  selectedOs: OSType | null;
  onChange: (os: OSType) => void;
}
 
const AppleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 170 170" className={className} style={{ width: "14px", height: "14px" }} fill="#7C7C7C" aria-hidden="true">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.22-9.13-1.78-14.37-6.02-3.43-2.79-7.25-7.38-11.45-13.78-8.23-12.65-14.48-26.79-18.75-42.44-4.28-15.65-6.42-30.08-6.42-43.29 0-14.73 3.61-26.6 10.84-35.61 7.23-9.01 16.08-13.56 26.56-13.67 5.06 0 10.87 1.58 17.43 4.75 6.56 3.17 11.13 4.75 13.7 4.75 2.11 0 6.64-1.58 13.57-4.75 6.93-3.17 12.33-4.64 16.2-4.43 11.83.53 21.05 4.88 27.67 13.06 6.62 8.18 10.15 17.9 10.59 29.17-11.4 6.86-17.15 16.03-17.26 27.53-.11 9.4 3.27 17.38 10.14 23.95 6.87 6.57 15.08 10.37 24.63 11.4-.87 2.64-1.79 5.23-2.77 7.77zM119.22 17.58c0 7.7-2.79 14.88-8.38 20.53-5.59 5.65-12.59 9.17-21.01 8.55-.11-.74-.17-1.6-.17-2.58 0-7.39 3.01-14.61 9.02-21.65 6.01-7.04 13.17-10.74 21.5-11.1 0 .95.04 1.9.04 2.87z" />
  </svg>
);

const WindowsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} style={{ width: "14px", height: "14px" }} aria-hidden="true">
    <path fill="#0078D7" d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.55v-8.1zM10.8 1.95L24 0v11.55H10.8V1.95zM10.8 12.45H24v11.55l-13.2-1.95v-9.6z" />
  </svg>
);

const PenguinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 512 512" className={className} style={{ width: "14px", height: "14px" }} aria-hidden="true">
    <path fill="#2E2E2E" d="M256,16c-63.5,0-115,51.5-115,115c0,15.6,3.1,30.4,8.8,44c-11.2,17.2-17.8,37.8-17.8,60c0,60.8,49.2,110,110,110s110-49.2,110-110c0-22.2-6.6-42.8-17.8-60c5.7-13.6,8.8-28.4,8.8-44C371,67.5,319.5,16,256,16z"/>
    <path fill="#FFFFFF" d="M256,166c-49.7,0-90,40.3-90,90c0,42.5,29.5,78.2,69.1,87.4C243,346,249,348,256,348s13-2,20.9-4.6c39.6-9.2,69.1-44.9,69.1-87.4C346,206.3,305.7,166,256,166z"/>
    <circle cx="216" cy="116" r="14" fill="#FFFFFF"/>
    <circle cx="216" cy="116" r="6" fill="#000000"/>
    <circle cx="296" cy="116" r="14" fill="#FFFFFF"/>
    <circle cx="296" cy="116" r="6" fill="#000000"/>
    <path fill="#FFA500" d="M256,134c-12,0-22,8-22,18c0,18,22,26,22,26s22-8,22-26C278,142,268,134,256,134z"/>
    <path fill="#FFA500" d="M156,416c-22,0-40,18-40,40c0,22,40,40,40,40h60c0,0-20-40-20-40H156z"/>
    <path fill="#FFA500" d="M356,416c22,0,40,18,40,40c0,22-40,40-40,40h-60c0,0,20-40,20-40H356z"/>
    <path fill="#2E2E2E" d="M106,236c-11,0-20,9-20,20c0,40,30,80,60,90c0,0-20-50-20-80C126,245,117,236,106,236z"/>
    <path fill="#2E2E2E" d="M406,236c11,0,20,9,20,20c0,40-30,80-60,90c0,0,20-50,20-80C386,245,395,236,406,236z"/>
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
