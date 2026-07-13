interface FeedbackProps {
  ok: boolean
  tag: string
  /**
   * Worked-solution HTML. Only ever markup our own generators emit
   * (<b>, <sup>, <br>) — never user input.
   */
  workHtml: string
}

export function Feedback({ ok, tag, workHtml }: FeedbackProps) {
  return (
    <div className={'feedback ' + (ok ? 'ok' : 'no')} role="status">
      <b className={'tag ' + (ok ? 'tag-ok' : 'tag-no')}>{tag}</b>
      <div className="work" dangerouslySetInnerHTML={{ __html: workHtml }} />
    </div>
  )
}
