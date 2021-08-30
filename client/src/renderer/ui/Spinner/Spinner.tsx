import React from 'react';
import styled from 'styled-components';

export interface SpinnerOptions {
  size?: number;
}

export const Spinner = ({ size = 16 }: SpinnerOptions) => {
  return <StyledSpinner size={size} />;
};

const StyledSpinner = styled.div<{ size: number }>`
  height: ${(props) => `${props.size + 2}px`};
  &::after {
    content: '';
    position: absolute;
    width: ${(props) => `${props.size}px`};
    height: ${(props) => `${props.size}px`};
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
    border: 4px solid transparent;
    border-top-color: ${(props) => props.theme.color.onPrimary};
    border-radius: 50%;
    animation: load3 1s infinite linear;
  }

  @-webkit-keyframes load3 {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
  @keyframes load3 {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
`;
