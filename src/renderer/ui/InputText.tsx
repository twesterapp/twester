import React, { useState } from 'react';
import styled from 'styled-components';
import { px2em } from '../utils';

export interface InputTextOptions
    extends React.InputHTMLAttributes<HTMLInputElement> {
    labelText?: string;
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
            labelText = '',
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

        const RenderInput = (
            <StyledInput
                {...rest}
                placeholder={placeholderText}
                ref={ref}
                type={variant}
                width={width}
                onFocus={handleOnFocus}
                onBlur={handleOnBlur}
            />
        );

        if (labelText) {
            const { id } = rest;

            if (!id) {
                console.warn(
                    'Option "id" is missing in "InputText". This can cause unexpected behavior.'
                );
            }

            return (
                <>
                    <StyledLabel htmlFor={id}>{labelText}</StyledLabel>
                    {RenderInput}
                </>
            );
        }

        return RenderInput;
    }
);

InputText.displayName = 'InputText';

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
        opacity: 0.85;
    }

    &:hover {
        border: 2px solid ${(props) => props.theme.color.borderOnDisabled};
    }

    &:focus::placeholder {
        color: ${(props) => props.theme.color.onDisabled};
        opacity: 1;
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

const StyledLabel = styled.label`
    text-align: left;
    margin-bottom: ${px2em(8)};
`;
