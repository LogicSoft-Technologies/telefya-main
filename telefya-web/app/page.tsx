import { CompanySection } from "@/components/marketing/company-section";
import { FeatureSection } from "@/components/marketing/feature-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { PricingSection } from "@/components/marketing/pricing-section";
import { ResourcesSection } from "@/components/marketing/resources-section";
import { TrustedSection } from "@/components/marketing/trusted-section";

export default function HomePage() {
  return (
    <>
      <MarketingNavbar />
      <main>
        <HeroSection />
        <FeatureSection />
        <PricingSection />
        <ResourcesSection />
        <CompanySection />
        <TrustedSection />
      </main>
      <MarketingFooter />
    </>
  );
}