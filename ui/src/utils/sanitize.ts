const DANGEROUS_TAGS = /<script[\s>][\s\S]*?<\/script\s*>/gi;
const DANGEROUS_ATTRS = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_HREF = /\s+(?:xlink:href|href)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi;
const DANGEROUS_TAGS_2 = /<foreignObject[\s>][\s\S]*?<\/foreignObject\s*>/gi;

export function validateSvg(svg: string): boolean {
  const lower = svg.toLowerCase();
  const dangerous = ['<script', 'javascript:', 'onclick=', 'onload=', 'onerror=', '<foreignobject'];
  return !dangerous.some(d => lower.includes(d));
}

export function sanitizeSvg(svg: string): string {
  return svg
    .replace(DANGEROUS_TAGS, '')
    .replace(DANGEROUS_TAGS_2, '')
    .replace(DANGEROUS_ATTRS, '')
    .replace(DANGEROUS_HREF, '');
}
