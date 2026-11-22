import { Button, Flex, Text } from '@chakra-ui/react'
import { createRoot } from 'react-dom/client'
import { i18n } from '#i18n'
import { Provider } from '@/components/ui/provider-shadow-dom'

export default defineContentScript({
  matches: ['http://localhost/*', 'http://127.0.0.1/*'],
  main(ctx) {
    if (location.port !== '4321') return

    const host = document.createElement('div')
    host.dataset.aiModeExporterPreview = ''
    document.body.append(host)
    const root = createRoot(host)

    function removePreview(): void {
      root.unmount()
      host.remove()
    }

    root.render(
      <Provider>
        <Flex
          position="fixed"
          insetInlineEnd="4"
          bottom="4"
          zIndex="overlay"
          align="center"
          gap="3"
          bg="bg"
          color="fg"
          borderWidth="1px"
          borderColor="border"
          rounded="lg"
          shadow="md"
          p="3"
        >
          <Text fontWeight="medium">AI Mode Exporter</Text>
          <Button size="xs" variant="outline" onClick={removePreview}>
            {i18n.t('common.cancel')}
          </Button>
        </Flex>
      </Provider>,
    )

    ctx.onInvalidated(removePreview)
  },
})
