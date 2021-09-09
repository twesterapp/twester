import React from 'react';
import { px2rem } from 'renderer/utils';
import styled from 'styled-components';
import defaultAvatar from '../assets/default-avatar.png';

interface AvatarOptions extends React.ImgHTMLAttributes<HTMLImageElement> {
  border?: boolean;
  showLiveStatus?: boolean;
  src: string;
  size?: number;
  margin?: string;
}

export function Avatar({
  size = 48,
  border = true,
  showLiveStatus = false,
  margin = '',
  src,
  ...rest
}: AvatarOptions) {
  return (
    <Container style={{ margin }}>
      <StyledImage
        {...rest}
        border={border}
        src={src ?? defaultAvatar}
        size={size}
      />
      {showLiveStatus && <Live>LIVE</Live>}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

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

const Live = styled.p`
  font-size: ${px2rem(13)} !important;
  font-family: 'Karla' !important;
  font-weight: bold;
  position: absolute;
  bottom: -6px;
  background: ${(props) => props.theme.color.primary};
  padding: 2px 3.6px;
  border-radius: 5px;
`;
