import React, { useState } from "react";
import { Button } from "@/ui/Button";
import { InputText } from "@/ui/Input";
import { px2em } from "@/utils";
import styled from "styled-components";
import axios from "axios";

enum FlowStep {
  CREDENTIALS = "credentials",
  TWITCHGUARD_CODE = "twitchguard_code",
  TWO_FA_TOKEN = "two_fa_token",
}

function LoginFlow() {
  const [flowStep, setFlowStep] = useState<FlowStep>(FlowStep.TWO_FA_TOKEN);

  function handleNextStepCallback(step: FlowStep) {
    setFlowStep(step);
  }

  if (flowStep === FlowStep.TWITCHGUARD_CODE) {
    return <AskForTwitchguardCode />
  } else if (flowStep === FlowStep.TWO_FA_TOKEN) {
    return <AskForTwoFaToken />
  }

  return <AskForLoginCredentials nextStepCallback={handleNextStepCallback}/>
}

export default LoginFlow;

interface AskForLoginCredentialsOptions {
  nextStepCallback: (step: FlowStep) => void;
}

function AskForLoginCredentials({nextStepCallback}: AskForLoginCredentialsOptions) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");

  function handleUsernameOnChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUsername(e.target.value);
  }

  function handlePasswordOnChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
  }

  async function handleSubmit(event: React.FormEvent<EventTarget>) {
    event.preventDefault();

    console.log({ username, password });

    const res = await axios.post("http://localhost:7878/auth", {
      username,
      password
    });

    console.log({ res });

    if (res.data?.error_code === 3011) {
      nextStepCallback(FlowStep.TWO_FA_TOKEN);
      return;
    } else if (res.data?.error_code === 3022) {
      nextStepCallback(FlowStep.TWITCHGUARD_CODE);
      return;
    } else {
      setLoginErr(res.data?.error_description);
    }
  }

  return (
    <Container>
      <h1 style={{ marginBottom: px2em(43)}}>
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
        {loginErr && <p style={{color: 'orange'}}>{loginErr}</p>}
        <Button
          type="submit"
          text="Login"
          width="300px"
          disabled={false}
          onClick={handleSubmit}
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
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

function AskForTwitchguardCode() {
  return (
    <Container>
      <h1 style={{ marginBottom: px2em(43)}}>
        Enter the verification code sent you to
      </h1>
    </Container>
  )
}

function AskForTwoFaToken() {
  return (
    <Container>
      <h1 style={{ marginBottom: px2em(43)}}>
        Enter the code found in your authenticator app
      </h1>
    </Container>
  )
}
