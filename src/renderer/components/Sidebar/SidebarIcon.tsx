import React from 'react';
import styled, { useTheme } from 'styled-components';
import { IconType } from 'react-icons';

interface SidebarIconOptions extends React.HTMLAttributes<HTMLDivElement> {
    active?: boolean;
    bgColorOnHover?: string;
    iconColor?: string;
    iconSize?: number;
    icon: IconType;
}

export function SidebarIcon({
    active = false,
    bgColorOnHover = '',
    icon,
    iconSize = 32,
    ...rest
}: SidebarIconOptions) {
    const theme = useTheme();
    const Icon = icon;
    const getColor = () => {
        if (rest.iconColor) {
            return rest.iconColor;
        }

        return active ? theme.color.textPrimary : theme.color.brightBlue;
    };

    return (
        <IconContainer
            active={active}
            bgColorOnHover={bgColorOnHover}
            {...rest}
        >
            <Icon size={iconSize} color={getColor()} />
        </IconContainer>
    );
}

const IconContainer = styled.div<{ active: boolean; bgColorOnHover: string }>`
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    box-sizing: border-box;
    cursor: pointer;
    background-color: ${(props) =>
        props.active && props.theme.color.background2};
    transition: background-color 200ms ease-out;

    &:hover {
        background: ${(props) => {
            if (!props.active) {
                return props.bgColorOnHover
                    ? props.bgColorOnHover
                    : props.theme.color.background2;
            }

            return '';
        }};
    }

    &:active {
        background: ${(props) =>
            !props.active && props.theme.color.background3};
    }
`;
