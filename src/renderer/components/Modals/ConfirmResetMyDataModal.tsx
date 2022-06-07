import React from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';

import { Button } from 'renderer/ui';
import { px2rem } from 'renderer/utils/px2rem';
import { streamers } from 'renderer/core/streamer-manager';

import { Modal, ModalProps } from './Modal';
import { watcher } from 'renderer/core/watcher';

interface Props extends Omit<ModalProps, 'children' | 'heading'> {}

export function ConfirmResetMyDataModal({ onClose, ...rest }: Props) {
    const handleDelete = () => {
        // Watcher must not be running before we proceed to delete any data.
        if (!watcher.canPlay()) return;

        streamers.reset();
        watcher.reset();

        onClose();
        toast.success('Your data has been deleted', {
            icon: '🎉',
            autoClose: 4000,
        });
    };

    return (
        <Modal heading="Are you sure?" onClose={onClose} {...rest}>
            <Container>
                <p>
                    Your data will be permanently deleted and this action cannot
                    be reverted.
                </p>
            </Container>
            <ButtonsContainer>
                <Button variant="error" onClick={handleDelete}>
                    Delete
                </Button>
                <Button onClick={onClose}>Cancel</Button>
            </ButtonsContainer>
        </Modal>
    );
}

const Container = styled.div`
    margin-top: 1.5rem;
`;

const ButtonsContainer = styled.div`
    width: 100%;
    display: flex;
    column-gap: 8px;
    justify-content: flex-end;
    margin-top: ${px2rem(48)};
`;
