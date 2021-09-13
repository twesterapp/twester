import React, { useState, useEffect, useRef } from 'react';
import styled, { useTheme } from 'styled-components';

import { LoadingScreen } from 'renderer/components';
import { fetchChannelInfo, nodeClient } from 'renderer/api';
import {
    useAuthStore,
    User,
    setUser,
    setToken,
} from 'renderer/stores/useAuthStore';
import { Button, IconGithub, InputText } from 'renderer/ui';

import { fakeLogin, login, px2em } from '../utils';

enum FlowStep {
    CREDENTIALS = 'credentials',
    TWITCHGUARD_CODE = 'twitchguard_code',
    TWO_FA_TOKEN = 'two_fa_token',
}

interface VerifyOptions {
    username: string;
    password: string;
    captcha: string;
    email: string;
}

// TODO: Clean this mess.
export function AuthPage() {
    const { user } = useAuthStore();
    const theme = useTheme();
    const [flowStep, setFlowStep] = useState<FlowStep>(FlowStep.CREDENTIALS);
    const [verifyOptions, setVerifyOptions] = useState<VerifyOptions>({
        username: '',
        password: '',
        captcha: '',
        email: '',
    });

    function handleNextStepCallback(step: FlowStep, data: VerifyOptions) {
        setFlowStep(step);
        setVerifyOptions(data);
    }

    const renderCredentialsForm = () => (
        <>
            {/* REMOVE THIS BUTTON BEFORE SHIPPING LULW */}
            <button type="button" onClick={() => fakeLogin()}>
                Fake Login
            </button>
            <AskForLoginCredentials nextStepCallback={handleNextStepCallback} />
        </>
    );

    const renderCodeForm = () => <VerifyWithCode {...verifyOptions} />;

    const renderTwoFaForm = () => <VerifyWithTwoFa {...verifyOptions} />;

    const renderForm = () => {
        if (flowStep === FlowStep.TWITCHGUARD_CODE) {
            return renderCodeForm();
        }

        if (flowStep === FlowStep.TWO_FA_TOKEN) {
            return renderTwoFaForm();
        }

        return renderCredentialsForm();
    };

    if (!user.id) {
        return (
            <PageWrapper>
                <OpenSource>
                    <p>
                        Twester is{' '}
                        <a
                            href="https://github.com/ceoshikhar/twester"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Open Source
                        </a>
                    </p>
                    <IconGithub size={24} color={theme.color.textPrimary} />
                </OpenSource>
                {renderForm()}
                <Footer>
                    Created by{' '}
                    <a
                        href="https://ceoshikhar.com"
                        target="_blank"
                        rel="noreferrer"
                    >
                        @ceoshikhar
                    </a>{' '}
                    with love in India
                </Footer>
            </PageWrapper>
        );
    }

    return <LoadingScreen />;
}

const Footer = styled.p`
    font-size: 14px;
    margin-bottom: 16px;

    a {
        color: ${(props) => props.theme.color.primary};
        text-decoration: none;
        font-weight: bold;

        &:hover {
            text-decoration: underline;
        }
    }
`;

const OpenSource = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 16px 16px 0 0;

    a {
        color: ${(props) => props.theme.color.primary};
        text-decoration: none;
        font-weight: bold;

        &:hover {
            text-decoration: underline;
        }
    }

    p {
        font-size: 14px;
        margin-right: 4px;
    }
`;

const PageWrapper = styled.div`
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100vw;
    height: 100vh;
    align-items: center;
    justify-content: space-between;
    text-align: center;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    max-width: 300px;
`;

const FormContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export default AuthPage;

interface AskForLoginCredentialsOptions {
    nextStepCallback: (step: FlowStep, data: VerifyOptions) => void;
}

function AskForLoginCredentials({
    nextStepCallback,
}: AskForLoginCredentialsOptions) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');
    const [sendingReq, setSendingReq] = useState(false);

    const isButtonDisabled = !username.trim() || !password.trim();

    function handleUsernameOnChange(e: React.ChangeEvent<HTMLInputElement>) {
        setUsername(e.target.value);
    }

    function handlePasswordOnChange(e: React.ChangeEvent<HTMLInputElement>) {
        setPassword(e.target.value);
    }

    async function handleSubmit(event: React.FormEvent<EventTarget>) {
        event.preventDefault();
        setSendingReq(true);
        setErr('');

        const res = await nodeClient.post('/auth', {
            username,
            password,
        });

        setSendingReq(false);

        if (res.data.access_token) {
            login(res.data.access_token, username);
        }

        if (res.data.captcha) {
            const data: VerifyOptions = {
                username,
                password,
                captcha: res.data.captcha,
                email: res.data?.email,
            };

            if (res.data.error.code === 3011) {
                nextStepCallback(FlowStep.TWO_FA_TOKEN, data);
                return;
            }

            if (res.data.error.code === 3022) {
                nextStepCallback(FlowStep.TWITCHGUARD_CODE, data);
                return;
            }
        }

        setErr(res.data?.error?.message);
    }

    return (
        <FormContainer>
            <h1 style={{ margin: 0, marginBottom: px2em(43) }}>
                Login to your Twitch account to start
            </h1>
            <Form onSubmit={handleSubmit}>
                <InputText
                    width="300px"
                    placeholder="Username"
                    style={{ marginBottom: px2em(23) }}
                    value={username}
                    onChange={handleUsernameOnChange}
                />
                <InputText
                    variant="password"
                    width="300px"
                    placeholder="Password"
                    style={{ marginBottom: px2em(52) }}
                    value={password}
                    onChange={handlePasswordOnChange}
                />
                {err && <p style={{ color: 'orange' }}>{err}</p>}
                <Button
                    variant="submit"
                    text="Login"
                    width="300px"
                    onClick={handleSubmit}
                    disabled={isButtonDisabled}
                    loading={sendingReq}
                />
            </Form>
        </FormContainer>
    );
}

function VerifyWithCode({
    username,
    password,
    captcha,
    email = '',
}: VerifyOptions) {
    const [code, setCode] = useState('');
    const [err, setErr] = useState('');
    const [sendingReq, setSendingReq] = useState(false);

    function handleCodeInput(event: React.ChangeEvent<HTMLInputElement>) {
        setCode(event.target.value);
    }

    async function handleSubmit(event: React.FormEvent<EventTarget>) {
        event.preventDefault();
        setSendingReq(true);
        setErr('');

        const res = await nodeClient.post('/auth/code', {
            username,
            password,
            captcha,
            code,
        });

        if (res.data.access_token) {
            login(res.data.access_token, username);
        }

        setErr(res.data?.error?.message);
        setSendingReq(false);
    }

    return (
        <FormContainer>
            <h1 style={{ margin: 0 }}>Enter the verification code sent to</h1>
            <p style={{ marginBottom: px2em(43) }}>{email}</p>
            <Form onSubmit={handleSubmit}>
                <InputText
                    placeholder="Code"
                    variant="number"
                    value={code}
                    onChange={handleCodeInput}
                    width="300px"
                    style={{ marginBottom: px2em(52) }}
                />
                {err && <p style={{ color: 'orange' }}>{err}</p>}
                <Button
                    text="Verify"
                    variant="submit"
                    width="300px"
                    onClick={handleSubmit}
                    loading={sendingReq}
                    disabled={!code.trim()}
                />
            </Form>
        </FormContainer>
    );
}

function VerifyWithTwoFa({ username, password, captcha }: VerifyOptions) {
    const [twoFa, setTwoFa] = useState('');
    const [err, setErr] = useState('');
    const [sendingReq, setSendingReq] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function handleTwoFaInput(event: React.ChangeEvent<HTMLInputElement>) {
        setTwoFa(event.target.value);
    }

    async function handleSubmit(event: React.FormEvent<EventTarget>) {
        event.preventDefault();
        setSendingReq(true);
        setErr('');

        const res = await nodeClient.post('/auth/two-fa', {
            username,
            password,
            captcha,
            two_fa: twoFa,
        });

        if (res.data.access_token) {
            login(res.data.access_token, username);
        }

        setErr(res.data?.error?.message);
        setSendingReq(false);
    }

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <FormContainer>
            <h1 style={{ marginTop: 0, marginBottom: px2em(43) }}>
                Enter the token from your authenticator app
            </h1>
            <Form onSubmit={handleSubmit}>
                <InputText
                    ref={inputRef}
                    placeholder="Token"
                    width="300px"
                    variant="number"
                    value={twoFa}
                    onChange={handleTwoFaInput}
                    style={{ marginBottom: px2em(52) }}
                />
                {err && <p style={{ color: 'orange' }}>{err}</p>}
                <Button
                    width="300px"
                    text="Verify"
                    variant="submit"
                    onClick={handleSubmit}
                    loading={sendingReq}
                    disabled={!twoFa.trim()}
                />
            </Form>
        </FormContainer>
    );
}
