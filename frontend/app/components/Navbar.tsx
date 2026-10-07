"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Droplet, Menu, X } from "lucide-react";

type Role = "donor" | "recipient" | null;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>(null);

  // Re-check login state on every page change
  useEffect(() => {
    if (localStorage.getItem("donor")) setRole("donor");
    else if (localStorage.getItem("recipient")) setRole("recipient");
    else setRole(null);
    setOpen(false);
  }, [pathname]);

  const links = [
    ...(role === null ? [{ href: "/", label: "Home" }] : []),
    { href: "/search", label: "Find Donors" },
    ...(role === "recipient"
      ? [
          { href: "/request", label: "Request Blood" },
          { href: "/recipient", label: "My Requests" },
        ]
      : []),
    ...(role === "donor" ? [{ href: "/dashboard", label: "Dashboard" }] : []),
  ];

  function logout() {
    localStorage.removeItem("donor");
    localStorage.removeItem("recipient");
    setRole(null);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
            <Droplet size={20} fill="currentColor" />
          </span>
          LifeLink
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === l.href ? "bg-brand-light text-brand" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {role ? (
            <button onClick={logout} className="text-sm font-medium text-gray-700 hover:text-brand">
              Log out
            </button>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-brand">
                Log in
              </Link>
              <Link
                href="/"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 hover:bg-gray-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {l.label}
            </Link>
          ))}
          {role ? (
            <button
              onClick={logout}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-semibold"
            >
              Log out
            </button>
          ) : (
            <Link
              href="/login"
              className="mt-2 block rounded-lg bg-brand px-3 py-2 text-center text-sm font-semibold text-white"
            >
              Log in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}