'use client';

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navigation() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-white font-bold text-xl">
              Manga Reader
            </Link>
            {session && (
              <>
                <Link href="/reader" className="text-gray-300 hover:text-white transition-colors">
                  Reader
                </Link>
                <Link href="/review" className="text-gray-300 hover:text-white transition-colors">
                  Review
                </Link>
                <Link href="/annotate" className="text-gray-300 hover:text-white transition-colors">
                  Annotate
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <>
                <div className="flex items-center gap-3">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-gray-300 text-sm">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </>
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
