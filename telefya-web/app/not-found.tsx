import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_85%_10%,rgba(100,38,255,0.12),transparent_30%),radial-gradient(circle_at_15%_20%,rgba(15,107,255,0.1),transparent_28%),#ffffff] px-5">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 text-center shadow-enterprise">
        <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-telefya-blue">
          404
        </span>

        <h1 className="mt-5 text-3xl font-black text-navy-900">
          Page not found
        </h1>

        <p className="mt-3 leading-7 text-navy-500">
          The page you are looking for does not exist or has been moved.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-telefya-blue px-5 py-3 font-black text-white hover:bg-telefya-violet"
        >
          Back to homepage
        </Link>
      </section>
    </main>
  );
}