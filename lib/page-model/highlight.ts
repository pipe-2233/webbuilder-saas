export type TextPart = { text: string; highlight: boolean };

/**
 * Divide un texto para resaltar la primera aparición de `phrase` (sin
 * distinguir mayúsculas). Ej.: ("Tu lote a minutos", "a minutos") ->
 * [{ "Tu lote ", false }, { "a minutos", true }].
 */
export function splitHighlight(text: string, phrase: string): TextPart[] {
  const needle = phrase.trim();
  if (!needle) return [{ text, highlight: false }];
  const index = text.toLocaleLowerCase("es").indexOf(needle.toLocaleLowerCase("es"));
  if (index === -1) return [{ text, highlight: false }];
  const parts: TextPart[] = [];
  if (index > 0) parts.push({ text: text.slice(0, index), highlight: false });
  parts.push({ text: text.slice(index, index + needle.length), highlight: true });
  if (index + needle.length < text.length) parts.push({ text: text.slice(index + needle.length), highlight: false });
  return parts;
}
