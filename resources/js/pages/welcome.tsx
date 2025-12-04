import AboutSection from '@/components/about-section';
import AcknowledgementSection from '@/components/acknowledgement-section';
import FAQSection from '@/components/faq-section';
import FeaturesSection from '@/components/features-section';
import HeroSection from '@/components/hero-section';
import InputDataSection from '@/components/input-data-section';
import LandingFooter from '@/components/landing-footer';
import LandingHeader from '@/components/landing-header';
import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="WHIPS - Wave Height Prediction System">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <div
                className="flex min-h-screen flex-col bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a]"
                style={{ fontFamily: "'Poppins', sans-serif" }}
            >
                <LandingHeader />
                <HeroSection />
                <AboutSection />
                <FeaturesSection />
                <InputDataSection />
                <FAQSection />
                <AcknowledgementSection />
                <LandingFooter />
            </div>
        </>
    );
}
