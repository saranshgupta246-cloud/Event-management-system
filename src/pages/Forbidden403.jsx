import React from "react";
import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";

export default function Forbidden403() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldX className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Access denied</h1>
        <p className="mt-2 text-slate-600">
          You don&apos;t have permission to view this page.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to home
        </Link>
      </div>
    </div>
  );
}
