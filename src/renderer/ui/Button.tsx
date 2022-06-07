import React, { forwardRef, ReactNode } from 'react';
import styled from 'styled-components';

import { Spinner } from './Spinner';

export interface ButtonOptions extends React.HTMLAttributes<HTMLButtonElement> {
    children?: ReactNode;
    disabled?: boolean;
    loading?: boolean;
    type?: 'submit' | 'reset' | 'button';
    variant?: 'primary' | 'secondary' | 'error';
}

export const Button = forwardRef<HTMLButtonElement, ButtonOptions>(
    (
        {
            children,
            disabled = false,
            loading = false,
            type = 'submit',
            variant = 'primary',
            ...rest
        },
        ref
    ) => {
        return (
            <StyledButton
                ref={ref}
                {...rest}
                disabled={disabled || loading}
                variant={variant}
                type={type}
            >
                {loading ? <Spinner /> : children}
            </StyledButton>
        );
    }
);

Button.displayName = 'Button';

const StyledButton = styled.button<ButtonOptions>`
    position: relative;
    background: ${(props) =>
        props.disabled && props.variant === 'primary'
            ? props.theme.color.disabledPrimary
            : props.disabled && props.variant === 'secondary'
            ? props.theme.color.disabledSecondary
            : props.disabled && props.variant === 'error'
            ? props.theme.color.disabledError
            : props.variant === 'secondary'
            ? props.theme.color.secondary
            : props.variant === 'error'
            ? props.theme.color.error
            : props.theme.color.primary};
    color: ${(props) =>
        props.disabled
            ? props.theme.color.onDisabled
            : props.theme.color.onPrimary};
    font-size: 1rem;
    font-weight: 700;
    padding: 0.875em;
    border-radius: 4px;
    border: none;
    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
    box-sizing: border-box;
    font-family: Poppins, sans-serif;
    letter-spacing: 0.5px;

    transition: background-color 200ms ease-out;

    &:hover {
        background: ${(props) =>
            props.disabled
                ? undefined
                : props.variant === 'error'
                ? props.theme.color.onErrorHover
                : props.variant === 'secondary'
                ? props.theme.color.onSecondaryHover
                : props.theme.color.onPrimaryHover};
    }

    &:active {
        background: ${(props) =>
            props.disabled
                ? undefined
                : props.variant === 'error'
                ? props.theme.color.error
                : props.variant === 'secondary'
                ? props.theme.color.secondary
                : props.theme.color.primary};
    }
`;
