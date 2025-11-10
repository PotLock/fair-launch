import { Footer } from 'nextra-theme-docs';
import { Anchor, Box } from '@mantine/core';


export const MantineFooter = () => (
  <Box style={{ position: 'relative' }}>
    <Footer>
      {new Date().getFullYear()} © Built with ❤️ by <Anchor href="https://potlock.org" target="_blank">POTLOCK</Anchor>
    </Footer>
  </Box>
);
