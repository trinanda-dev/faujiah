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
        title: 'Input Data Latih',
        href: '#',
        icon: Database,
    },
    {
        title: 'Preprocessing Data',
        href: '#',
        icon: Settings,
    },
    {
        title: 'Visualisasi Data',
        href: '#',
        icon: BarChart3,
    },
];

const arimaxItems: NavItem[] = [
    {
        title: 'Stasioneritas',
        href: '#',
        icon: TrendingUp,
    },
    {
        title: 'Hasil Prediksi ARIMAX',
        href: '#',
        icon: BarChart3,
    },
    {
        title: 'Evaluasi Model ARIMAX',
        href: '#',
        icon: Settings,
    },
];

const hybridItems: NavItem[] = [
    {
        title: 'Hasil Prediksi Hybrid',
        href: '#',
        icon: BarChart3,
    },
    {
        title: 'Perbandingan Model',
        href: '#',
        icon: TrendingUp,
    },
    {
        title: 'Evaluasi Model Hybrid',
        href: '#',
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
