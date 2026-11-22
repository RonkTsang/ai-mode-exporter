import { useEffect, useRef, useState } from 'react'
import { Box, Button, Checkbox, Collapsible, Dialog, Flex, Image, Menu, Stack, Text } from '@chakra-ui/react'
import { browser } from 'wxt/browser'
import { i18n } from '#i18n'
import { aiModeTargetIds, aiModeTargets, isAiModeTarget, type AiModeTarget } from '@/common/aiModeTargets'
import { AI_MODE_POPUP_OPEN_EVENT, AI_MODE_TRANSFER_MESSAGE } from '@/common/aiModeTransfer'
import { formatAiModeTranscript, readAiModeConversation, type AiModeConversation, type AiModeTurn } from './dom'
import chatgptLogo from './logos/chatgpt.png?inline'
import geminiLogo from './logos/gemini.png?inline'

const targetLogos: Record<AiModeTarget, string> = { gemini: geminiLogo, chatgpt: chatgptLogo }

function TurnPreview({ turn, selected, onSelect }: {
  turn: AiModeTurn
  selected: boolean
  onSelect: (checked: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const answerSummary = turn.answer
    .replace(/\[([^\]]+)\]\(<[^>]+>\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/^#{3,6}\s+/gm, '')

  return (
    <Box borderWidth="1px" borderColor="border" rounded="lg" p={{ base: '3', md: '4' }}>
      <Checkbox.Root
        size="md"
        alignItems="start"
        gap="3"
        width="full"
        checked={selected}
        onCheckedChange={({ checked }) => onSelect(checked === true)}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control flexShrink="0" />
        <Checkbox.Label fontWeight="semibold" overflowWrap="anywhere">
          {turn.question}
        </Checkbox.Label>
      </Checkbox.Root>
      <Collapsible.Root open={expanded} onOpenChange={({ open }) => setExpanded(open)} ms="8" mt="2">
        <Collapsible.Trigger asChild>
          <Button variant="ghost" size="xs" ms="-2" gap="1.5" color="fg.muted">
            <Box asChild transform={expanded ? 'rotate(180deg)' : undefined}>
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="m4.5 6.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Box>
            {i18n.t(expanded ? 'aiModeContinue.collapseAnswer' : 'aiModeContinue.expandAnswer')}
          </Button>
        </Collapsible.Trigger>
        {!expanded && (
          <Text mt="1" textStyle="sm" color="fg.muted" lineClamp={2} overflowWrap="anywhere">
            {answerSummary}
          </Text>
        )}
        <Collapsible.Content _motionReduce={{ animation: 'none' }}>
          <Text mt="1" textStyle="sm" color="fg.muted" whiteSpace="pre-wrap" overflowWrap="anywhere">
            {turn.answer}
          </Text>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  )
}

export function ContinueDialog({ main, showEntry = true }: { main: HTMLElement; showEntry?: boolean }) {
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [conversation, setConversation] = useState<AiModeConversation>({ title: '', turns: [], hasUnreadableTurns: false })
  const [selection, setSelection] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const title = i18n.t('aiModeContinue.title')
  const { title: conversationTitle, turns, hasUnreadableTurns } = conversation
  const showConversationTitle = conversationTitle && conversationTitle !== turns[0]?.question.replace(/\s+/g, ' ')
  const allSelected = turns.length > 0 && selection.size === turns.length

  function openPreview() {
    const current = readAiModeConversation(main)
    setConversation(current)
    setSelection(new Set(current.turns.map(turn => turn.number)))
    setFailed(false)
    setOpen(true)
  }

  useEffect(() => {
    window.addEventListener(AI_MODE_POPUP_OPEN_EVENT, openPreview)
    return () => window.removeEventListener(AI_MODE_POPUP_OPEN_EVENT, openPreview)
  }, [main])

  function selectTurn(number: number, checked: boolean) {
    setSelection(previous => {
      const next = new Set(previous)
      if (checked) next.add(number)
      else next.delete(number)
      return next
    })
  }

  async function continueIn(target: AiModeTarget) {
    const selected = turns.filter(turn => selection.has(turn.number))
    if (busy || selected.length === 0) return

    setBusy(true)
    setFailed(false)
    try {
      const opened = await browser.runtime.sendMessage({
        type: AI_MODE_TRANSFER_MESSAGE,
        target,
        title: conversationTitle,
        text: formatAiModeTranscript({ title: conversationTitle, turns: selected }),
      })
      if (opened === true) setOpen(false)
      else setFailed(true)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {showEntry && <Flex justify="flex-end" mb="2">
        <Button
          ref={trigger}
          size="sm"
          variant="outline"
          bg="bg/72"
          color="fg"
          borderColor="border/75"
          backdropFilter="blur(12px)"
          pointerEvents="auto"
          rounded="full"
          _hover={{ bg: 'bg/86' }}
          _expanded={{ bg: 'bg/86' }}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={openPreview}
        >
          {i18n.t('aiModeContinue.entry')}
        </Button>
      </Flex>}
      <Dialog.Root
        open={open}
        onOpenChange={({ open: nextOpen }) => {
          if (!busy && !nextOpen) setOpen(false)
        }}
        finalFocusEl={() => trigger.current}
        closeOnInteractOutside={!busy}
        closeOnEscape={!busy}
        scrollBehavior="inside"
        size={{ base: 'full', sm: 'lg' }}
        placement="center"
        lazyMount
        unmountOnExit
      >
        <Dialog.Backdrop pointerEvents="auto" zIndex="2147483000" _motionReduce={{ animation: 'none' }} />
        <Dialog.Positioner zIndex="2147483001" px={{ sm: '4', md: '6' }}>
          <Dialog.Content
            minH={{ base: '100dvh', sm: '0' }}
            maxH={{ base: '100dvh', sm: 'calc(100dvh - 2rem)', md: 'calc(100dvh - 3rem)' }}
            rounded={{ base: 'none', sm: 'xl' }}
            pointerEvents="auto"
            _motionReduce={{ animation: 'none' }}
          >
            <Dialog.Header flexDirection="column" gap="2" px={{ base: '4', md: '8' }} pt={{ base: '5', md: '7' }} pb={{ base: '4', md: '5' }}>
              <Dialog.Title textStyle={{ base: 'xl', md: '2xl' }}>{title}</Dialog.Title>
              {showConversationTitle && (
                <Text textStyle="sm" color="fg.muted" lineClamp={2} overflowWrap="anywhere">{conversationTitle}</Text>
              )}
            </Dialog.Header>
            <Dialog.Body
              minH="0"
              px={{ base: '4', md: '8' }}
              pt="0"
              pb={{ base: '4', md: '6' }}
              overscrollBehaviorY="contain"
            >
              {hasUnreadableTurns && (
                <Text role="status" color="fg.muted" mb={turns.length ? '3' : '0'}>
                  {i18n.t('aiModeContinue.unreadableTurns')}
                </Text>
              )}
              {turns.length === 0 ? (
                !hasUnreadableTurns && <Text color="fg.muted">{i18n.t('aiModeContinue.noTurns')}</Text>
              ) : (
                <Stack gap="4">
                  <Dialog.Description>{i18n.t('aiModeContinue.description')}</Dialog.Description>
                  <Flex align="center" justify="space-between" wrap="wrap" gap="2" bg="bg.subtle" rounded="md" px={{ base: '3', md: '4' }} py="2.5">
                    <Checkbox.Root
                      size="md"
                      gap="3"
                      checked={allSelected || (selection.size > 0 && 'indeterminate')}
                      onCheckedChange={() => setSelection(new Set(allSelected ? [] : turns.map(turn => turn.number)))}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label>{i18n.t('aiModeContinue.selectAll')}</Checkbox.Label>
                    </Checkbox.Root>
                    <Text textStyle="sm" color="fg.muted" fontVariantNumeric="tabular-nums" aria-live="polite">
                      {i18n.t('aiModeContinue.selectionCount', [String(selection.size), String(turns.length)])}
                    </Text>
                  </Flex>
                  {turns.map(turn => (
                    <TurnPreview
                      key={turn.number}
                      turn={turn}
                      selected={selection.has(turn.number)}
                      onSelect={checked => selectTurn(turn.number, checked)}
                    />
                  ))}
                </Stack>
              )}
            </Dialog.Body>
            <Dialog.Footer
              flexWrap="wrap"
              flexShrink="0"
              px={{ base: '4', md: '8' }}
              py="4"
              borderTopWidth="1px"
              borderColor="border"
            >
              {failed && <Text role="alert" width="full" color="fg.error" fontSize="sm">{i18n.t('aiModeContinue.transferFailed')}</Text>}
              <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>
                {i18n.t('common.cancel')}
              </Button>
              <Menu.Root
                positioning={{ placement: 'top-end', gutter: 8 }}
                onSelect={({ value }) => {
                  if (isAiModeTarget(value)) void continueIn(value)
                }}
              >
                <Menu.Trigger asChild>
                  <Button disabled={busy || selection.size === 0} loading={busy}>
                    {i18n.t('aiModeContinue.continueIn')}
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="m4.5 6.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Button>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content
                    bg="bg.panel"
                    borderWidth="1px"
                    borderColor="border"
                    rounded="xl"
                    shadow="lg"
                    p="1.5"
                    minW="44"
                    _motionReduce={{ animation: 'none' }}
                  >
                    {aiModeTargetIds.map(target => (
                      <Menu.Item key={target} value={target} py="2" px="2.5" gap="2.5" rounded="lg" cursor="pointer">
                        <Image src={targetLogos[target]} alt="" boxSize="6" objectFit="contain" />
                        <Text fontWeight="medium">{aiModeTargets[target].name}</Text>
                      </Menu.Item>
                    ))}
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  )
}
