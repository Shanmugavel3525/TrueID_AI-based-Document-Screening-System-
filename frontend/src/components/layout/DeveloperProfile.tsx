import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, X, Code2 } from 'lucide-react';

interface SocialLink {
  platform: string;
  url: string;
  handle: string;
  icon: React.ReactNode;
  color: string;
  hoverBg: string;
}

// Inline SVG icons for exact brand recognition
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const SnapchatIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.104-.464-.166-.553-1.888-.285-2.907-.702-3.146-1.271-.03-.076-.045-.15-.045-.226.014-.239.195-.465.449-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.45-.868-.659-1.332-.809-.121-.045-.24-.09-.345-.135-1.049-.42-1.183-.975-.734-1.44.149-.195.39-.344.69-.419.12 0 .3.016.479.105.383.195.752.301 1.079.301.22 0 .359-.045.449-.091l-.031-.569c-.104-1.629-.225-3.658.301-4.852C7.86 1.07 11.218.793 12.206.793z"/>
  </svg>
);

const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: 'GitHub',
    url: 'https://github.com/void-tech-shiv',
    handle: '@void-tech-shiv',
    icon: <GitHubIcon />,
    color: 'text-slate-200',
    hoverBg: 'hover:bg-slate-700/80 hover:border-slate-500',
  },
  {
    platform: 'LinkedIn',
    url: 'https://www.linkedin.com/in/shivanshusatyajeet/',
    handle: 'shivanshusatyajeet',
    icon: <LinkedInIcon />,
    color: 'text-blue-400',
    hoverBg: 'hover:bg-blue-950/60 hover:border-blue-700',
  },
  {
    platform: 'Instagram',
    url: 'https://www.instagram.com/_void.shiv/',
    handle: '@_void.shiv',
    icon: <InstagramIcon />,
    color: 'text-pink-400',
    hoverBg: 'hover:bg-pink-950/60 hover:border-pink-700',
  },
  {
    platform: 'X (Twitter)',
    url: 'https://x.com/xt_shivanshu',
    handle: '@xt_shivanshu',
    icon: <XIcon />,
    color: 'text-slate-100',
    hoverBg: 'hover:bg-slate-700/80 hover:border-slate-500',
  },
  {
    platform: 'Facebook',
    url: 'https://www.facebook.com/shivanshu.satyajeet/',
    handle: 'shivanshu.satyajeet',
    icon: <FacebookIcon />,
    color: 'text-blue-500',
    hoverBg: 'hover:bg-blue-950/60 hover:border-blue-700',
  },
  {
    platform: 'Snapchat',
    url: 'https://www.snapchat.com/@xt.shivanshu',
    handle: '@xt.shivanshu',
    icon: <SnapchatIcon />,
    color: 'text-yellow-300',
    hoverBg: 'hover:bg-yellow-950/60 hover:border-yellow-600',
  },
];

export const DeveloperProfile: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="View developer profile"
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
          border transition-all duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-900
          ${isOpen
            ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-300'
            : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-indigo-950/60 hover:border-indigo-700 hover:text-indigo-300'
          }
        `}
      >
        <Code2 className="w-3.5 h-3.5" />
        <span>Developer</span>
      </button>

      {/* Profile Panel */}
      {isOpen && (
        <>
          {/* Backdrop (mobile) */}
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden" aria-hidden="true" />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Developer profile"
            className={`
              absolute right-0 top-full mt-2 z-50
              w-72 sm:w-80
              bg-slate-900 border border-slate-700/80
              rounded-xl shadow-2xl shadow-black/50
              overflow-hidden
              animate-in fade-in slide-in-from-top-2
            `}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 px-5 pt-5 pb-4 border-b border-slate-800">
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close developer profile"
                className="absolute top-3 right-3 p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Avatar */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-inner">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100 leading-tight">
                    Shivanshu Satyajeet
                  </h2>
                  <p className="text-xs text-indigo-400 font-medium mt-0.5">
                    Full-Stack & AI Developer
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    DocVerify AI · PS-26188
                  </p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="px-3 py-3 space-y-1">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${link.platform} — ${link.handle} (opens in new tab)`}
                  className={`
                    flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
                    border border-transparent
                    transition-all duration-150 group
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-900
                    ${link.hoverBg}
                  `}
                >
                  {/* Platform Icon */}
                  <span className={`flex-shrink-0 ${link.color} transition-transform group-hover:scale-110`}>
                    {link.icon}
                  </span>

                  {/* Platform Name + Handle */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {link.platform}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate group-hover:text-slate-400 transition-colors">
                      {link.handle}
                    </div>
                  </div>

                  {/* External link indicator */}
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
                </a>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950/40">
              <p className="text-[10px] text-slate-600 text-center font-mono">
                Built for Smart India Hackathon · PS-26188
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
