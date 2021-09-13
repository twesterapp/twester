import React from 'react';

import {
    FaSignOutAlt,
    FaPlay,
    FaPause,
    FaUsers,
    FaEye,
    FaPowerOff,
    FaClock,
    FaStar,
} from 'react-icons/fa';
import { ImCross } from 'react-icons/im';
import { IconBaseProps } from 'react-icons';

export { FaUsers as IconStreamers };
export { FaEye as IconEye };
export { FaSignOutAlt as IconSignOut };
export { ImCross as IconCross };

export function IconPlus({ style, ...rest }: IconBaseProps) {
    const _style = {
        ...style,
        transform: `rotate(45deg)`,
    };

    return <ImCross style={_style} {...rest} />;
}

export { FaPlay as IconPlay };
export { FaPause as IconPause };
export { FaPowerOff as IconPower };
export { FaClock as IconClock };
export { FaStar as IconStar };
