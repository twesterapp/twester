import React from 'react';
import { px2rem } from 'renderer/utils';
import styled from 'styled-components';
import defaultAvatar from '../assets/default-avatar.png';

interface AvatarOptions extends React.ImgHTMLAttributes<HTMLImageElement> {
    border?: boolean;
    borderColor?: string;
    showLiveStatus?: boolean;
    liveStatusBgColor?: string;
    src: string;
    size?: number;
    margin?: string;
}

export function Avatar({
    size = 48,
    border = true,
    borderColor = '',
    showLiveStatus = false,
    liveStatusBgColor = '',
    margin = '',
    src,
    ...rest
}: AvatarOptions) {
    return (
        <Container style={{ margin }}>
            <StyledImage
                {...rest}
                border={border}
                borderColor={borderColor}
                src={src ?? defaultAvatar}
                size={size}
            />
            {showLiveStatus && <Live background={liveStatusBgColor}>LIVE</Live>}
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
    border: ${(props) => {
        if (props.border) {
            if (props.borderColor) {
                return `0.15rem solid ${props.borderColor}`;
            }
            return `0.15rem solid ${props.theme.color.primary}`;
        }

        return '';
    }};
    user-select: none;
`;

const Live = styled.p<{ background?: string }>`
    font-size: ${px2rem(13)} !important;
    font-family: 'Karla' !important;
    font-weight: bold;
    position: absolute;
    bottom: -6px;
    background: ${(props) =>
        props.background ? props.background : props.theme.color.primary};
    padding: 2px 3.6px;
    border-radius: 5px;
    color: ${(props) => props.theme.color.textAlter} !important;
`;
