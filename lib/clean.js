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
    .replace(/\b(?:delve(?:s|d)?\s+into|tapestry\s+of|testament\s+to|beacon\s+of|fosters?\s+a|interplay\s+between|crucial\s+to\s+remember|vital\s+to\s+note|in\s+conclusion,?|in\s+summary,?|to\s+summarize,?|furthermore,?|moreover,?|it\s+is\s+worth\s+noting\s+that|needless\s+to\s+say,?|at\s+the\s+end\s+of\s+the\s+day,?)\s*/gi, '')
    .replace(/\b(?:As mentioned earlier|Without further ado|In light of the above),?\s*/gi, '')
    .replace(/\s*(?:Do you have any (?:more |other )?questions\??|Would you like (?:me to |to )(?:know|learn|explore) more\??|Let me know if (?:you need|I can help with) anything else!?|Is there anything else (?:I can help with|you would like to know)\??|Feel free to ask if you have any (?:other )?questions!?|What do you think\??)\s*$/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
