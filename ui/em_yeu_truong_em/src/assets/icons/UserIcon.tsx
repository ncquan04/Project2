import React from "react";

interface UserIconProps extends React.SVGProps<SVGSVGElement> {
    // You can add additional custom props here if needed
}

const UserIcon: React.FC<UserIconProps> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 512 512"
        xmlSpace="preserve"
        width="24" // Default size, can be overridden with props
        height="24" // Default size, can be overridden with props
        {...props}
    >
        <g>
            <path
                d="M256 0c-74.439 0-135 60.561-135 135s60.561 135 135 135 135-60.561 135-135S330.439 0 256 0zm0 240c-57.897 0-105-47.103-105-105S198.103 30 256 30s105 47.103 105 105-47.103 105-105 105zM423.966 358.195C387.006 320.667 338.009 300 286 300h-60c-52.008 0-101.006 20.667-137.966 58.195C51.255 395.539 31 444.833 31 497c0 8.284 6.716 15 15 15h420c8.284 0 15-6.716 15-15 0-52.167-20.255-101.461-57.034-138.805zM61.66 482c7.515-85.086 78.351-152 164.34-152h60c85.989 0 156.825 66.914 164.34 152H61.66z"
                fill="currentColor" // Use currentColor to inherit color from parent
            />
        </g>
    </svg>
);

export default UserIcon;
