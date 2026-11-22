import { keyframes } from '@emotion/react'
import { Box, Button, Flex, Image, Separator, Stack, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { browser } from 'wxt/browser'
import { i18n } from '#i18n'
import { aiModeTargets } from '@/common/aiModeTargets'
import {
  AI_MODE_POPUP_OPEN_MESSAGE,
  AI_MODE_POPUP_STATUS_MESSAGE,
} from '@/common/aiModeTransfer'
import chatgptLogo from '../ai-mode-continue/logos/chatgpt.png?inline'
import geminiLogo from '../ai-mode-continue/logos/gemini.png?inline'

const rotateDestinations = keyframes`
  0%, 40% { transform: translateY(0); }
  50%, 90% { transform: translateY(calc(0px - var(--chakra-spacing-6))); }
  100% { transform: translateY(calc(0px - var(--chakra-spacing-6) - var(--chakra-spacing-6))); }
`

function DestinationCarousel() {
  return (
    <Box
      as="span"
      h="6"
      minW="5.5rem"
      flexShrink="0"
      overflow="clip"
      aria-hidden="true"
      css={{
        '@media (prefers-reduced-motion: no-preference)': {
          '.destination-carousel-button:hover &, .destination-carousel-button:focus-visible &': {
            animationPlayState: 'paused',
          },
        },
      }}
    >
      <Stack
        as="span"
        gap="0"
        css={{
          '@media (prefers-reduced-motion: no-preference)': {
            animation: `${rotateDestinations} 4.8s ease-in-out infinite`,
          },
        }}
      >
        <Destination name={aiModeTargets.gemini.name} logo={geminiLogo} />
        <Destination name={aiModeTargets.chatgpt.name} logo={chatgptLogo} />
        <Destination name={aiModeTargets.gemini.name} logo={geminiLogo} />
      </Stack>
    </Box>
  )
}

function Destination({ name, logo }: { name: string; logo: string }) {
  return (
    <Flex as="span" h="6" flexShrink="0" align="center" gap="1.5">
      <Image src={logo} alt="" boxSize="4" objectFit="contain" />
      <Text as="span" whiteSpace="nowrap">{name}</Text>
    </Flex>
  )
}

export function ContinueCurrentAiMode() {
  const [available, setAvailable] = useState(false)
  const [failed, setFailed] = useState(false)
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    async function checkActiveTab(): Promise<void> {
      try {
        const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true })
        if (!tab || tab.id === undefined) return
        const isAiMode = await browser.tabs.sendMessage(tab.id, { type: AI_MODE_POPUP_STATUS_MESSAGE })
        setAvailable(isAiMode === true)
      } catch {
        setAvailable(false)
      }
    }

    void checkActiveTab()
  }, [])

  async function openContinueDialog(): Promise<void> {
    if (opening) return
    setOpening(true)
    setFailed(false)
    try {
      const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true })
      if (!tab || tab.id === undefined) throw new Error('No active tab')
      const opened = await browser.tabs.sendMessage(tab.id, { type: AI_MODE_POPUP_OPEN_MESSAGE })
      if (opened !== true) throw new Error('AI Mode page is unavailable')
      window.close()
    } catch {
      setFailed(true)
      setOpening(false)
    }
  }

  if (!available && !failed) return null

  return (
    <Stack mt="1.375rem" gap="0">
      {available && (
        <>
          <Separator mb="1.125rem" borderColor="border" />
          <Button
            variant="ghost"
            size="sm"
            w="full"
            h="auto"
            minH="9"
            px="2"
            py="1"
            gap="2"
            bg="bg.muted"
            rounded="lg"
            justifyContent="space-between"
            fontSize="0.8125rem"
            lineHeight="1.25rem"
            _hover={{ bg: 'bg.emphasized' }}
            className="destination-carousel-button"
            loading={opening}
            aria-label={i18n.t('popup.continueAccessible')}
            onClick={() => void openContinueDialog()}
          >
            <Text as="span" minW="0" textAlign="start" whiteSpace="normal" overflowWrap="anywhere">
              {i18n.t('popup.continueInCurrentTab')}
            </Text>
            <DestinationCarousel />
          </Button>
        </>
      )}
      {failed && <Text role="alert" mt="3" fontSize="sm" color="fg.error">{i18n.t('popup.continueFailed')}</Text>}
    </Stack>
  )
}
