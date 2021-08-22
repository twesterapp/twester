import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import axios from "axios";

import { Button } from "@/ui/Button";
import { InputText } from "@/ui/Input";
import { px2em } from "@/utils";
import { isServer } from "@/utils";

enum FlowStep {
  CREDENTIALS = "credentials",
  TWITCHGUARD_CODE = "twitchguard_code",
  TWO_FA_TOKEN = "two_fa_token"
}

// TODO: Clean this mess. Create a wrapper component for Verification step.
function LoginFlow() {
  const router = useRouter();
  const isAuth = !isServer() && !!window.localStorage.getItem("access-token");
  const [flowStep, setFlowStep] = useState<FlowStep>(FlowStep.CREDENTIALS);
  const [verifyOptions, setVerifyOptions] = useState<VerifyOptions>({
    username: "",
    password: "",
    captcha: "",
    email: ""
  });

  function handleNextStepCallback(step: FlowStep, data: VerifyOptions) {
    setFlowStep(step);
    setVerifyOptions(data);
  }

  useEffect(() => {
    if (isAuth) {
      router.push("/");
    }
  }, [isAuth, router]);

  if (!isAuth) {
    if (flowStep === FlowStep.TWITCHGUARD_CODE) {
      return <VerifyWithCode {...verifyOptions} />;
    } else if (flowStep === FlowStep.TWO_FA_TOKEN) {
      return <VerifyWithTwoFa {...verifyOptions} />;
    }

    return <AskForLoginCredentials nextStepCallback={handleNextStepCallback} />;
  }

  return null;
}

export default LoginFlow;

interface AskForLoginCredentialsOptions {
  nextStepCallback: (step: FlowStep, data: VerifyOptions) => void;
}

function AskForLoginCredentials({
  nextStepCallback
}: AskForLoginCredentialsOptions) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
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
    setErr("");

    const res = await axios.post("http://localhost:7878/auth", {
      username,
      password
    });

    setSendingReq(false);

    if (res.data.access_token) {
      window.localStorage.setItem("access-token", res.data.access_token);
      window.localStorage.setItem("username", username);
      router.push("/");
    }

    if (res.data.captcha) {
      const data: VerifyOptions = {
        username,
        password,
        captcha: res.data.captcha,
        email: res.data?.email
      };

      if (res.data.error.code === 3011) {
        nextStepCallback(FlowStep.TWO_FA_TOKEN, data);
        return;
      } else if (res.data.error.code === 3022) {
        nextStepCallback(FlowStep.TWITCHGUARD_CODE, data);
        return;
      }
    }

    setErr(res.data?.error?.message);
  }

  return (
    <Container>
      <h1 style={{ marginBottom: px2em(43) }}>
        Login to your Twitch account to start
      </h1>
      <Form>
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
        {err && <p style={{ color: "orange" }}>{err}</p>}
        <Button
          variant="submit"
          text="Login"
          width="300px"
          onClick={handleSubmit}
          disabled={isButtonDisabled}
          loading={sendingReq}
        />
      </Form>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  max-width: 300px;
`;

interface VerifyOptions {
  username: string;
  password: string;
  captcha: string;
  email: string;
}

function VerifyWithCode({
  username,
  password,
  captcha,
  email = ""
}: VerifyOptions) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [sendingReq, setSendingReq] = useState(false);

  async function handleSubmit(event: React.FormEvent<EventTarget>) {
    event.preventDefault();
    setSendingReq(true);
    setErr("");

    const res = await axios.post("http://localhost:7878/auth/code", {
      username,
      password,
      captcha,
      code
    });

    setSendingReq(false);

    if (res.data.access_token) {
      window.localStorage.setItem("access-token", res.data.access_token);
      window.localStorage.setItem("username", username);
      router.push("/");
    }

    setErr(res.data?.error?.message);
  }

  return (
    <Container>
      <h1 style={{ marginBottom: 0 }}>Enter the verification code sent to</h1>
      <p style={{ marginBottom: px2em(43) }}>{email}</p>
      <Form onSubmit={handleSubmit}>
        <InputText
          variant="number"
          value={code}
          onChange={(e: any) => setCode(e.target.value)}
          width="300px"
          style={{ marginBottom: px2em(52) }}
        />
        {err && <p style={{ color: "orange" }}>{err}</p>}
        <Button
          text="Verify"
          variant="submit"
          width="300px"
          onClick={handleSubmit}
          loading={sendingReq}
          disabled={!code.trim()}
        />
      </Form>
    </Container>
  );
}

function VerifyWithTwoFa({ username, password, captcha }: VerifyOptions) {
  const router = useRouter();
  const [twoFa, setTwoFa] = useState("");
  const [err, setErr] = useState("");
  const [sendingReq, setSendingReq] = useState(false);

  async function handleSubmit(event: React.FormEvent<EventTarget>) {
    event.preventDefault();
    setSendingReq(true);
    setErr("");

    const res = await axios.post("http://localhost:7878/auth/two-fa", {
      username,
      password,
      captcha,
      two_fa: twoFa
    });

    setSendingReq(false);

    if (res.data.access_token) {
      window.localStorage.setItem("access-token", res.data.access_token);
      window.localStorage.setItem("username", username);
      router.push("/");
    }

    setErr(res.data?.error?.message);
  }

  return (
    <Container>
      <h1 style={{ marginBottom: px2em(43) }}>
        Enter the token from your authenticator app
      </h1>
      <Form onSubmit={handleSubmit}>
        <InputText
          width="300px"
          variant="number"
          value={twoFa}
          onChange={(e: any) => setTwoFa(e.target.value)}
          style={{ marginBottom: px2em(52) }}
        />
        {err && <p style={{ color: "orange" }}>{err}</p>}
        <Button
          width="300px"
          text="Verify"
          variant="submit"
          onClick={handleSubmit}
          loading={sendingReq}
          disabled={!twoFa.trim()}
        />
      </Form>
    </Container>
  );
}
