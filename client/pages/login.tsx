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
    captcha: ""
  });

  function handleNextStepCallback(step: FlowStep, data: VerifyOptions) {
    setFlowStep(step);
    setVerifyOptions(data);
  }

  useEffect(() => {
    if (isAuth) {
      router.push("/");
    }
  }, []);

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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [sendingReq, setSendingReq] = useState(false);

  function handleUsernameOnChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUsername(e.target.value);
  }

  function handlePasswordOnChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
  }

  async function handleSubmit(event: React.FormEvent<EventTarget>) {
    event.preventDefault();
    setSendingReq(true);

    console.log({ username, password });

    const res = await axios.post("http://localhost:7878/auth", {
      username,
      password
    });

    setSendingReq(false);

    if (res.data.captcha_proof) {
      const data: VerifyOptions = {
        username,
        password,
        captcha: res.data.captcha_proof
      };

      if (res.data.error_code === 3011) {
        nextStepCallback(FlowStep.TWO_FA_TOKEN, data);
        return;
      } else if (res.data.error_code === 3022) {
        nextStepCallback(FlowStep.TWITCHGUARD_CODE, data);
        return;
      }
    }

    setLoginErr(res.data?.error_description);
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
        {loginErr && <p style={{ color: "orange" }}>{loginErr}</p>}
        <Button
          variant="submit"
          text="Login"
          width="300px"
          disabled={false}
          onClick={handleSubmit}
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
`;

interface VerifyOptions {
  username: string;
  password: string;
  captcha: string;
}

function VerifyWithCode({ username, password, captcha }: VerifyOptions) {
  const router = useRouter();
  const [code, setCode] = useState();
  const [err, setErr] = useState("");
  const [sendingReq, setSendingReq] = useState(false);

  async function handleSubmit(event: React.FormEvent<EventTarget>) {
    event.preventDefault();
    setSendingReq(true);

    const res = await axios.post("http://localhost:7878/auth/code", {
      username,
      password,
      captcha,
      code
    });

    setSendingReq(false);

    if (!isServer() && res.data.access_token) {
      window.localStorage.setItem("access-token", res.data.access_token);
      window.localStorage.setItem("username", username);
      router.push("/");
    }

    setErr(res.data?.error_description);
  }

  return (
    <Container>
      <h1 style={{ marginBottom: px2em(43) }}>
        Enter the verification code sent you to
      </h1>
      <Form onSubmit={handleSubmit}>
        <InputText
          variant="number"
          value={code}
          onChange={(e: any) => setCode(e.target.value)}
          style={{ marginBottom: px2em(52) }}
        />
        {err && <p style={{ color: "orange" }}>{err}</p>}
        <Button
          text="Verify"
          variant="submit"
          onClick={handleSubmit}
          loading={sendingReq}
        />
      </Form>
    </Container>
  );
}

function VerifyWithTwoFa({ username, password, captcha }: VerifyOptions) {
  const router = useRouter();
  const [twoFa, setTwoFa] = useState();
  const [err, setErr] = useState("");
  const [sendingReq, setSendingReq] = useState(false);

  async function handleSubmit(event: React.FormEvent<EventTarget>) {
    event.preventDefault();
    setSendingReq(true);

    const res = await axios.post("http://localhost:7878/auth/two-fa", {
      username,
      password,
      captcha,
      two_fa: twoFa
    });

    setSendingReq(false);

    if (!isServer() && res.data.access_token) {
      window.localStorage.setItem("access-token", res.data.access_token);
      window.localStorage.setItem("username", username);
      router.push("/");
    }

    setErr(res.data?.error_description);
  }

  return (
    <Container>
      <h1 style={{ marginBottom: px2em(43) }}>
        Enter the code found in your authenticator app
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
        />
      </Form>
    </Container>
  );
}
