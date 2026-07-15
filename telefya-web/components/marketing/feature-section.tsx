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
      <section className="overflow-hidden bg-white py-4">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <div className="telefya-horizontal-scroll flex snap-x snap-mandatory gap-px overflow-x-auto rounded-2xl border border-border bg-border md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-4">
            {features.map((item) => (
              <article
                key={item.title}
                className="min-w-[78vw] snap-start bg-white p-6 transition-colors duration-300 hover:bg-navy-50 sm:min-w-[300px] md:min-w-0 md:p-7"
              >
                <div className="grid h-10 w-10 place-items-center rounded-md bg-navy-50 transition-transform duration-300 hover:scale-110">
                  <item.icon size={20} className={item.color} />
                </div>

                <h3 className="mt-4 text-base font-bold text-navy-900">
                  {item.title}
                </h3>

                <p className="mt-1.5 text-sm leading-6 text-navy-500">
                  {item.desc}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-2 text-xs font-semibold text-navy-400 md:hidden">
            Swipe to explore features
          </p>
        </div>
      </section>

      <section
        id="solutions"
        className="overflow-hidden bg-white py-14 sm:py-20"
      >
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <div className="mb-8 sm:mb-12">
            <span className="inline-flex rounded-md bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-telefya-violet">
              Built for Every Industry
            </span>

            <h2 className="mt-4 max-w-xl text-[clamp(2rem,8vw,2.5rem)] font-black tracking-tight text-navy-900">
              Solutions that fit the way you work
            </h2>

            <p className="mt-3 max-w-lg text-base leading-7 text-navy-500">
              Telefya adapts to your industry with secure, scalable
              communication built for compliance and performance.
            </p>
          </div>

          <div className="telefya-horizontal-scroll flex snap-x snap-mandatory gap-px overflow-x-auto rounded-2xl bg-border pb-4 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-5">
            {solutions.map((item) => (
              <article
                key={item.title}
                className="group flex min-h-[290px] min-w-[82vw] snap-start flex-col bg-white p-6 transition-all duration-300 hover:bg-navy-50 sm:min-w-[330px] md:min-w-0 md:p-7"
              >
                <div className="grid h-10 w-10 place-items-center rounded-md bg-navy-50 transition-transform duration-300 group-hover:scale-110">
                  <item.icon size={20} className={item.color} />
                </div>

                <h3 className="mt-5 font-bold text-navy-900">{item.title}</h3>

                <p className="mt-2 flex-1 text-sm leading-6 text-navy-500">
                  {item.desc}
                </p>

                <a
                  href="#"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-telefya-blue"
                >
                  Learn more
                  <ArrowRight
                    size={13}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </a>
              </article>
            ))}
          </div>

          <p className="mt-2 text-xs font-semibold text-navy-400 md:hidden">
            Swipe to explore solutions
          </p>
        </div>
      </section>
    </>
  );
}