import { memo, useMemo } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import Markdown, { type Components } from 'react-markdown'
import { toText } from 'hast-util-to-text'
import type { Element, Root } from 'hast'
import { createTranscriptImageComponent, isTranscriptImageRow, transcriptMarkdownComponents, transcriptRemarkPlugins } from '@/components/transcriptMarkdown'

function replaceImagesWithDescriptions(parent: Root | Element): void {
  for (const [index, child] of parent.children.entries()) {
    if (child.type !== 'element') continue
    if (child.tagName === 'img') {
      const { alt } = child.properties
      parent.children[index] = { type: 'text', value: typeof alt === 'string' ? alt : '' }
    } else {
      replaceImagesWithDescriptions(child)
    }
  }
}

function plainTextSummary() {
  return (tree: Root) => {
    replaceImagesWithDescriptions(tree)
    tree.children = [{ type: 'text', value: toText(tree).replace(/\s+/g, ' ').trim() }]
  }
}

const components: Components = {
  ...transcriptMarkdownComponents,
  p: ({ node, children, ...props }) => {
    if (!isTranscriptImageRow(node)) return <p {...props}>{children}</p>

    return (
      <Flex
        as="p"
        data-answer-image-row=""
        tabIndex={0}
        align="center"
        gap="2"
        maxW="full"
        overflowX="auto"
        overscrollBehaviorX="contain"
        scrollSnapType="x proximity"
        p="1"
        {...props}
      >
        {children}
      </Flex>
    )
  },
  table: ({ node: _node, ...props }) => (
    <Box overflowX="auto">
      <table {...props} />
    </Box>
  ),
}

export const AnswerPreview = memo(function AnswerPreview({ markdown, summary = false, imageSources }: {
  markdown: string
  summary?: boolean
  imageSources?: ReadonlyMap<string, string>
}) {
  const previewComponents = useMemo<Components>(() => ({
    ...components,
    img: createTranscriptImageComponent(imageSources, 'lazy'),
  }), [imageSources])

  if (summary) {
    return (
      <Text mt="1" textStyle="sm" color="fg.muted" lineClamp={2} overflowWrap="anywhere">
        <Markdown remarkPlugins={transcriptRemarkPlugins} rehypePlugins={[plainTextSummary]}>{markdown}</Markdown>
      </Text>
    )
  }

  return (
    <Box
      mt="1"
      textStyle="sm"
      lineHeight="relaxed"
      overflowWrap="anywhere"
      css={{
        '& > * + *, & li > p + p': { mt: '3' },
        '& :is(h1, h2, h3, h4, h5, h6)': { fontWeight: 'semibold', lineHeight: 'short' },
        '& :is(h1, h2, h3)': { fontSize: 'md' },
        '& p': { whiteSpace: 'pre-line' },
        '& :is(ol, ul)': { ps: '5' },
        '& ol': { listStyleType: 'decimal' },
        '& ul': { listStyleType: 'disc' },
        '& li + li': { mt: '1' },
        '& a': { color: 'blue.fg', textDecoration: 'underline', textUnderlineOffset: '0.15em' },
        '& a:has(> img)': { display: 'inline-block', maxW: 'full' },
        '& img': { display: 'inline-block', w: 'auto', h: 'auto', maxW: 'full', maxH: '64', objectFit: 'contain', rounded: 'md', verticalAlign: 'middle' },
        '& [data-answer-image-row] > *': { flexShrink: 0, scrollSnapAlign: 'start' },
        '& [data-answer-image-row] img': { h: { base: '24', md: '32' }, maxW: 'min(60vw, 16rem)' },
        '& blockquote': { borderInlineStartWidth: '2px', borderColor: 'border', ps: '3', color: 'fg.muted' },
        '& hr': { borderColor: 'border' },
        '& pre': { overflowX: 'auto', whiteSpace: 'pre', bg: 'bg.muted', rounded: 'md', p: '3' },
        '& :not(pre) > code': { bg: 'bg.muted', rounded: 'sm', px: '1' },
        '& table': { width: 'full', minW: 'max-content' },
        '& :is(th, td)': { borderWidth: '1px', borderColor: 'border', px: '3', py: '2' },
        '& th': { bg: 'bg.subtle', fontWeight: 'semibold' },
      }}
    >
      <Markdown remarkPlugins={transcriptRemarkPlugins} components={previewComponents}>{markdown}</Markdown>
    </Box>
  )
})
