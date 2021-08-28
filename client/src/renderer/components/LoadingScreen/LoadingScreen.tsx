import React from 'react';
import { Spinner } from 'renderer/ui/Spinner';
import styled from 'styled-components';

export const LoadingScreen = () => {
  return (
    <Container>
      <Spinner size={24} />
    </Container>
  );
};

const Container = styled.div``;
