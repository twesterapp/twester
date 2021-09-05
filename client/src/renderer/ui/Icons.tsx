import React from 'react';

import { FaHome, FaEye, FaSignOutAlt, FaPlay, FaStop } from 'react-icons/fa';
import { ImCross } from 'react-icons/im';
import { IconBaseProps } from 'react-icons';

export { FaHome as IconHome };
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
export { FaStop as IconStop };
