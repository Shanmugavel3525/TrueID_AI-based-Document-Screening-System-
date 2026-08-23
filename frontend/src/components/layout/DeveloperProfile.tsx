import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, X, Code2 } from 'lucide-react';

interface SocialLink {
  platform: string;
  url: string;
  handle: string;
  icon: React.ReactNode;
}

// Pixel-perfect SVG icons matching the exact brand shapes
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const SnapchatIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.104-.464-.166-.553-1.888-.285-2.907-.702-3.146-1.271-.03-.076-.045-.15-.045-.226.014-.239.195-.465.449-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.45-.868-.659-1.332-.809-.121-.045-.24-.09-.345-.135-1.049-.42-1.183-.975-.734-1.44.149-.195.39-.344.69-.419.12 0 .3.016.479.105.383.195.752.301 1.079.301.22 0 .359-.045.449-.091l-.031-.569c-.104-1.629-.225-3.658.301-4.852C7.86 1.07 11.218.793 12.206.793z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

// Exactly matching the order and design from the reference screenshot
const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: 'Instagram',
    url: 'https://www.instagram.com/_void.shiv/',
    handle: '@_void.shiv',
    icon: <InstagramIcon />,
  },
  {
    platform: 'Facebook',
    url: 'https://www.facebook.com/shivanshu.satyajeet/',
    handle: 'shivanshu.satyajeet',
    icon: <FacebookIcon />,
  },
  {
    platform: 'X',
    url: 'https://x.com/xt_shivanshu',
    handle: '@xt_shivanshu',
    icon: <XIcon />,
  },
  {
    platform: 'Snapchat',
    url: 'https://www.snapchat.com/@xt.shivanshu',
    handle: '@xt.shivanshu',
    icon: <SnapchatIcon />,
  },
  {
    platform: 'LinkedIn',
    url: 'https://www.linkedin.com/in/shivanshusatyajeet/',
    handle: 'in/shivanshusatyajeet',
    icon: <LinkedInIcon />,
  },
  {
    platform: 'GitHub',
    url: 'https://github.com/void-tech-shiv',
    handle: '@void-tech-shiv',
    icon: <GitHubIcon />,
  },
];

export const DeveloperProfile: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
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
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      {/* Developer Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="View developer profile"
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
          border transition-all duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 focus:ring-offset-slate-900
          ${isOpen
            ? 'bg-cyan-950/70 border-cyan-500/70 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-cyan-500/50 hover:text-cyan-300'
          }
        `}
      >
        <Code2 className="w-3.5 h-3.5 text-cyan-400" />
        <span>Developer</span>
      </button>

      {/* Modal Card with Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Developer profile of Shivanshu Satyajeet"
            className={`
              relative w-full max-w-[360px] sm:max-w-[390px]
              bg-[#080d1a] border border-[#1a253c]
              rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.85)]
              p-6 sm:p-7
              text-center
              animate-in zoom-in-95 duration-200
            `}
          >
            {/* Close Button in top right */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close developer profile"
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing Avatar */}
            <div className="flex justify-center mb-4">
              <div className="relative group">
                {/* Cyan Halo Glow effect behind portrait */}
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 opacity-70 blur-md group-hover:opacity-90 transition duration-300" />
                <div className="relative w-24 h-24 rounded-full p-[2.5px] bg-gradient-to-b from-cyan-400 via-teal-500 to-cyan-600 shadow-xl overflow-hidden">
                  {imgLoaded ? (
                    <img
                      src="https://github.com/void-tech-shiv.png"
                      alt="Shivanshu Satyajeet"
                      onError={() => setImgLoaded(false)}
                      className="w-full h-full object-cover rounded-full bg-[#131d33]"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-950 to-slate-900 flex items-center justify-center text-cyan-400">
                      <Code2 className="w-10 h-10" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Name + Code Badge */}
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Shivanshu Satyajeet
              </h2>
              <span className="inline-flex items-center justify-center text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 rounded px-1.5 py-0.5 text-[11px] font-mono font-bold">
                {'</>'}
              </span>
            </div>

            {/* Role / Subtitle */}
            <div className="mt-1">
              <span className="text-[11px] font-extrabold tracking-wider font-mono text-cyan-400 uppercase">
                FULL-STACK DEVELOPER
              </span>
            </div>

            {/* Bio Description */}
            <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-[300px] mx-auto">
              Building modern web applications, developer tools, and security-focused products.
            </p>

            {/* Social Profile Links List */}
            <div className="mt-5 space-y-2 text-left">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${link.platform} — ${link.handle} (opens in new tab)`}
                  className={`
                    group flex items-center justify-between
                    w-full px-3.5 py-2.5 rounded-xl
                    bg-[#0d1424]/90 hover:bg-[#121c33]
                    border border-[#18233c] hover:border-cyan-500/40
                    transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 focus:ring-offset-[#080d1a]
                  `}
                >
                  {/* Left: Icon Box + Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#131c30] border border-slate-800/90 flex items-center justify-center text-slate-300 group-hover:text-cyan-400 group-hover:border-cyan-500/30 group-hover:bg-[#18243e] transition-all flex-shrink-0">
                      {link.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 group-hover:text-white leading-tight">
                        {link.platform}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5 group-hover:text-slate-300">
                        {link.handle}
                      </div>
                    </div>
                  </div>

                  {/* Right: External Link Icon */}
                  <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 flex-shrink-0 transition-colors ml-2" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
