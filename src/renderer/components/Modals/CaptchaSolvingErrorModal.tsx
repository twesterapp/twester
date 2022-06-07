import React from 'react';
import styled from 'styled-components';

import { Modal, ModalProps } from './Modal';

interface Props extends Omit<ModalProps, 'children' | 'heading'> {}

export function CaptchaSolvingErrorModal(props: Props) {
    return (
        <Modal heading="Twitch login information" {...props}>
            <Container>
                <p>Twester uses Twitch API to allow you to login.</p>
                <br />

                <p>
                    If you make several failed login attempts or do not complete
                    the login flow, you will get
                    <ColoredText> “Captcha Solving required” </ColoredText>error
                    on login.{' '}
                    <ColoredText>
                        Please try to login with least attempts
                    </ColoredText>
                </p>
                <br />

                <p>
                    This happens because Twitch will start requesting for
                    Captcha Solving. Twester cannot support a way to allow user
                    to solve that Captcha. Therefore, Twester’s login becomes
                    useless for an indefinite time until Twitch stops requesting
                    for Captcha Solving. Twitch will do that for your IP. So you
                    will not be able to login to a different account either. .
                </p>
                <br />

                <p>If you are getting this error you can try the following :</p>
                <ul>
                    <li>
                        <p>
                            Restart your internet router/wifi. If you have
                            Dynamic IP, restarting sometimes help mitigate this
                            issue.
                        </p>
                    </li>
                    <li>
                        <p>
                            If the above doesn’t work, all you can do is wait.
                        </p>
                    </li>
                </ul>
                <br />
                <p>
                    <ColoredText>Note: </ColoredText>Do not keep spamming to
                    login even with correct credentials. That will just keep
                    increasing the time until Twitch stops asking for Captcha
                    Solving.
                </p>
            </Container>
        </Modal>
    );
}

const Container = styled.div`
    max-width: 648px;
    margin-top: 1.5rem;
    text-align: left;

    p {
        line-height: 1.35rem;
    }
`;

const ColoredText = styled.span`
    color: ${(props) => props.theme.color.secondary};
`;
