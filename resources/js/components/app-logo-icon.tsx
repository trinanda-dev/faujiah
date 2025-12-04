import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Simple Wave Icon for WHIPS */}
            <path
                d="M20 50 Q30 30, 40 50 T60 50 T80 50"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
            />
            <path
                d="M20 70 Q30 50, 40 70 T60 70 T80 70"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
            />
            <circle cx="50" cy="50" r="8" fill="currentColor" />
        </svg>
    );
}
