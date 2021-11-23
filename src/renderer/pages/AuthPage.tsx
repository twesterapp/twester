import { Button, IconGithub, InputText } from 'renderer/ui';
import { CaptchaSolvingErrorModal, LoadingScreen } from 'renderer/components';
import React, { useEffect, useRef, useState } from 'react';
import styled, { useTheme } from 'styled-components';

import { api } from 'renderer/core/api';
import { auth } from 'renderer/core/auth';
import { px2rem } from 'renderer/utils/px2rem';
import { useAppVersion } from 'renderer/hooks';

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
    const version = useAppVersion();
    const { user } = auth.useStore();
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
        <AskForLoginCredentials nextStepCallback={handleNextStepCallback} />
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
            <>
                <PageWrapper>
                    <Header>
                        <HeaderItem
                            style={{
                                marginLeft: '16px',
                            }}
                        >
                            {version && (
                                <p
                                    style={{
                                        fontFamily: 'Roboto Mono',
                                        color: theme.color.borderOnDisabled,
                                    }}
                                >
                                    v{version}
                                </p>
                            )}
                        </HeaderItem>
                        <HeaderItem style={{ marginRight: '16px' }}>
                            <p style={{ marginRight: '4px' }}>
                                Twester is{' '}
                                <Anchor
                                    href="https://github.com/twesterapp/twester"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Open Source
                                </Anchor>
                            </p>
                            <IconGithub
                                size={24}
                                color={theme.color.textPrimary}
                            />
                        </HeaderItem>
                    </Header>
                    {renderForm()}
                    <Footer>
                        Created & Designed by{' '}
                        <Anchor
                            href="https://ceoshikhar.com"
                            target="_blank"
                            rel="noreferrer"
                        >
                            @ceoshikhar
                        </Anchor>{' '}
                        with love in India
                    </Footer>
                </PageWrapper>
            </>
        );
    }

    return <LoadingScreen />;
}

const HeaderItem = styled.div`
    display: flex;
    align-items: center;
`;

const Footer = styled.p`
    font-size: 14px;
    margin-bottom: 16px;
`;

const Anchor = styled.a`
    color: ${(props) => props.theme.color.primary};
    text-decoration: none;
    font-weight: bold;
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
`;

const Header = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 16px 0;

    p {
        font-size: 14px;
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

const ErrMsg = styled.p`
    text-align: left;
    margin-top: 0.5rem;
    color: ${(props) => props.theme.color.error};
`;

export default AuthPage;

interface AskForLoginCredentialsOptions {
    nextStepCallback: (step: FlowStep, data: VerifyOptions) => void;
}

function AskForLoginCredentials({
    nextStepCallback,
}: AskForLoginCredentialsOptions) {
    const theme = useTheme();
    const [loginFailedOnce, setLoginFailedOnce] = useState(false);
    const [showErrorInfoDialog, setShowErrorInfoDialog] = useState(false);
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

        const res = await api.login({ username, password });

        setSendingReq(false);

        if (res.access_token) {
            auth.login(res.access_token, username);
        }

        if (res.captcha) {
            const data: VerifyOptions = {
                username,
                password,
                captcha: res.captcha,
                email: res.email,
            };

            if (res.error.code === 3011) {
                nextStepCallback(FlowStep.TWO_FA_TOKEN, data);
                return;
            }

            if (res.error.code === 3022) {
                nextStepCallback(FlowStep.TWITCHGUARD_CODE, data);
                return;
            }
        }

        setErr(res.error?.message);
        setLoginFailedOnce(true);
    }

    const renderErrorInfoDialog = () => (
        <CaptchaSolvingErrorModal
            closeModal={() => setShowErrorInfoDialog(false)}
        />
    );

    return (
        <>
            {showErrorInfoDialog && renderErrorInfoDialog()}
            <FormContainer>
                <h1
                    style={{
                        margin: 0,
                        marginBottom: loginFailedOnce ? px2rem(8) : px2rem(42),
                    }}
                >
                    Login to your Twitch account to start
                </h1>

                {loginFailedOnce && (
                    <p
                        style={{
                            margin: 0,
                            marginBottom: px2rem(42),
                            color: theme.color.secondary,
                        }}
                    >
                        Please read{' '}
                        <Colored onClick={() => setShowErrorInfoDialog(true)}>
                            this
                        </Colored>{' '}
                        before retrying login
                    </p>
                )}

                <Form onSubmit={handleSubmit}>
                    <InputText
                        width="300px"
                        placeholder="Username"
                        style={{ marginBottom: px2rem(23) }}
                        value={username}
                        onChange={handleUsernameOnChange}
                    />
                    <InputText
                        variant="password"
                        width="300px"
                        placeholder="Password"
                        value={password}
                        onChange={handlePasswordOnChange}
                    />
                    {err && <ErrMsg>{err}</ErrMsg>}
                    <Button
                        style={{ marginTop: px2rem(52) }}
                        variant="submit"
                        text="Login"
                        width="300px"
                        onClick={handleSubmit}
                        disabled={isButtonDisabled}
                        loading={sendingReq}
                    />
                </Form>
            </FormContainer>
        </>
    );
}

const Colored = styled.span`
    font-weight: bold;
    color: ${(props) => props.theme.color.brightBlue};
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
`;

function VerifyWithCode({
    username,
    password,
    captcha,
    email = '',
}: VerifyOptions) {
    const [code, setCode] = useState('');
    const [err, setErr] = useState('');
    const [sendingReq, setSendingReq] = useState(false);
    const [sendingResendReq, setSendingResendReq] = useState(false);

    function handleCodeInput(event: React.ChangeEvent<HTMLInputElement>) {
        setCode(event.target.value);
    }

    async function handleSubmit(event: React.FormEvent<EventTarget>) {
        event.preventDefault();
        setSendingReq(true);
        setErr('');

        const res = await api.submitTwitchguardCode({
            username,
            password,
            captcha,
            code,
        });

        if (res.access_token) {
            auth.login(res.access_token, username);
        }

        setErr(res.error?.message);
        setSendingReq(false);
    }

    async function handleResendCode(event: React.FormEvent<EventTarget>) {
        event.preventDefault();
        setSendingResendReq(true);
        setErr('');

        const res = await api.resendCode(username);

        if (res.error) {
            setErr(res.error);
        }
    }

    return (
        <FormContainer>
            <h1 style={{ margin: 0 }}>Enter the verification code sent to</h1>
            <p style={{ marginBottom: px2rem(43) }}>{email}</p>
            <Form onSubmit={handleSubmit}>
                {err && (
                    <ErrMsg style={{ marginBottom: px2rem(8) }}>{err}</ErrMsg>
                )}
                <InputText
                    placeholder="Code"
                    variant="number"
                    value={code}
                    onChange={handleCodeInput}
                    width="300px"
                />
                <Anchor
                    style={{
                        marginTop: '0.5rem',
                        fontSize: '14px',
                        textAlign: 'left',
                        fontWeight: 'normal',
                        opacity: sendingResendReq ? '0.75' : '1',
                    }}
                    onClick={(e) => !sendingResendReq && handleResendCode(e)}
                >
                    Resend Code
                </Anchor>
                <Button
                    style={{ marginTop: px2rem(52) }}
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

        const res = await api.submitTwoFaCode({
            username,
            password,
            captcha,
            two_fa: twoFa,
        });

        if (res.access_token) {
            auth.login(res.access_token, username);
        }

        setErr(res.error?.message);
        setSendingReq(false);
    }

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <FormContainer>
            <h1 style={{ marginTop: 0, marginBottom: px2rem(43) }}>
                Enter the token from your authenticator app
            </h1>
            <Form onSubmit={handleSubmit}>
                {err && (
                    <ErrMsg style={{ marginBottom: px2rem(8) }}>{err}</ErrMsg>
                )}
                <InputText
                    ref={inputRef}
                    placeholder="Token"
                    width="300px"
                    variant="number"
                    value={twoFa}
                    onChange={handleTwoFaInput}
                    style={{ marginBottom: px2rem(52) }}
                />
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
