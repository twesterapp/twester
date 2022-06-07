import React from 'react';
import MUIModal, { ModalProps as MUIModalProps } from '@material-ui/core/Modal';
import { IconCross } from 'renderer/ui';
import styled, { useTheme } from 'styled-components';

export interface ModalProps extends MUIModalProps {
    children: any;
    heading?: string;
    onClose: () => any;
}

export function Modal({ children, heading = '', style, ...props }: ModalProps) {
    const theme = useTheme();

    return (
        <MUIModal
            style={{
                position: 'fixed',
                width: '100%',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...style,
            }}
            {...props}
        >
            <ModalBox>
                <HeadingCloseButtonContainer>
                    <h1>{heading}</h1>
                    <button
                        type="button"
                        id="close-button"
                        onClick={props.onClose}
                    >
                        <IconCross size={16} color={theme.color.onPrimary} />
                    </button>
                </HeadingCloseButtonContainer>
                {children}
            </ModalBox>
        </MUIModal>
    );
}

const ModalBox = styled.div`
    position: fixed;
    padding: 1.5rem;
    background: ${(props) => props.theme.color.background2};
    border-radius: 4px;
`;

const HeadingCloseButtonContainer = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    column-gap: 1rem;

    h1 {
        margin: 0;
        font-size: 1.5rem;
    }

    #close-button {
        border: none;
        height: 32px;
        width: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        background: ${(props) => props.theme.color.brightBlue};

        transition: background-color 100ms ease-out;

        &:hover {
            background: ${(props) => props.theme.color.primary};
        }
    }
`;

const Backdrop = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: rgba(0, 0, 0, 0.67);
    z-index: 50;
`;
