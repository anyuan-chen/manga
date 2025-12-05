'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navigation() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === "loading") {
    return null;
  }

  return (
    <nav className="bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-16">
          <div className="flex items-center gap-4">
            {session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-gray-500 transition-colors focus:outline-none focus:border-blue-500"
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                    <div className="px-3 py-2 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">
                        {session.user?.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {session.user?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
