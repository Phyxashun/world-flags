import { Box, Container, Section } from '@radix-ui/themes';
import React from 'react';
import Flag from './components/Flag';
import './styles/styles.css';

const App: React.FC = () => {
  return (
    <Container size="4">
      <Section p="4">
        <Box>
          <Flag />
        </Box>
      </Section>
    </Container>
  );
};

export default App;
