import pdfParse from 'pdf-parse';

/**
 * Convert a PDF buffer into Markdown using simple heuristics.
 * Keeps headings, bullets and paragraphs readable for LLM prompts.
 */
export async function pdfBufferToMarkdown(buffer: Buffer, filename?: string): Promise<string> {
  const { text, numpages, info } = await pdfParse(buffer);
  const title = (info as any)?.Title?.trim?.() || (filename || 'Untitled PDF');
  const mdBody = textToMarkdownHeuristics(text || '');

  const header = [
    '---',
    `source: ${sanitizeInline(title)}`,
    `pages: ${numpages ?? 'unknown'}`,
    `generated: ${new Date().toISOString()}`,
    '---',
    '',
    `# ${sanitizeInline(title)}`,
    '',
  ].join('\n');

  return `${header}${mdBody}`;
}

function textToMarkdownHeuristics(text: string): string {
  const lines = (text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/\t/g, '  '));

  const md: string[] = [];
  let prevBlank = true;

  for (let raw of lines) {
    let line = raw.trimRight();

    // Blank line -> paragraph break
    if (!line.trim()) {
      if (!prevBlank) md.push('');
      prevBlank = true;
      continue;
    }

    // Likely headings: ALL CAPS short lines or Capitalized without trailing punctuation
    if (/^[A-Z0-9][A-Z0-9 \-:/&]{2,}$/.test(line) && line.length <= 80) {
      md.push(`\n## ${titleCaseIfScreaming(line.trim())}\n`);
      prevBlank = false;
      continue;
    }

    // Bullets and numbered lists
    if (/^([•·\-*]|\d+\.)\s+/.test(line)) {
      line = line.replace(/^([•·*])\s+/, '- ').replace(/^(\d+\.)\s+/, '1. ');
      md.push(line);
      prevBlank = false;
      continue;
    }

    // Keep table-like spacing
    if (/\s{2,}/.test(line)) {
      md.push(line);
      prevBlank = false;
      continue;
    }

    // Default paragraph line
    md.push(line);
    prevBlank = false;
  }

  return md.join('\n');
}

function titleCaseIfScreaming(s: string): string {
  if (s === s.toUpperCase()) {
    return s
      .toLowerCase()
      .split(' ')
      .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ');
  }
  return s;
}

function sanitizeInline(s: string): string {
  return s.replace(/[\u0000-\u001f]+/g, ' ').trim();
}
