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
    <section className="bg-white pb-16">
      <div className="mx-auto max-w-[92rem] px-5 text-center lg:px-8">
        <p className="font-bold text-navy-500">Trusted by teams around the world</p>

        <div className="mt-7 flex flex-wrap justify-center gap-x-12 gap-y-5 text-2xl font-black text-navy-300">
          {companies.map((company) => (
            <span key={company}>{company}</span>
          ))}
        </div>
      </div>
    </section>
  );
}