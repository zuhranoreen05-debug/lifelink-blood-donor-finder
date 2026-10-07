import Link from "next/link";
import { Droplet, HeartHandshake, ArrowRight } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white">
          <Droplet size={28} fill="currentColor" />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight md:text-4xl">Welcome to LifeLink</h1>
        <p className="mt-2 text-gray-600">Create your account to get started.</p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <Link
          href="/register"
          className="group rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
            <HeartHandshake size={24} />
          </div>
          <h2 className="mt-5 text-xl font-bold">Register as Donor</h2>
          <p className="mt-2 text-sm text-gray-600">
            I want to donate. Show me requests near me so I can help.
          </p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand">
            Register <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </span>
        </Link>

        <Link
          href="/register/recipient"
          className="group rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Droplet size={24} />
          </div>
          <h2 className="mt-5 text-xl font-bold">Register as Recipient</h2>
          <p className="mt-2 text-sm text-gray-600">
            I need blood. Let me create requests and see which donors accept.
          </p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand">
            Register <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      <p className="mt-8 text-center text-sm text-gray-600">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}