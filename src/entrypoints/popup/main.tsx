import { Box, Heading } from '@chakra-ui/react'
import { createRoot } from 'react-dom/client'
import { Provider } from '@/components/ui/provider-shadow-dom'

createRoot(document.getElementById('root')!).render(
  <Provider>
    <Box bg="bg" color="fg" minW="16rem" p="4">
      <Heading as="h1" size="md">AI Mode Enchance</Heading>
    </Box>
  </Provider>,
)
