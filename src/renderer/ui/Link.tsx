import React from 'react';
import { Link as RouterLink, LinkProps } from 'react-router-dom';
import styled from 'styled-components';

export function Link(props: LinkProps) {
    return (
        <StyledLink>
            <RouterLink {...props} />
        </StyledLink>
    );
}

const StyledLink = styled.span`
    a {
        color: ${(props) => props.theme.color.primary};
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
`;
