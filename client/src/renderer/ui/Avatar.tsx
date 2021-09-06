import React from 'react';
import styled from 'styled-components';
import defaultAvatar from '../assets/default-avatar.png';

interface AvatarOptions extends React.ImgHTMLAttributes<HTMLImageElement> {
  border?: boolean;
  src: string;
  size?: number;
}

export function Avatar({
  size = 48,
  border = true,
  src,
  ...rest
}: AvatarOptions) {
  return (
    <StyledImage
      {...rest}
      border={border}
      src={src ?? defaultAvatar}
      size={size}
    />
  );
}

const StyledImage = styled.img<AvatarOptions>`
  width: ${(props) => `${props.size}px`};
  height: ${(props) => `${props.size}px`};
  display: block;
  position: relative;
  box-sizing: border-box;
  border-radius: 50%;
  padding: 0.15rem;
  border: ${(props) =>
    props.border && `0.15rem solid ${props.theme.color.primary}`};
  user-select: none;
`;
