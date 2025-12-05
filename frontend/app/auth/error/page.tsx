'use client';

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification link may have expired.",
    Default: "An error occurred during sign in.",
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-50 rounded-lg shadow-xl p-8 border border-gray-200">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h1 className="text-2xl font-bold text-black mb-4">
            Authentication Error
          </h1>
          <p className="text-gray-500 mb-8">
            {errorMessage}
          </p>
          <Link
            href="/auth/signin"
            className="inline-block bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black">Loading...</p>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
