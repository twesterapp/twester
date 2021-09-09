import React, { ReactNode } from 'react';
import styled from 'styled-components';

import { Spinner } from './Spinner';

export interface ButtonOptions extends React.HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  text?: string;
  disabled?: boolean;
  loading?: boolean;
  width?: string;
  variant?: 'submit' | 'reset' | 'button';
}

export function Button({
  text = '',
  children,
  width = '',
  disabled = false,
  loading = false,
  variant = 'button',
  ...rest
}: Omit<ButtonOptions, 'type'>) {
  return (
    <StyledButton
      {...rest}
      disabled={disabled || loading}
      type={variant}
      width={width}
    >
      {loading ? <Spinner /> : <StyledText>{children || text}</StyledText>}
    </StyledButton>
  );
}

const StyledText = styled.span``;

const StyledButton = styled.button<Omit<ButtonOptions, 'text'>>`
  position: relative;
  background: ${(props) =>
    props.disabled ? '#464649' : props.theme.color.primary};
  color: ${(props) =>
    props.disabled ? '#A0A0A0' : props.theme.color.onPrimary};
  font-size: 1rem;
  font-weight: 700;
  padding: 0.875em;
  width: ${(props) => props.width};
  border-radius: 14px;
  border: none;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  box-sizing: border-box;
  font-family: Poppins, sans-serif;
  letter-spacing: 0.5px;

  transition: background-color 200ms ease-out;

  &:hover {
    background: ${(props) => !props.disabled && '#1484CF'};
  }

  &:active {
    background: ${(props) => !props.disabled && props.theme.color.primary};
  }
`;
