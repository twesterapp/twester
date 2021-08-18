import styled from "styled-components";

export interface InputTextOptions
  extends React.HTMLAttributes<HTMLInputElement> {
  variant?: "email" | "number" | "password" | "search" | "tel" | "text" | "url";
  width?: string;
  value?: string | number;
}

export function InputText({
  width = "",
  variant = "text",
  ...rest
}: Omit<InputTextOptions, "type">) {
  return <StyledInput {...rest} type={variant} width={width} />;
}

const StyledInput = styled.input<InputTextOptions>`
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
`;