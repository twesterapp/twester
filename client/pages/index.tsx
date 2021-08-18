import React from 'react';
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { px2em } from "@/utils";
import styled from 'styled-components';


function Home() {
  function handleSubmit(event: React.FormEvent<EventTarget>) {
    event.preventDefault();
    alert("Login functionality not implemented :(")
  }

  return (
    <Container>
      <h1 style={{marginBottom: px2em(43), lineHeight: '0'}}>Login to your Twitch account to start</h1>
        <Form>
          <Input width="300px" placeholder="Username" style={{marginBottom: px2em(23)}}/>
          <Input width="300px" placeholder="Password" style={{marginBottom: px2em(52)}} password/>
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

export default Home;

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
`
