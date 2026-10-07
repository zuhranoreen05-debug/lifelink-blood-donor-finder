import { Droplet } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-gray-500 sm:flex-row">
        <div className="flex items-center gap-2 font-semibold text-gray-700">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white">
            <Droplet size={15} fill="currentColor" />
          </span>
          LifeLink
        </div>
        <p>Donor phone numbers stay private until they accept a request.</p>
        <p>© {new Date().getFullYear()} LifeLink</p>
      </div>
    </footer>
  );
}