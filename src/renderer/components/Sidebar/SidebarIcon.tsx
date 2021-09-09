import React from 'react';
import styled, { useTheme } from 'styled-components';
import { IconType } from 'react-icons';

interface SidebarIconOptions extends React.HTMLAttributes<HTMLDivElement> {
    active?: boolean;
    iconColor?: string;
    icon: IconType;
}

export function SidebarIcon({
    active = false,
    icon,
    ...rest
}: SidebarIconOptions) {
    const theme = useTheme();
    const Icon = icon;
    const getColor = () => {
        if (rest.iconColor) {
            return rest.iconColor;
        }

        return active ? theme.color.primary : theme.color.textPrimary;
    };

    return (
        <IconContainer active={active} {...rest}>
            <Icon size={32} color={getColor()} />
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
        background: ${(props) => props.theme.color.background3};
    }
`;
