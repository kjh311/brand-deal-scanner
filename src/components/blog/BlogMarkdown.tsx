import React, { Fragment, type ReactNode } from 'react'

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Matches:
  // 1. Links: [label](url)
  // 2. Bold: **text** or __text__
  // 3. Inline code: `code`
  // 4. Italic: *text* or _text_
  const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    if (match[2] !== undefined && match[3] !== undefined) {
      // Link [text](url)
      const label = match[2]
      const url = match[3]
      const isExternal = url.startsWith('http')
      nodes.push(
        <a
          key={`${keyPrefix}-a-${i}`}
          href={url}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-[#7B2CBF] font-semibold underline decoration-2 underline-offset-2 hover:text-[#D84C9F] transition-colors"
        >
          {label}
        </a>
      )
    } else if (match[4] !== undefined || match[5] !== undefined) {
      // Bold
      const boldText = match[4] ?? match[5]
      nodes.push(<strong key={`${keyPrefix}-b-${i}`} className="font-bold text-[#1E1A5F]">{boldText}</strong>)
    } else if (match[6] !== undefined) {
      // Inline Code
      nodes.push(
        <code
          key={`${keyPrefix}-c-${i}`}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-[#D84C9F] font-mono text-sm border border-slate-200"
        >
          {match[6]}
        </code>
      )
    } else if (match[7] !== undefined || match[8] !== undefined) {
      // Italic
      const italicText = match[7] ?? match[8]
      nodes.push(<em key={`${keyPrefix}-em-${i}`} className="italic">{italicText}</em>)
    }

    lastIndex = tokenRegex.lastIndex
    i++
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

export function BlogMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let listItems: string[] = []
  let isNumberedList = false
  let inCodeBlock = false
  let codeBlockLines: string[] = []
  let codeBlockLang = ''
  let key = 0

  const flushList = () => {
    if (listItems.length === 0) return
    const items = listItems
    const numbered = isNumberedList

    if (numbered) {
      blocks.push(
        <ol key={`ol-${key++}`} className="list-decimal pl-6 space-y-2 my-4 text-[#334155]">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(item, `ol-${key}-${idx}`)}
            </li>
          ))}
        </ol>
      )
    } else {
      blocks.push(
        <ul key={`ul-${key++}`} className="list-disc pl-6 space-y-2 my-4 text-[#334155]">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(item, `ul-${key}-${idx}`)}
            </li>
          ))}
        </ul>
      )
    }

    listItems = []
    isNumberedList = false
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx]
    const trimmed = raw.trim()

    // Handle code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // Closing code block
        blocks.push(
          <div key={`codeblock-${key++}`} className="my-6 rounded-2xl bg-[#0F172A] text-slate-100 p-5 overflow-x-auto text-sm font-mono border border-slate-800">
            {codeBlockLang && (
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">
                {codeBlockLang}
              </div>
            )}
            <pre className="overflow-x-auto">
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
        )
        inCodeBlock = false
        codeBlockLines = []
        codeBlockLang = ''
      } else {
        // Opening code block
        flushList()
        inCodeBlock = true
        codeBlockLang = trimmed.slice(3).trim()
        codeBlockLines = []
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(raw)
      continue
    }

    // Horizontal rule
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      flushList()
      blocks.push(<hr key={`hr-${key++}`} className="my-8 border-slate-200" />)
      continue
    }

    // Headings
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      const content = renderInline(headingMatch[2], `h-${key}`)

      if (level === 1) {
        blocks.push(
          <h1 key={`h1-${key++}`} className="font-headline text-3xl sm:text-4xl font-extrabold text-[#1E1A5F] mt-10 mb-4 tracking-tight">
            {content}
          </h1>
        )
      } else if (level === 2) {
        blocks.push(
          <h2 key={`h2-${key++}`} className="font-headline text-2xl sm:text-3xl font-bold text-[#1E1A5F] mt-8 mb-3 tracking-tight">
            {content}
          </h2>
        )
      } else if (level === 3) {
        blocks.push(
          <h3 key={`h3-${key++}`} className="font-headline text-xl sm:text-2xl font-bold text-[#1E1A5F] mt-6 mb-2">
            {content}
          </h3>
        )
      } else {
        blocks.push(
          <h4 key={`h4-${key++}`} className="font-headline text-lg sm:text-xl font-bold text-[#1E1A5F] mt-5 mb-2">
            {content}
          </h4>
        )
      }
      continue
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      flushList()
      const quoteText = trimmed.replace(/^>\s?/, '')
      blocks.push(
        <blockquote
          key={`quote-${key++}`}
          className="my-5 border-l-4 border-[#D84C9F] bg-slate-50 rounded-r-2xl py-3 px-5 text-[#475569] italic leading-relaxed"
        >
          {renderInline(quoteText, `quote-${key}`)}
        </blockquote>
      )
      continue
    }

    // Bullet lists
    const bulletMatch = /^[-*]\s+(.*)$/.exec(trimmed)
    if (bulletMatch) {
      if (isNumberedList) flushList()
      isNumberedList = false
      listItems.push(bulletMatch[1])
      continue
    }

    // Numbered lists
    const numberMatch = /^(\d+)\.\s+(.*)$/.exec(trimmed)
    if (numberMatch) {
      if (!isNumberedList && listItems.length > 0) flushList()
      isNumberedList = true
      listItems.push(numberMatch[2])
      continue
    }

    // Blank line
    if (trimmed === '') {
      flushList()
      continue
    }

    // Normal paragraph
    flushList()
    blocks.push(
      <p key={`p-${key++}`} className="my-4 text-[#334155] leading-relaxed text-base sm:text-lg">
        {renderInline(raw, `p-${key}`)}
      </p>
    )
  }

  // Final flush
  flushList()

  if (inCodeBlock && codeBlockLines.length > 0) {
    blocks.push(
      <div key={`codeblock-${key++}`} className="my-6 rounded-2xl bg-[#0F172A] text-slate-100 p-5 overflow-x-auto text-sm font-mono border border-slate-800">
        <pre className="overflow-x-auto">
          <code>{codeBlockLines.join('\n')}</code>
        </pre>
      </div>
    )
  }

  return (
    <article className="blog-content w-full">
      {blocks.map((b, idx) => (
        <Fragment key={idx}>{b}</Fragment>
      ))}
    </article>
  )
}

