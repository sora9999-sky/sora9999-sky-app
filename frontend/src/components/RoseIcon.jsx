/**
 * Hand-drawn rose icon — minimal, friendly, fits the pharmacy aesthetic.
 * Accepts standard Lucide-like props (className, strokeWidth).
 */
const RoseIcon = ({
    className = "",
    strokeWidth = 1.8,
    ...rest
}) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        {...rest}
    >
        {/* Inner bud */}
        <circle cx="12" cy="10" r="1.6" />
        {/* Petal layers */}
        <path d="M12 7.6c-2.2 0-3.7 1.5-3.7 3.7s1.5 3.7 3.7 3.7 3.7-1.5 3.7-3.7S14.2 7.6 12 7.6Z" />
        <path d="M8.5 9.4C6.4 9.4 4.8 11 4.8 13.1c0 2 1.6 3.7 3.7 3.7" />
        <path d="M15.5 9.4c2.1 0 3.7 1.6 3.7 3.7 0 2-1.6 3.7-3.7 3.7" />
        {/* Stem */}
        <path d="M12 16.8v5" />
        {/* Leaves */}
        <path d="M12 19.5c-1.2 0-2.3-.4-3-1.2" />
        <path d="M12 19.5c1.2 0 2.3-.4 3-1.2" />
    </svg>
);

export default RoseIcon;
