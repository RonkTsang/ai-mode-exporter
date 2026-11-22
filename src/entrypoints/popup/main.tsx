import { Heading, HStack, Icon, Image, Link, Stack } from '@chakra-ui/react'
import { createRoot } from 'react-dom/client'
import { browser } from 'wxt/browser'
import { i18n } from '#i18n'
import { Provider } from '@/components/ui/provider-shadow-dom'
import { Tooltip } from '@/components/ui/tooltip'
import { AskAiModeForm } from './AskAiModeForm'
import { ContinueCurrentAiMode } from './ContinueCurrentAiMode'
import GitHubLogo from './logos/github.svg?react'
import koFiLogo from './logos/ko-fi.webp?inline'

document.documentElement.lang = browser.i18n.getUILanguage()

createRoot(document.getElementById('root')!).render(
  <Provider>
    <Stack as="main" bg="bg" color="fg" w="22rem" gap="0" p="4">
      <Heading as="h1" size="sm" mb="3">AI Mode Power Kit</Heading>
      <AskAiModeForm />
      <ContinueCurrentAiMode />
      <HStack as="footer" justify="flex-end" gap="1" mt="6">
        <Tooltip
          content={i18n.t('popup.supportTooltip') || 'A little caffeine for the next update ☕'}
          positioning={{ placement: 'top', gutter: 4 }}
          portalled={false}
          interactive
          openDelay={250}
          showArrow
        >
          <Link
            href="https://ko-fi.com/ronktsang"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={i18n.t('popup.supportDeveloper') || 'Ko-fi'}
            boxSize="6"
            justifyContent="center"
            rounded="md"
            _hover={{ bg: 'bg.muted' }}
          >
            <Image src={koFiLogo} boxSize="4" alt="" />
          </Link>
        </Tooltip>
        <Tooltip
          content="GitHub"
          positioning={{ placement: 'top', gutter: 4 }}
          portalled={false}
          interactive
          openDelay={250}
          showArrow
        >
          <Link
            href="https://github.com/RonkTsang/ai-mode-power-kit"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            boxSize="6"
            justifyContent="center"
            rounded="md"
            _hover={{ bg: 'bg.muted' }}
          >
            <Icon asChild boxSize="3.5" color="fg">
              <GitHubLogo aria-hidden="true" fill="currentColor" />
            </Icon>
          </Link>
        </Tooltip>
      </HStack>
    </Stack>
  </Provider>,
)
