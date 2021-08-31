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
  display: block;
  position: relative;
  box-sizing: border-box;
  border-radius: 50%;
  padding: 0.15rem;
  border: 0.15rem solid ${(props) => props.theme.color.primary};
`;
