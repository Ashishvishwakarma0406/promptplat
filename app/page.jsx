import Features from "@/components/ui/Features";
import Footer from "@/components/shared/Footer";
import HeroSection from "@/components/ui/Herosection";
import TrendingPrompts from "@/components/ui/Trendingprompts";

export default function HomePage() {
    return (
      <>
        <main>
          <HeroSection/>
          <TrendingPrompts/>
          <Features/>
        </main>
      </>

    )
  }
  