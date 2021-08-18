import React from "react";
import styled from "styled-components";

export interface ButtonOptions extends React.HTMLAttributes<HTMLButtonElement> {
  text: string;
  disabled?: boolean;
  width?: string;
  type?: "submit" | "reset" | "button";
}

export function Button({
  text,
  width = "",
  disabled = false,
  type="button",
  ...rest
}: ButtonOptions) {
  return (
    <StyledButton disabled={disabled} type={type} width={width} {...rest}>
      {text}
    </StyledButton>
  );
}

const StyledButton = styled.button<{ disabled: boolean; width: string }>`
  background: ${(props) =>
    props.disabled ? "#464649" : props.theme.color.primary};
  color: ${(props) =>
    props.disabled ? "#A0A0A0" : props.theme.color.onPrimary};
  font-size: 1rem;
  font-weight: 700;
  padding: 0.875em;
  width: ${(props) => props.width};
  border-radius: 14px;
  border: none;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  box-sizing: border-box;
  font-family: Poppins, sans-serif;
  letter-spacing: 0.5px;

  &:hover {
    background: ${(props) => !props.disabled && "#1484CF"};
  }

  &:active {
    background: ${(props) => props.theme.color.primary};
  }
`;
