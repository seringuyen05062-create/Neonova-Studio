"use client";
import { useState, useRef, useEffect } from 'react';

interface HamburgerMenuProps {
  onDance: () => void;
  onCelebrate: () => void;
  onSettings: () => void;
}

export default function HamburgerMenu({ onDance, onCelebrate, onSettings }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const menuItems = [
    {
      label: 'Nhảy',
      icon: '🎵',
      onClick: () => {
        onDance();
        setIsOpen(false);
      }
    },
    {
      label: 'Ăn mừng',
      icon: '🎉',
      onClick: () => {
        onCelebrate();
        setIsOpen(false);
      }
    },
    {
      label: 'Cài đặt',
      icon: '⚙️',
      onClick: () => {
        onSettings();
        setIsOpen(false);
      }
    }
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-lg bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 text-white hover:bg-gray-800 transition-all duration-200 shadow-lg flex items-center justify-center"
      >
        <div className="flex flex-col gap-1">
          <div className={`w-4 h-0.5 bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
          <div className={`w-4 h-0.5 bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></div>
          <div className={`w-4 h-0.5 bg-white transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-14 left-0 w-48 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-xl animate-in slide-in-from-top-2 duration-200 z-50">
          <div className="py-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-800/50 transition-colors duration-150 flex items-center gap-3 text-sm font-medium"
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}