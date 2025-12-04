import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { dashboard } from '@/routes';
import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavItem {
    label: string;
    href: string;
}

const navItems: NavItem[] = [
    { label: 'Beranda', href: '#hero' },
    { label: 'Tentang WHIPS', href: '#about' },
    { label: 'Fitur', href: '#features' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Kontak', href: '#contact' },
];

const scrollToSection = (href: string): void => {
    if (href.startsWith('#')) {
        const element = document.querySelector(href);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

export default function LandingHeader() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleNavClick = (
        e: React.MouseEvent<HTMLAnchorElement>,
        href: string,
    ): void => {
        e.preventDefault();
        scrollToSection(href);
        setIsMobileMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-neutral-800 dark:bg-neutral-950/95 dark:supports-[backdrop-filter]:bg-neutral-950/80" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
                {/* Logo */}
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
                    <div className="hidden flex-col sm:flex">
                        <span className="text-sm font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
                            WHIPS
                        </span>
                        <span className="text-xs leading-tight text-neutral-600 dark:text-neutral-400">
                            Wave Height Prediction System
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-1 lg:flex">
                    {navItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            onClick={(e) => handleNavClick(e, item.href)}
                            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                {/* CTA Button & Mobile Menu */}
                <div className="flex items-center gap-3">
                    <Button
                        asChild
                        className="hidden rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-700 lg:flex"
                    >
                        <Link href={dashboard()}>Mulai Prediksi</Link>
                    </Button>

                    {/* Mobile Menu */}
                    <Sheet
                        open={isMobileMenuOpen}
                        onOpenChange={setIsMobileMenuOpen}
                    >
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-80">
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-3">
                                    <img
                                        src="/images/Logo-UMRAH.png"
                                        alt="WHIPS Logo"
                                        className="h-8 w-auto"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold leading-tight">
                                            WHIPS
                                        </span>
                                        <span className="text-xs leading-tight text-neutral-600 dark:text-neutral-400">
                                            Wave Height Prediction System
                                        </span>
                                    </div>
                                </SheetTitle>
                            </SheetHeader>
                            <nav className="mt-8 flex flex-col gap-2">
                                {navItems.map((item) => (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        onClick={(e) =>
                                            handleNavClick(e, item.href)
                                        }
                                        className="rounded-md px-4 py-3 text-base font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                                <Button
                                    asChild
                                    className="mt-4 w-full rounded-md bg-blue-400 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-700"
                                >
                                    <Link href={dashboard()}>
                                        Mulai Prediksi
                                    </Link>
                                </Button>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}

