import React from 'react';
import {
  Tooltip as MUITooltip,
  withStyles,
  TooltipProps,
} from '@material-ui/core';
import { px2rem } from 'renderer/utils';
import { useTheme } from 'styled-components';

export function Tooltip(props: TooltipProps) {
  const { children, ...rest } = props;
  const theme = useTheme();

  const StyledTooltip = withStyles({
    tooltip: {
      fontFamily: 'Poppins',
      fontSize: `${px2rem(14)}`,
      background: theme.color.primary,
      color: theme.color.onPrimary,
      borderRadius: '6px',
      padding: '4px 8px',
    },
  })(MUITooltip);

  return <StyledTooltip {...rest}>{children}</StyledTooltip>;
}
