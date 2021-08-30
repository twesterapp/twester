import React from 'react';
import styled, { useTheme } from 'styled-components';
import { Tooltip, withStyles } from '@material-ui/core';
import { px2rem } from 'renderer/utils';
import { IconType } from '../../ui/Icons';

interface SidebarIconOptions extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  icon: IconType;
  tooltip?: string;
}

export function SidebarIcon({
  active = false,
  icon,
  tooltip = '',
  ...rest
}: SidebarIconOptions) {
  const theme = useTheme();
  const Icon = icon;
  const color = active ? theme.color.primary : theme.color.textPrimary;

  const StyledTooltip = withStyles({
    tooltip: {
      fontFamily: 'Poppins',
      fontSize: `${px2rem(14)}`,
      background: theme.color.primary,
      color: theme.color.onPrimary,
      borderRadius: '6px',
      padding: '4px 8px',
    },
  })(Tooltip);

  return tooltip ? (
    <StyledTooltip title={tooltip} placement="right" enterDelay={500}>
      <IconContainer active={active} {...rest}>
        <Icon size={32} color={color} />
      </IconContainer>
    </StyledTooltip>
  ) : (
    <IconContainer active={active} {...rest}>
      <Icon size={32} color={color} />
    </IconContainer>
  );
}

const IconContainer = styled.div<{ active: boolean }>`
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  cursor: pointer;
  transition: background-color 200ms ease-out;
  background: ${(props) => props.active && props.theme.color.background4};

  &:hover {
    background: ${(props) =>
      props.active
        ? props.theme.color.background3
        : props.theme.color.background4};
  }

  &:active {
    background: ${(props) =>
      props.active
        ? props.theme.color.background4
        : props.theme.color.background3};
  }
`;
