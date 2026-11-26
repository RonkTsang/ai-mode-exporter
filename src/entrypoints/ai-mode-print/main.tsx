import { Box, Button, Flex, Stack, Text, type SystemStyleObject } from '@chakra-ui/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Markdown, { type Components } from 'react-markdown'
import { browser } from 'wxt/browser'
import { i18n } from '#i18n'
import { AI_MODE_PRINT_JOB_PREFIX, readAiModePrintJob, type AiModePrintJob } from '@/common/aiModePrint'
import { createTranscriptImageComponent, isTranscriptImageRow, transcriptMarkdownComponents, transcriptRemarkPlugins } from '@/components/transcriptMarkdown'
import { Provider } from '@/components/ui/provider-shadow-dom'
import { createLogger } from '@/utils/logger'
import './page.css'

const logger = createLogger('AI Mode Print')
const printResourceTimeoutMs = 8_000

const documentStyles: SystemStyleObject = {
  colorScheme: 'light',
  lineHeight: '1.6',
  overflowWrap: 'anywhere',
  '& > * + *, & li > p + p': { marginBlockStart: '0.8em' },
  '& :is(h1, h2, h3, h4, h5, h6)': { lineHeight: '1.3', fontWeight: 'semibold' },
  '& h1': { fontSize: '1.8em', marginBlockEnd: '0.65em' },
  '& h2': { fontSize: '1.35em', marginBlockStart: '1.25em' },
  '& :is(h3, h4, h5, h6)': { fontSize: '1.1em' },
  '& p': { whiteSpace: 'pre-line' },
  '& :is(ol, ul)': { paddingInlineStart: '1.5em' },
  '& ol': { listStyleType: 'decimal' },
  '& ul': { listStyleType: 'disc' },
  '& a': { color: 'blue.700', textDecoration: 'underline' },
  '& a:has(> img)': { display: 'inline-block', maxW: 'full' },
  '& img': { display: 'inline-block', w: 'auto', h: 'auto', maxW: 'full', maxH: '85mm', objectFit: 'contain', verticalAlign: 'middle' },
  '& [data-print-image-row] > *': { marginInlineEnd: '2', marginBlockEnd: '2' },
  '& [data-print-image-row] img': { h: '30mm', maxW: '55mm' },
  '& blockquote': { borderInlineStart: '2px solid', borderColor: 'gray.300', paddingInlineStart: '0.8em' },
  '& pre': { whiteSpace: 'pre-wrap', padding: '0.6em', borderWidth: '1px', borderColor: 'gray.200' },
  '& code': { fontFamily: 'mono', fontSize: '0.92em' },
  '& table': { inlineSize: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '0.92em' },
  '& :is(th, td)': { borderWidth: '1px', borderColor: 'gray.300', padding: '0.4em 0.6em', verticalAlign: 'top' },
  '& th': { fontWeight: 'semibold' },
  '& hr': { borderColor: 'gray.300' },
  '@media print': {
    '& :is(h1, h2, h3, h4, h5, h6)': { breakAfter: 'avoid-page' },
    '& :is(thead, tr)': { breakInside: 'avoid-page' },
    '& :is(p, li)': { orphans: 3, widows: 3 },
  },
}

async function takePrintJob(): Promise<AiModePrintJob | null> {
  const id = location.hash.slice(1)
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id)) return null

  const key = `${AI_MODE_PRINT_JOB_PREFIX}${id}`
  const jobs = await browser.storage.session.get(key)
  const job = readAiModePrintJob(jobs[key])
  await browser.storage.session.remove(key).catch(error => {
    logger.warn('Could not clear PDF preview data', error)
  })
  history.replaceState(null, '', location.pathname)
  return job
}

function PrintPreview({ job }: { job: AiModePrintJob }) {
  const article = useRef<HTMLElement>(null)
  const [ready, setReady] = useState(false)
  const components = useMemo<Components>(() => ({
    ...transcriptMarkdownComponents,
    img: createTranscriptImageComponent(new Map(job.imageSources), 'eager'),
    p: ({ node, ...props }) => <p data-print-image-row={isTranscriptImageRow(node) ? '' : undefined} {...props} />,
  }), [job.imageSources])

  useEffect(() => {
    let active = true
    let timeout: number
    const deadline = new Promise<void>(resolve => { timeout = window.setTimeout(resolve, printResourceTimeoutMs) })
    const images = Array.from(article.current?.querySelectorAll('img') ?? [], image => image.decode())
    void Promise.race([Promise.allSettled([document.fonts.ready, ...images]), deadline]).then(() => {
      if (!active) return
      window.clearTimeout(timeout)
      setReady(true)
      window.print()
    })
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [])

  return (
    <Stack
      as="main"
      minH="100dvh"
      align="center"
      gap="4"
      bg="bg.subtle"
      p="4"
      css={{ '@media print': { display: 'block', minH: '0', p: '0', bg: 'transparent' } }}
    >
      <Flex justify="end" w="full" maxW="50rem" css={{ '@media print': { display: 'none' } }}>
        <Button disabled={!ready} onClick={() => window.print()}>{i18n.t('aiModePrint.savePdf')}</Button>
      </Flex>
      <Box
        as="article"
        ref={article}
        w="full"
        maxW="50rem"
        borderWidth="1px"
        borderColor="gray.200"
        rounded="lg"
        p={{ base: '5', sm: '10' }}
        bg="white"
        color="gray.900"
        fontSize="11pt"
        css={{ ...documentStyles, '@media print': { ...documentStyles['@media print'], maxW: 'none', p: '0', border: '0', rounded: '0' } }}
      >
        <Markdown remarkPlugins={transcriptRemarkPlugins} components={components}>{job.text}</Markdown>
      </Box>
    </Stack>
  )
}

async function renderPrintPage(): Promise<void> {
  const job = await takePrintJob().catch(error => {
    logger.warn('Could not load PDF preview', error)
    return null
  })
  document.documentElement.lang = browser.i18n.getUILanguage()
  document.title = job?.title || i18n.t('aiModePrint.title')
  createRoot(document.getElementById('root')!).render(
    <Provider>
      {job ? <PrintPreview job={job} /> : (
        <Box as="main" bg="bg" color="fg" minH="100dvh" p="6">
          <Text role="alert">{i18n.t('aiModePrint.unavailable')}</Text>
        </Box>
      )}
    </Provider>,
  )
}

void renderPrintPage()
