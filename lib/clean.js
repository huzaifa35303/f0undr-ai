export function decodeEntities(s = '') {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '...')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export function stripHtml(html = '') {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<(nav|header|footer|aside|form|iframe|svg)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '. ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .replace(/(\.\s*){2,}/g, '. ')
    .trim();
}

export function unslop(text = '') {
  return text
    .replace(/^(?:As an AI language model|As an AI|I would be happy to help|Certainly!?|Sure thing|Here is what I found|According to the web search):\s*/i, '')
    .replace(/^(?:In this response, I will|Let's delve into|It is important to remember that)\s*/i, '')
    .replace(/\b(?:delve into|tapestry of|testament to|leverage|furthermore,|in conclusion,|to summarize,)\s*/gi, '')
    .trim();
}
