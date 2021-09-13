import React from 'react';
import {
    Tooltip as MUITooltip,
    withStyles,
    TooltipProps,
} from '@material-ui/core';
import { px2rem } from 'renderer/utils';
import { useTheme } from 'styled-components';

interface TooltipOptions extends TooltipProps {
    background?: string;
    color?: string;
}

/**
 * The first child of `Tooltip` must be a raw DOM Element. A custom component
 * as the first child will cause bugs.
 */
export function Tooltip({
    children,
    color,
    background,
    ...rest
}: TooltipOptions) {
    const theme = useTheme();

    const StyledTooltip = withStyles({
        tooltip: {
            fontFamily: 'Karla',
            fontSize: `${px2rem(16)}`,
            background: background || theme.color.borderOnDisabled,
            color: color || theme.color.textPrimary,
            borderRadius: '6px',
            padding: '4px 8px',
        },
    })(MUITooltip);

    return <StyledTooltip {...rest}>{children}</StyledTooltip>;
}
