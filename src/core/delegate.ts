export type DelegatedHandler<K extends keyof DocumentEventMap> = (
  event: DocumentEventMap[K],
  match: HTMLElement,
) => void;

/**
 * Registers a single event listener on `root` and dispatches to `handler`
 * whenever the event's target is inside an element matching `selector`.
 * Survives DOM replacement (e.g. Turbo Drive swaps) since nothing is bound
 * to the matched elements themselves.
 */
export function onDelegate<K extends keyof DocumentEventMap>(
  root: Document,
  type: K,
  selector: string,
  handler: DelegatedHandler<K>,
): () => void {
  const listener = (event: Event) => {
    const target = event.target as Element | null;
    const match = target?.closest<HTMLElement>(selector) ?? null;
    if (match && root.contains(match)) {
      handler(event as DocumentEventMap[K], match);
    }
  };

  root.addEventListener(type, listener);
  return () => root.removeEventListener(type, listener);
}
