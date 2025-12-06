import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard, logout } from '@/routes';
import arimax from '@/routes/arimax';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    BarChart3,
    Database,
    LayoutGrid,
    LogOut,
    Settings,
    TrendingUp,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const olahDataItems: NavItem[] = [
    {
        title: 'Input Data',
        href: '/data/input',
        icon: Database,
    },
    {
        title: 'Hasil Data Latih',
        href: '/data/results',
        icon: Database,
    },
    {
        title: 'Hasil Data Uji',
        href: '/data/test-results',
        icon: Database,
    },
];

const arimaxItems: NavItem[] = [
    {
        title: 'Uji Stasioneritas',
        href: arimax.stationarityTest().url,
        icon: TrendingUp,
    },
    {
        title: 'ACF/PACF',
        href: arimax.acfPacf().url,
        icon: BarChart3,
    },
    {
        title: 'Identifikasi Model',
        href: arimax.modelIdentification().url,
        icon: TrendingUp,
    },
];

const hybridItems: NavItem[] = [
    {
        title: 'Prediksi Hybrid',
        href: '/hybrid/prediction',
        icon: BarChart3,
    },
    {
        title: 'Evaluasi Hybrid',
        href: '/hybrid/evaluation',
        icon: Settings,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Olah Data</SidebarGroupLabel>
                    <SidebarMenu>
                        {olahDataItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>ARIMAX</SidebarGroupLabel>
                    <SidebarMenu>
                        {arimaxItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Prediksi Hybrid (ARIMAX + LSTM)</SidebarGroupLabel>
                    <SidebarMenu>
                        {hybridItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip={{ children: 'Keluar' }}
                        >
                            <Link href={logout().url} method="post" prefetch>
                                <LogOut />
                                <span>Keluar</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
