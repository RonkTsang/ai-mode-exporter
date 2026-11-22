import { Field, Flex, IconButton, Text, Textarea, defineStyle } from '@chakra-ui/react'
import { useId, useState, type KeyboardEvent, type SubmitEvent } from 'react'
import { flushSync } from 'react-dom'
import { browser } from 'wxt/browser'
import { i18n } from '#i18n'
import { getAiModeSearchUrl } from '@/common/aiModeTransfer'

const logoColors = {
  red: '#ff3946',
  blue: '#2659ff',
  cyan: '#00b5ff',
  green: '#0bd574',
  yellow: '#ffd451',
}

const promptFrame = defineStyle({
  bg: 'bg',
  border: '1px solid',
  borderColor: 'border.emphasized',
  '@media (forced-colors: none)': {
    // Follow the v2 logo from red at the top left through blue, cyan, and green.
    borderColor: 'transparent',
    background: [
      'linear-gradient(var(--chakra-colors-bg), var(--chakra-colors-bg)) padding-box',
      `conic-gradient(from -50deg, ${logoColors.red}, ${logoColors.blue} 23%, ${logoColors.cyan} 49%, ${logoColors.green} 69%, ${logoColors.yellow} 86%, ${logoColors.red}) border-box`,
    ].join(', '),
    boxShadow: '-3px -2px 10px rgb(255 57 70 / 0.13), 4px 0 12px rgb(38 89 255 / 0.17), -2px 4px 10px rgb(11 213 116 / 0.14)',
  },
  '@media (forced-colors: active)': {
    '&:has(textarea:focus-visible)': { borderColor: 'Highlight' },
  },
})

const maxPromptRows = 6

export function AskAiModeForm() {
  const [query, setQuery] = useState('')
  const [opening, setOpening] = useState(false)
  const [openFailed, setOpenFailed] = useState(false)
  const searchGradientId = useId()
  const trimmedQuery = query.trim()
  const rows = Math.min(query.split('\n').length, maxPromptRows)
  const multiline = rows > 1
  const prompt = i18n.t('askAiMode.prompt')

  function handlePromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || event.keyCode === 229) return

    event.preventDefault()
    const textarea = event.currentTarget
    if (event.metaKey || event.ctrlKey) {
      const { value, selectionStart, selectionEnd } = textarea
      // Restore the caret after React commits the newline to the textarea.
      flushSync(() => setQuery(value.slice(0, selectionStart) + '\n' + value.slice(selectionEnd)))
      textarea.setSelectionRange(selectionStart + 1, selectionStart + 1)
    } else if (!event.repeat) {
      textarea.form?.requestSubmit()
    }
  }

  async function openAiMode(event: SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!trimmedQuery || opening) return

    setOpening(true)
    setOpenFailed(false)
    try {
      await browser.tabs.create({ url: getAiModeSearchUrl(trimmedQuery) })
      window.close()
    } catch {
      setOpenFailed(true)
      setOpening(false)
    }
  }

  return (
    <search>
      <form onSubmit={openAiMode}>
        <Field.Root gap="3">
          <Field.Label srOnly>{prompt}</Field.Label>
          <Flex
            css={promptFrame}
            align={multiline ? 'end' : 'center'}
            gap="1"
            w="full"
            p="1"
            rounded={multiline ? 'xl' : 'full'}
          >
            <Textarea
              unstyled
              name="q"
              autoFocus
              enterKeyHint="search"
              placeholder={prompt}
              value={query}
              onChange={({ target }) => {
                setQuery(target.value)
                setOpenFailed(false)
              }}
              onKeyDown={handlePromptKeyDown}
              rows={rows}
              wrap={multiline ? 'soft' : 'off'}
              resize="none"
              flex="1"
              minW="0"
              h="auto"
              maxH={`calc(${maxPromptRows}lh + var(--chakra-spacing-4))`}
              px="3"
              py="2"
              bg="transparent"
              border="0"
              fontSize="md"
              lineHeight="1.5"
              outline="none"
              _placeholder={{ color: 'fg.muted' }}
              overflowY={multiline ? 'auto' : 'hidden'}
              css={multiline ? { fieldSizing: 'content' } : { overflowX: 'hidden' }}
            />
            <IconButton
              type="submit"
              aria-label={i18n.t('askAiMode.search')}
              disabled={!trimmedQuery || opening}
              variant="plain"
              color="fg"
              flexShrink="0"
              size="sm"
              rounded="full"
              transitionProperty="none"
              _hover={{
                bg: 'fg/10',
                '@media (forced-colors: none)': {
                  '& svg': { stroke: `url(#${searchGradientId}) currentColor` },
                },
              }}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <defs>
                  <linearGradient id={searchGradientId} gradientUnits="userSpaceOnUse" x1="4" y1="4" x2="20" y2="20">
                    <stop offset="0%" stopColor={logoColors.red} />
                    <stop offset="45%" stopColor={logoColors.blue} />
                    <stop offset="70%" stopColor={logoColors.cyan} />
                    <stop offset="100%" stopColor={logoColors.green} />
                  </linearGradient>
                </defs>
                <circle cx="11" cy="11" r="6" />
                <path d="m16 16 4 4" />
              </svg>
            </IconButton>
          </Flex>
          {openFailed && <Text role="alert" fontSize="sm" color="fg.error">{i18n.t('askAiMode.openFailed')}</Text>}
        </Field.Root>
      </form>
    </search>
  )
}
