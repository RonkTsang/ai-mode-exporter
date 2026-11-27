export const SKIP_ANSWER_NODES = '[hidden], [aria-hidden="true"], [role="dialog"], svg, script, style'

export function uniqueElement<T extends Element>(root: ParentNode, selector: string): T | null {
  const nodes = root.querySelectorAll<T>(selector)
  return nodes.length === 1 ? nodes.item(0) : null
}
