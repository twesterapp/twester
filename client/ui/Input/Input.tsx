import styled from "styled-components";

export interface InputOptions extends React.HTMLAttributes<HTMLInputElement> {
  width?: string;
  password?: boolean;
}

export function Input({width = "", password = false, ...rest }: Omit<InputOptions, "type">) {
  const inputType = password ? "password" : "text";
  return <StyledInput type={inputType} width={width} {...rest} />;
}

const StyledInput = styled.input<{width: string}>`
  font-size: 0.875rem;
  border-radius: 12px;
  padding: 0.875em;
  border: none;
  background: #464649;
  border: 2px solid transparent;
  transition : border 200ms ease-out, background-color 200ms ease-out;
  box-sizing: border-box;
  font-family: Poppins, sans-serif;
  color: ${props => props.theme.color.textPrimary};

  width: ${props => props.width};

  &::placeholder {
    color: #C2C2C3;
    opacity: 0.85;
  }

  &:hover {
    border: 2px solid #6C6C6C;
  }

  &:focus::placeholder {
    color: #C2C2C3;
    opacity: 1;
  }

  &:focus {
    border: 2px solid #3498DB;
    background: #000000;
    outline: none;
    color: ${props => props.theme.color.textPrimary};
  }
`;
