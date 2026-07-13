import {
  ArrowRight,
  Building2,
  GraduationCap,
  HeartPulse,
  Landmark,
  MessageCircle,
  ShieldCheck,
  ShoppingCart,
  Users,
  Video,
} from "lucide-react";

const features = [
  {
    title: "Chat",
    desc: "Real-time messaging and group conversations.",
    icon: MessageCircle,
    color: "text-telefya-purple",
  },
  {
    title: "Meet",
    desc: "HD video meetings for teams of any size.",
    icon: Video,
    color: "text-telefya-coral",
  },
  {
    title: "Secure",
    desc: "End-to-end encryption you can trust.",
    icon: ShieldCheck,
    color: "text-telefya-green",
  },
  {
    title: "Connect",
    desc: "Bring your team, clients and community together.",
    icon: Users,
    color: "text-telefya-blue",
  },
];

const solutions = [
  {
    title: "Healthcare",
    desc: "HIPAA-ready meetings for telehealth, consultations and care teams.",
    icon: HeartPulse,
    color: "text-telefya-purple",
  },
  {
    title: "Education",
    desc: "Virtual classrooms, tutoring and faculty collaboration made simple.",
    icon: GraduationCap,
    color: "text-telefya-green",
  },
  {
    title: "Enterprise",
    desc: "Secure meetings, webinars and collaboration for modern teams.",
    icon: Building2,
    color: "text-telefya-gold",
  },
  {
    title: "Government",
    desc: "Compliant communications for agencies and public services.",
    icon: Landmark,
    color: "text-telefya-blue",
  },
  {
    title: "Retail & E-commerce",
    desc: "Connect with your customers and teams, anywhere.",
    icon: ShoppingCart,
    color: "text-telefya-purple",
  },
];

export function FeatureSection() {
  return (
    <>
      <section className="bg-white py-4">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <div className="grid border border-border bg-white md:grid-cols-2 lg:grid-cols-4">
            {features.map((item, index) => (
              <article
                key={item.title}
                className={[
                  "p-7",
                  index < features.length - 1
                    ? "border-b border-border md:border-b-0 md:border-r"
                    : "",
                  index === 1 ? "md:border-b md:border-r-0 lg:border-b-0 lg:border-r" : "",
                ].join(" ")}
              >
                <div className="grid h-10 w-10 place-items-center rounded-md bg-navy-50">
                  <item.icon size={20} className={item.color} />
                </div>
                <h3 className="mt-4 text-base font-bold text-navy-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-navy-500">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="solutions" className="bg-white py-20">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <div className="mb-12">
            <span className="rounded-md bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-telefya-violet">
              Built for Every Industry
            </span>
            <h2 className="mt-4 max-w-xl text-4xl font-black tracking-tight text-navy-900">
              Solutions that fit the way you work
            </h2>
            <p className="mt-3 max-w-lg text-base leading-7 text-navy-500">
              Telefya adapts to your industry with secure, scalable communication built for compliance and performance.
            </p>
          </div>

          <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-5">
            {solutions.map((item) => (
              <article
                key={item.title}
                className="flex flex-col bg-white p-7 transition-colors hover:bg-navy-50"
              >
                <div className="grid h-10 w-10 place-items-center rounded-md bg-navy-50">
                  <item.icon size={20} className={item.color} />
                </div>
                <h3 className="mt-5 font-bold text-navy-900">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-navy-500">{item.desc}</p>
                <a
                  href="#"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-telefya-blue"
                >
                  Learn more <ArrowRight size={13} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}