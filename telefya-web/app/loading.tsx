import Image from "next/image";

export default function Loading() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f8faff] px-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(15,107,255,0.15),transparent_26%),radial-gradient(circle_at_85%_12%,rgba(100,38,255,0.14),transparent_28%),radial-gradient(circle_at_70%_85%,rgba(34,211,134,0.1),transparent_25%)]" />

      <section className="relative w-full max-w-sm rounded-[28px] border border-white/80 bg-white/90 p-8 text-center shadow-enterprise backdrop-blur-xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50">
          <Image
            src="/images/telefya-logo.png"
            alt="Telefya"
            width={42}
            height={42}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>

        <div className="mx-auto mt-7 grid h-12 w-12 place-items-center rounded-full border-4 border-blue-100 border-t-telefya-blue animate-spin">
          <span className="h-2 w-2 rounded-full bg-telefya-violet" />
        </div>

        <h1 className="mt-6 text-lg font-black tracking-tight text-navy-900">
          Loading
        </h1>

        <div className="mx-auto mt-3 flex justify-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-telefya-blue [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-telefya-violet [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-telefya-green" />
        </div>
      </section>
    </main>
  );
}