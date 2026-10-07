import Link from "next/link";
import { Droplet, HeartHandshake, ArrowRight } from "lucide-react";

export default function LoginChoicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-center text-3xl font-extrabold tracking-tight">Log in to LifeLink</h1>
      <p className="mt-2 text-center text-gray-600">Choose how you use LifeLink.</p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <Link
          href="/login/donor"
          className="group rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
            <HeartHandshake size={24} />
          </div>
          <h2 className="mt-5 text-xl font-bold">I'm a donor</h2>
          <p className="mt-2 text-sm text-gray-600">See requests near you and accept or reject them.</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand">
            Log in as donor <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </span>
        </Link>

        <Link
          href="/login/recipient"
          className="group rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Droplet size={24} />
          </div>
          <h2 className="mt-5 text-xl font-bold">I need blood</h2>
          <p className="mt-2 text-sm text-gray-600">Create requests and see which donors respond.</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand">
            Log in as recipient <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      <p className="mt-8 text-center text-sm text-gray-600">
        New here?{" "}
        <Link href="/" className="font-semibold text-brand hover:underline">Register</Link>
      </p>
    </div>
  );
}