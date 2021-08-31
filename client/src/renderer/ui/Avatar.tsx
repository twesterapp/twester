import React from 'react';
import styled from 'styled-components';

interface AvatarOptions extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  size?: number;
}

export function Avatar({ size = 32, src, ...rest }: AvatarOptions) {
  return <StyledImage {...rest} src={src} size={size} />;
}

const StyledImage = styled.img<AvatarOptions>`
  width: ${(props) => `${props.size}px`};
  height: ${(props) => `${props.size}px`};
  padding: 0.1rem;
  box-sizing: border-box;
  border-radius: 50%;
  border: 2px solid ${(props) => props.theme.color.primary};
  margin: auto 0;
`;
