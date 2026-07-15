const companies = [
  "Cleveland Clinic",
  "UNICEF",
  "Deloitte",
  "Harvard University",
  "Shopify",
  "World Bank",
];

export function TrustedSection() {
  return (
    <section className="overflow-hidden bg-white pb-14 sm:pb-16">
      <div className="mx-auto max-w-[92rem] px-5 text-center lg:px-8">
        <p className="font-bold text-navy-500">
          Trusted by teams around the world
        </p>
      </div>

      <div
        className="relative mt-7 overflow-hidden"
        aria-label="Trusted companies"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-24" />

        <div className="telefya-logo-marquee flex w-max items-center gap-10 pr-10 sm:gap-16 sm:pr-16">
          {companies.map((company) => (
            <span
              key={company}
              className="whitespace-nowrap text-xl font-black tracking-tight text-navy-300 transition-colors duration-300 hover:text-telefya-blue sm:text-2xl"
            >
              {company}
            </span>
          ))}

          <div className="flex items-center gap-10 sm:gap-16" aria-hidden="true">
            {companies.map((company) => (
              <span
                key={`${company}-copy`}
                className="whitespace-nowrap text-xl font-black tracking-tight text-navy-300 sm:text-2xl"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}