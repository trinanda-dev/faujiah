import { Link } from '@inertiajs/react';

const footerLinks = {
    about: [
        { label: 'Tentang WHIPS', href: '#about' },
        { label: 'Cara Kerja', href: '#how-it-works' },
        { label: 'FAQ', href: '#faq' },
    ],
    features: [
        { label: 'Fitur Utama', href: '#features' },
        { label: 'Demo Prediksi', href: '#demo' },
        { label: 'Input Data', href: '#input-data' },
    ],
    resources: [
        { label: 'Dokumentasi', href: '#about' },
        { label: 'Referensi', href: '#contact' },
    ],
    contact: [
        { label: 'Kontak', href: '#contact' },
        { label: 'Developer', href: '#contact' },
    ],
};

const scrollToSection = (href: string): void => {
    if (href.startsWith('#')) {
        const element = document.querySelector(href);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

export default function LandingFooter() {
    const currentYear = new Date().getFullYear();

    const handleLinkClick = (
        e: React.MouseEvent<HTMLAnchorElement>,
        href: string,
    ): void => {
        e.preventDefault();
        scrollToSection(href);
    };

    return (
        <footer className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <div className="grid gap-8 lg:grid-cols-5">
                    {/* Logo & Brand */}
                    <div className="lg:col-span-2">
                        <Link
                            href="/"
                            className="flex items-center gap-3"
                            onClick={(e) => {
                                e.preventDefault();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            <img
                                src="/images/Logo-UMRAH.png"
                                alt="WHIPS Logo"
                                className="h-10 w-auto"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold leading-tight text-neutral-900 dark:text-white">
                                    WHIPS
                                </span>
                                <span className="text-xs leading-tight text-neutral-600 dark:text-neutral-400">
                                    Wave Height Prediction System
                                </span>
                            </div>
                        </Link>
                        <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                            Sistem prediksi tinggi gelombang laut berbasis model
                            ARIMAX dan Hybrid ARIMAX–LSTM untuk mendukung
                            keselamatan maritim.
                        </p>
                    </div>

                    {/* Tentang */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                            Tentang
                        </h3>
                        <ul className="mt-4 space-y-3">
                            {footerLinks.about.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        onClick={(e) => handleLinkClick(e, link.href)}
                                        className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Fitur */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                            Fitur
                        </h3>
                        <ul className="mt-4 space-y-3">
                            {footerLinks.features.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        onClick={(e) => handleLinkClick(e, link.href)}
                                        className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Dokumentasi & Kontak */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                            Lainnya
                        </h3>
                        <ul className="mt-4 space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        onClick={(e) => handleLinkClick(e, link.href)}
                                        className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                            {footerLinks.contact.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        onClick={(e) => handleLinkClick(e, link.href)}
                                        className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-12 border-t border-neutral-200 pt-8 dark:border-neutral-800">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            © {currentYear} WHIPS. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}


