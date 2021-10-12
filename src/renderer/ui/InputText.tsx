import React, { useState } from 'react';
import styled from 'styled-components';
import { IconButton } from 'renderer/ui/IconButton';
import { IconEyeOpen, IconEyeClose } from 'renderer/ui/Icons';

export interface InputTextOptions
    extends React.InputHTMLAttributes<HTMLInputElement> {
    variant?:
        | 'email'
        | 'number'
        | 'password'
        | 'search'
        | 'tel'
        | 'text'
        | 'url';
    width?: string;
    value?: string | number;
    hidePlaceholderOnFocus?: boolean;
}

export const InputText = React.forwardRef(
    (
        {
            width = '',
            variant = 'text',
            placeholder = '',
            onFocus,
            onBlur,
            hidePlaceholderOnFocus = true,
            ...rest
        }: Omit<InputTextOptions, 'type'>,
        ref
    ) => {
        const [placeholderText, setPlaceholderText] = useState(placeholder);

        function handleOnFocus(event: React.FocusEvent<HTMLInputElement>) {
            if (hidePlaceholderOnFocus) setPlaceholderText('');
            if (onFocus) onFocus(event);
        }

        function handleOnBlur(event: React.FocusEvent<HTMLInputElement>) {
            if (hidePlaceholderOnFocus) setPlaceholderText(placeholder);
            if (onBlur) onBlur(event);
        }

        const isPasswordVariant = variant === 'password';
        const [showingPassword, setShowingPassword] = useState(false);

        return (
            <Container>
                <StyledInput
                    {...rest}
                    placeholder={placeholderText}
                    ref={ref}
                    type={showingPassword ? 'text' : variant}
                    width={width}
                    onFocus={handleOnFocus}
                    onBlur={handleOnBlur}
                />
                {isPasswordVariant && (
                    <IconButton
                        style={{
                            position: 'absolute',
                            right: '10px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                        }}
                        icon={showingPassword ? IconEyeClose : IconEyeOpen}
                        iconSize={18}
                        onClick={() => setShowingPassword((prev) => !prev)}
                    />
                )}
            </Container>
        );
    }
);

InputText.displayName = 'InputText';

const Container = styled.div`
    display: flex;
    align-items: center;
    max-width: fit-content;
    box-sizing: border-box;
    position: relative;
`;

const StyledInput = styled.input<InputTextOptions & { ref: any }>`
    font-size: 0.875rem;
    border-radius: 12px;
    padding: 0.875em;
    border: none;
    background: ${(props) => props.theme.color.disabled};
    border: 2px solid transparent;
    transition: border 200ms ease-out, background-color 200ms ease-out;
    box-sizing: border-box;
    font-family: Poppins, sans-serif;
    color: ${(props) => props.theme.color.textPrimary};
    text-align: ${(props) => props.type === 'number' && 'center'};

    width: ${(props) => props.width};

    &::placeholder {
        color: ${(props) => props.theme.color.onDisabled};
    }

    &:hover {
        border: 2px solid ${(props) => props.theme.color.borderOnDisabled};
    }

    &:focus::placeholder {
        color: ${(props) => props.theme.color.onDisabled};
    }

    &:focus {
        border: 2px solid ${(props) => props.theme.color.primary};
        background: #000000;
        outline: none;
        color: ${(props) => props.theme.color.textPrimary};
    }

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
`;
