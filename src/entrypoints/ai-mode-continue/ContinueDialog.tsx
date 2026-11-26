import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Box, Button, Checkbox, Collapsible, Dialog, Flex, Image, Menu, Portal, Stack, Text } from '@chakra-ui/react'
import { browser } from 'wxt/browser'
import { i18n } from '#i18n'
import { AI_MODE_PRINT_MESSAGE, readAiModePrintImageSources } from '@/common/aiModePrint'
import { aiModeTargetIds, aiModeTargets, type AiModeTarget } from '@/common/aiModeTargets'
import { AI_MODE_POPUP_OPEN_EVENT, AI_MODE_TRANSFER_MESSAGE, getAiModeAttachmentFilename } from '@/common/aiModeTransfer'
import { AnswerPreview } from './AnswerPreview'
import { formatAiModeTranscript, readAiModeConversation, type AiModeConversation, type AiModeTurn } from './dom'
import chatgptLogo from './logos/chatgpt.png?inline'
import geminiLogo from './logos/gemini.png?inline'

const targetLogos: Record<AiModeTarget, string> = { gemini: geminiLogo, chatgpt: chatgptLogo }
type ActionFeedback = 'copied' | 'copyFailed' | 'saveFailed' | 'printFailed' | 'transferFailed'

function TurnPreview({ turn, selected, onSelect }: {
  turn: AiModeTurn
  selected: boolean
  onSelect: (checked: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)

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
      <Collapsible.Root open={expanded} onOpenChange={({ open }) => setExpanded(open)} ms="8" mt="2" lazyMount unmountOnExit>
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
        {!expanded && <AnswerPreview markdown={turn.answer} summary />}
        <Collapsible.Content _motionReduce={{ animation: 'none' }}>
          <AnswerPreview markdown={turn.answer} imageSources={turn.previewImageSources} />
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  )
}

export function ContinueDialog({ main, showEntry = true }: { main: HTMLElement; showEntry?: boolean }) {
  const trigger = useRef<HTMLButtonElement>(null)
  const dialogContent = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [conversation, setConversation] = useState<AiModeConversation>({ title: '', turns: [], hasUnreadableTurns: false })
  const [selection, setSelection] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null)
  const title = i18n.t('aiModeContinue.title')
  const { title: conversationTitle, turns, hasUnreadableTurns } = conversation
  const showConversationTitle = conversationTitle && conversationTitle !== turns[0]?.question.replace(/\s+/g, ' ')
  const allSelected = turns.length > 0 && selection.size === turns.length

  function openPreview() {
    const current = readAiModeConversation(main)
    setConversation(current)
    setSelection(new Set(current.turns.map(turn => turn.number)))
    setFeedback(null)
    setOpen(true)
  }

  useEffect(() => {
    window.addEventListener(AI_MODE_POPUP_OPEN_EVENT, openPreview)
    return () => window.removeEventListener(AI_MODE_POPUP_OPEN_EVENT, openPreview)
  }, [main])

  useLayoutEffect(() => {
    // The search box creates a stacking context below Google's side panels.
    if (open) overlay.current?.showPopover?.()
  }, [open])

  function selectTurn(number: number, checked: boolean) {
    setFeedback(null)
    setSelection(previous => {
      const next = new Set(previous)
      if (checked) next.add(number)
      else next.delete(number)
      return next
    })
  }

  function selectedTranscript(): string | null {
    if (busy) return null
    const selected = turns.filter(turn => selection.has(turn.number))
    return selected.length ? formatAiModeTranscript({ title: conversationTitle, turns: selected }) : null
  }

  async function copyTranscript() {
    const text = selectedTranscript()
    if (!text) return

    setFeedback(null)
    try {
      await navigator.clipboard.writeText(text)
      setFeedback('copied')
    } catch {
      setFeedback('copyFailed')
    }
  }

  function saveMarkdown() {
    const text = selectedTranscript()
    if (!text) return

    setFeedback(null)
    try {
      const link = document.createElement('a')
      link.download = getAiModeAttachmentFilename(conversationTitle, crypto.randomUUID())
      const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }))
      // Give the browser time to start reading the Blob before releasing its URL.
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      link.href = url
      link.click()
    } catch {
      setFeedback('saveFailed')
    }
  }

  async function openPdfPreview() {
    if (busy) return
    const selected = turns.filter(turn => selection.has(turn.number))
    if (!selected.length) return
    const text = formatAiModeTranscript({ title: conversationTitle, turns: selected })
    const imageSources = readAiModePrintImageSources(selected.flatMap(turn => [...turn.previewImageSources ?? []]))

    setBusy(true)
    setFeedback(null)
    try {
      const opened = await browser.runtime.sendMessage({ type: AI_MODE_PRINT_MESSAGE, title: conversationTitle, text, imageSources })
      if (opened !== true) setFeedback('printFailed')
    } catch {
      setFeedback('printFailed')
    } finally {
      setBusy(false)
    }
  }

  async function continueIn(target: AiModeTarget) {
    const text = selectedTranscript()
    if (!text) return

    setBusy(true)
    setFeedback(null)
    try {
      const opened = await browser.runtime.sendMessage({
        type: AI_MODE_TRANSFER_MESSAGE,
        target,
        title: conversationTitle,
        text,
      })
      if (opened === true) setOpen(false)
      else setFeedback('transferFailed')
    } catch {
      setFeedback('transferFailed')
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
      <Box
        ref={overlay}
        popover="manual"
        position="fixed"
        inset="0"
        w="auto"
        h="auto"
        m="0"
        p="0"
        borderWidth="0"
        bg="transparent"
        color="inherit"
        overflow="visible"
        pointerEvents="none"
      >
        <Dialog.Root
          open={open}
          onOpenChange={({ open: nextOpen }) => {
            if (!busy && !nextOpen) setOpen(false)
          }}
          onExitComplete={() => {
            if (!open) overlay.current?.hidePopover?.()
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
              ref={dialogContent}
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
                      onCheckedChange={() => {
                        setFeedback(null)
                        setSelection(new Set(allSelected ? [] : turns.map(turn => turn.number)))
                      }}
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
              <Text role="status" width="full" color="fg.muted" fontSize="sm" srOnly={feedback !== 'copied'}>
                {feedback === 'copied' ? i18n.t('aiModeContinue.copied') : ''}
              </Text>
              {feedback && feedback !== 'copied' && (
                <Text role="alert" width="full" color="fg.error" fontSize="sm">
                  {i18n.t(`aiModeContinue.${feedback}`)}
                </Text>
              )}
                <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>
                  {i18n.t('common.cancel')}
                </Button>
              <Menu.Root positioning={{ placement: 'top-end', strategy: 'fixed', gutter: 8, hideWhenDetached: true }}>
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
                    <Menu.Item value="copy" minH="10" px="2.5" gap="2.5" rounded="lg" cursor="pointer" onSelect={() => void copyTranscript()}>
                      <Box asChild boxSize="6" flexShrink="0" color="fg.muted">
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
                          <path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
                        </svg>
                      </Box>
                      <Text fontWeight="medium">{i18n.t('aiModeContinue.copy')}</Text>
                    </Menu.Item>
                    <Menu.Root
                      positioning={{
                        placement: 'right-start',
                        strategy: 'fixed',
                        gutter: 4,
                        flip: ['left-start', 'top-start', 'bottom-start'],
                        hideWhenDetached: true,
                      }}
                    >
                      <Menu.TriggerItem minH="10" px="2.5" gap="2.5" rounded="lg" cursor="pointer">
                        <Box asChild boxSize="6" flexShrink="0" color="fg.muted">
                          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 4.5v10m-4-4 4 4 4-4M5 15v2.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V15" />
                          </svg>
                        </Box>
                        <Text flex="1" fontWeight="medium">{i18n.t('aiModeContinue.saveAs')}</Text>
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="m6.5 4.5 3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Menu.TriggerItem>
                      <Portal container={dialogContent}>
                        <Menu.Positioner>
                          <Menu.Content borderWidth="1px" borderColor="border" rounded="xl" _motionReduce={{ animation: 'none' }}>
                            <Menu.Item value="markdown" minH="10" px="2.5" gap="2.5" rounded="lg" cursor="pointer" onSelect={saveMarkdown}>
                              <Box asChild boxSize="6" flexShrink="0" color="fg.muted">
                                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 4.5H7.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9L14 4.5Zm0 0V9h4.5M9 12.5h6M9 16h4" />
                                </svg>
                              </Box>
                              <Text fontWeight="medium">{i18n.t('aiModeContinue.markdown')}</Text>
                            </Menu.Item>
                            <Menu.Item value="pdf" minH="10" px="2.5" gap="2.5" rounded="lg" cursor="pointer" onSelect={() => void openPdfPreview()}>
                              <Box asChild boxSize="6" flexShrink="0" color="fg.muted">
                                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M7 9V5h10v4M7 16H5a1 1 0 0 1-1-1v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a1 1 0 0 1-1 1h-2M7 13h10v6H7zm10-1h.01" />
                                </svg>
                              </Box>
                              <Text fontWeight="medium">{i18n.t('aiModeContinue.pdf')}</Text>
                            </Menu.Item>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Portal>
                    </Menu.Root>
                    <Menu.Separator />
                      {aiModeTargetIds.map(target => (
                      <Menu.Item key={target} value={target} py="2" px="2.5" gap="2.5" rounded="lg" cursor="pointer" onSelect={() => void continueIn(target)}>
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
      </Box>
    </>
  )
}
