import { Heading, HStack, Icon, Image, Link, Stack } from '@chakra-ui/react'
import { createRoot } from 'react-dom/client'
import { browser } from 'wxt/browser'
import { i18n } from '#i18n'
import { getSupportUrl } from '@/common/supportLinks'
import { Provider } from '@/components/ui/provider-shadow-dom'
import { Tooltip } from '@/components/ui/tooltip'
import { AskAiModeForm } from './AskAiModeForm'
import { ContinueCurrentAiMode } from './ContinueCurrentAiMode'
import GitHubLogo from './logos/github.svg?react'
import koFiLogo from './logos/ko-fi.webp?inline'

const uiLanguage = browser.i18n.getUILanguage()
const helpLabel = i18n.t('aiModeContinue.help')
document.documentElement.lang = uiLanguage

createRoot(document.getElementById('root')!).render(
  <Provider>
    <Stack as="main" bg="bg" color="fg" w="22rem" gap="0" p="4">
      <Heading as="h1" size="sm" mb="3">AI Mode Exporter</Heading>
      <AskAiModeForm />
      <ContinueCurrentAiMode />
      <HStack as="footer" gap="1" mt="6">
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
            href="https://github.com/RonkTsang/ai-mode-exporter"
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
        <Tooltip
          content={helpLabel}
          positioning={{ placement: 'top-end', gutter: 4 }}
          portalled={false}
          interactive
          openDelay={250}
          showArrow
        >
          <Link
            href={getSupportUrl(uiLanguage)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={helpLabel}
            boxSize="6"
            ms="auto"
            justifyContent="center"
            rounded="md"
            color="fg.muted"
            _hover={{ bg: 'bg.muted' }}
          >
            <Icon asChild boxSize="4">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9.5a2.5 2.5 0 1 1 3.8 2.1c-.8.5-1.3 1-1.3 2.4m0 2.5h.01" />
              </svg>
            </Icon>
          </Link>
        </Tooltip>
      </HStack>
    </Stack>
  </Provider>,
)
