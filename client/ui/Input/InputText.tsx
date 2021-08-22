import React, { useState } from "react";
import { px2em } from "@/utils";
import styled from "styled-components";

export interface InputTextOptions
  extends React.InputHTMLAttributes<HTMLInputElement> {
  labelText?: string;
  variant?: "email" | "number" | "password" | "search" | "tel" | "text" | "url";
  width?: string;
  value?: string | number;
}

export const InputText = React.forwardRef(
  (
    {
      labelText = "",
      width = "",
      variant = "text",
      placeholder = "",
      onFocus,
      onBlur,
      ...rest
    }: Omit<InputTextOptions, "type">,
    ref
  ) => {
    const [placeholderText, setPlaceholderText] = useState(placeholder);

    function handleOnFocus(event: React.FocusEvent<HTMLInputElement>) {
      setPlaceholderText("");
      if (onFocus) onFocus(event);
    }

    function handleOnBlur(event: React.FocusEvent<HTMLInputElement>) {
      setPlaceholderText(placeholder);
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

InputText.displayName = "InputText";

const StyledInput = styled.input<InputTextOptions & { ref: any }>`
  font-size: 0.875rem;
  border-radius: 12px;
  padding: 0.875em;
  border: none;
  background: #464649;
  border: 2px solid transparent;
  transition: border 200ms ease-out, background-color 200ms ease-out;
  box-sizing: border-box;
  font-family: Poppins, sans-serif;
  color: ${(props) => props.theme.color.textPrimary};
  text-align: ${(props) => props.type === "number" && "center"};

  width: ${(props) => props.width};

  &::placeholder {
    color: #c2c2c3;
    opacity: 0.85;
  }

  &:hover {
    border: 2px solid #6c6c6c;
  }

  &:focus::placeholder {
    color: #c2c2c3;
    opacity: 1;
  }

  &:focus {
    border: 2px solid #3498db;
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
