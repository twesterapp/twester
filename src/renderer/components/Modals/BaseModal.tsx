import React from 'react';
import { IconCross } from 'renderer/ui';
import styled, { useTheme } from 'styled-components';

interface Props {
    children: any;
    closeModal: () => void;
    heading: string;
}

export function BaseModal({ children, closeModal, heading }: Props) {
    const theme = useTheme();

    const escFunction = React.useCallback(
        (event) => {
            if (event.keyCode === 27) {
                closeModal();
            }
        },
        [closeModal]
    );

    React.useEffect(() => {
        document.addEventListener('keydown', escFunction, false);

        return () => {
            document.removeEventListener('keydown', escFunction, false);
        };
    }, [escFunction]);

    return (
        <>
            <ModalContainer>
                <ModalBox>
                    <HeadingCloseButtonContainer>
                        <h1>{heading}</h1>
                        <button
                            type="button"
                            id="close-button"
                            onClick={closeModal}
                        >
                            <IconCross
                                size={16}
                                color={theme.color.onPrimary}
                            />
                        </button>
                    </HeadingCloseButtonContainer>
                    {children}
                </ModalBox>
            </ModalContainer>
            <Backdrop />
        </>
    );
}

const ModalBox = styled.div`
    position: fixed;
    padding: 1.5rem;
    background: ${(props) => props.theme.color.background2};
    border-radius: 4px;
`;

const ModalContainer = styled.div`
    position: fixed;
    z-index: 100;
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
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
