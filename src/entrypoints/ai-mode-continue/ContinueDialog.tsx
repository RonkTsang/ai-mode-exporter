import { useRef, useState } from 'react'
import { Box, Button, Checkbox, Collapsible, Dialog, Flex, Stack, Text } from '@chakra-ui/react'
import { browser } from 'wxt/browser'
import { i18n } from '#i18n'
import { AI_MODE_TRANSFER_MESSAGE } from '@/common/aiModeTransfer'
import { formatAiModeTranscript, readAiModeConversation, type AiModeConversation, type AiModeTurn } from './dom'

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
    <Box borderWidth="1px" borderColor="border" rounded="lg" p="3">
      <Checkbox.Root alignItems="start" checked={selected} onCheckedChange={({ checked }) => onSelect(checked === true)}>
        <Checkbox.HiddenInput />
        <Checkbox.Control mt="0.5" />
        <Checkbox.Label fontSize="sm" fontWeight="medium" overflowWrap="anywhere">
          {turn.question}
        </Checkbox.Label>
      </Checkbox.Root>
      <Collapsible.Root open={expanded} onOpenChange={({ open }) => setExpanded(open)} ms="6" mt="1.5">
        <Collapsible.Trigger asChild>
          <Button variant="ghost" size="xs" ms="-2" color="fg.muted">
            {i18n.t(expanded ? 'aiModeContinue.collapseAnswer' : 'aiModeContinue.expandAnswer')}
          </Button>
        </Collapsible.Trigger>
        {!expanded && (
          <Text fontSize="sm" color="fg.muted" lineClamp={2} overflowWrap="anywhere">
            {answerSummary}
          </Text>
        )}
        <Collapsible.Content _motionReduce={{ animation: 'none' }}>
          <Text fontSize="sm" color="fg.muted" whiteSpace="pre-wrap" overflowWrap="anywhere">
            {turn.answer}
          </Text>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  )
}

export function ContinueDialog({ plate }: { plate: HTMLElement }) {
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [conversation, setConversation] = useState<AiModeConversation>({ title: '', turns: [] })
  const [selection, setSelection] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const title = i18n.t('aiModeContinue.title')
  const { title: conversationTitle, turns } = conversation
  const allSelected = turns.length > 0 && selection.size === turns.length

  function openPreview() {
    const current = readAiModeConversation(plate)
    setConversation(current)
    setSelection(new Set(current.turns.map(turn => turn.number)))
    setFailed(false)
    setOpen(true)
  }

  function selectTurn(number: number, checked: boolean) {
    setSelection(previous => {
      const next = new Set(previous)
      if (checked) next.add(number)
      else next.delete(number)
      return next
    })
  }

  async function continueInGemini() {
    const selected = turns.filter(turn => selection.has(turn.number))
    if (busy || selected.length === 0) return

    setBusy(true)
    setFailed(false)
    try {
      const opened = await browser.runtime.sendMessage({
        type: AI_MODE_TRANSFER_MESSAGE,
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
      <Flex justify="flex-end" mb="2">
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
          {title}
        </Button>
      </Flex>
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
        <Dialog.Positioner zIndex="2147483001">
          <Dialog.Content
            minH={{ base: '100dvh', sm: '0' }}
            maxH={{ base: '100dvh', sm: 'calc(100dvh - 4rem)' }}
            rounded={{ base: 'none', sm: 'xl' }}
            pointerEvents="auto"
            _motionReduce={{ animation: 'none' }}
          >
            <Dialog.Header flexDirection="column" gap="1">
              <Dialog.Title>{title}</Dialog.Title>
              {conversationTitle && (
                <Text fontWeight="medium" lineClamp={2} overflowWrap="anywhere">{conversationTitle}</Text>
              )}
              <Dialog.Description color="fg.muted">
                {i18n.t('aiModeContinue.description')}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              {turns.length === 0 ? (
                <Text color="fg.muted">{i18n.t('aiModeContinue.noTurns')}</Text>
              ) : (
                <Stack gap="3">
                  <Flex align="center" justify="space-between" gap="2">
                    <Checkbox.Root
                      checked={allSelected || (selection.size > 0 && 'indeterminate')}
                      onCheckedChange={() => setSelection(new Set(allSelected ? [] : turns.map(turn => turn.number)))}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label>{i18n.t('aiModeContinue.selectAll')}</Checkbox.Label>
                    </Checkbox.Root>
                    <Text fontSize="sm" color="fg.muted" aria-live="polite">
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
            <Dialog.Footer flexWrap="wrap">
              {failed && <Text role="alert" width="full" color="fg.error" fontSize="sm">{i18n.t('aiModeContinue.transferFailed')}</Text>}
              <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>
                {i18n.t('common.cancel')}
              </Button>
              <Button onClick={() => void continueInGemini()} disabled={selection.size === 0} loading={busy}>
                {title}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  )
}
