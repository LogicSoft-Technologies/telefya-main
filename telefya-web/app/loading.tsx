export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-5">
      <div className="rounded-2xl border border-border bg-white p-6 text-center shadow-soft">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-blue-100 border-t-telefya-blue" />
        <p className="mt-4 text-sm font-black text-navy-900">
          Loading Telefya...
        </p>
      </div>
    </main>
  );
}