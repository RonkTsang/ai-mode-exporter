import { getAiModeAttachmentFilename } from '@/common/aiModeTransfer'
import { waitForDraft, type DraftAdapter } from '../agent-draft/receiveTransfer'
import { addGeminiAttachment, findGeminiAttachment, findGeminiFileInput, findGeminiUploadTrigger } from './dom'

export const importGeminiDraft: DraftAdapter = async (transfer, id, canImport) => {
  const filename = getAiModeAttachmentFilename(transfer.title, id)
  if (findGeminiAttachment(filename)) return true

  const trigger = await waitForDraft(findGeminiUploadTrigger, 12_000, canImport)
  if (!trigger || !canImport()) return false
  if (trigger.getAttribute('aria-expanded') !== 'true') trigger.click()

  const input = await waitForDraft(findGeminiFileInput, 5_000, canImport)
  if (!input || !canImport()) return false
  addGeminiAttachment(input, filename, transfer.text)
  return Boolean(await waitForDraft(() => findGeminiAttachment(filename), 30_000, canImport))
}
