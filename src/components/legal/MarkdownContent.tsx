import { Fragment, type ReactNode } from 'react'

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    if (match[2] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b-${i}`}>{match[2]}</strong>)
    } else if (match[3] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i-${i}`}>{match[3]}</em>)
    }
    lastIndex = regex.lastIndex
    i++
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

export function MarkdownContent({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let listItems: string[] = []
  let key = 0

  const flushList = () => {
    if (listItems.length === 0) return
    const items = listItems
    blocks.push(
      <ul key={`ul-${key++}`} className="list-disc pl-6 space-y-1 my-3">
        {items.map((item, idx) => (
          <li key={idx}>{renderInline(item, `li-${key}-${idx}`)}</li>
        ))}
      </ul>
    )
    listItems = []
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    const listItem = /^[-*]\s+(.*)$/.exec(line)

    if (heading) {
      flushList()
      const level = heading[1].length
      const content = renderInline(heading[2], `h-${key}`)
      if (level === 1) {
        blocks.push(<h1 key={`h-${key++}`} className="font-headline text-2xl font-bold mt-6 mb-3">{content}</h1>)
      } else if (level === 2) {
        blocks.push(<h2 key={`h-${key++}`} className="font-headline text-xl font-bold mt-5 mb-2">{content}</h2>)
      } else {
        blocks.push(<h3 key={`h-${key++}`} className="font-headline text-lg font-bold mt-4 mb-2">{content}</h3>)
      }
    } else if (listItem) {
      listItems.push(listItem[1])
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      blocks.push(<p key={`p-${key++}`} className="my-3 leading-relaxed">{renderInline(line, `p-${key}`)}</p>)
    }
  }

  flushList()

  return <div className="text-[#1E1A5F]">{blocks.map((b, idx) => <Fragment key={idx}>{b}</Fragment>)}</div>
}
