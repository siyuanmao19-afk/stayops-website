import { Fragment } from 'react'

/**
 * Renders plain text with Markdown-style **bold** only. No HTML is ever injected,
 * so AI output cannot introduce markup or scripts.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-walnut">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </span>
  )
}

export function stripBold(text: string) {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1')
}
