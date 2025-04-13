import React from 'react';

interface LockIconProps {
    width?: number;
    height?: number;
    color?: string;
    className?: string;
}

const LockIcon: React.FC<LockIconProps> = ({
    width = 24,
    height = 24,
    color = '#000000',
    className = '',
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 32 32"
            className={className}
        >
            <g data-name="Layer 11">
                <path
                    d="M24 11.57h-.53v-3.1a7.47 7.47 0 1 0-14.94 0v3.1H8a4 4 0 0 0-4 4V27a4 4 0 0 0 4 4h16a4 4 0 0 0 4-4V15.57a4 4 0 0 0-4-4zm-13.47-3.1a5.47 5.47 0 1 1 10.94 0v3.1H10.53zM26 27a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V15.57a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
                    fill={color}
                />
                <path
                    d="M16 17.926a1.948 1.948 0 0 0-1.354 3.348v2.371a1 1 0 0 0 1 1h.708a1 1 0 0 0 1-1v-2.371A1.948 1.948 0 0 0 16 17.926z"
                    fill={color}
                />
            </g>
        </svg>
    );
};

export default LockIcon;