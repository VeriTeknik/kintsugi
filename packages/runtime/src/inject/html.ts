/**
 * Replace annotation content in HTML with registry values.
 * Preserves annotation comments so subsequent injections still work.
 *
 * Supports HTML (<!-- kintsugi:ID {...} --> ... <!-- /kintsugi:ID -->)
 * and JSX ({/* kintsugi:ID {...} * /} ... {/* /kintsugi:ID * /})
 */
export function injectAnnotations(
  html: string,
  values: Record<string, unknown>,
): string {
  // Match open...close annotation pairs and replace content
  // The regex must handle both HTML and JSX comment styles
  // Open: <!-- kintsugi:ID {JSON} --> or /* kintsugi:ID {JSON} */
  // Close: <!-- /kintsugi:ID --> or /* /kintsugi:ID */

  // Use a function-based replace to handle each annotation
  return html.replace(
    /(<!--\s*kintsugi:(\S+)\s+\{[^}]*\}\s*-->)([\s\S]*?)(<!--\s*\/kintsugi:\2\s*-->)/g,
    (match, openTag, id, _content, closeTag) => {
      if (!(id in values)) return match;
      return `${openTag}\n${String(values[id])}\n${closeTag}`;
    }
  ).replace(
    /(\/\*\s*kintsugi:(\S+)\s+\{[^}]*\}\s*\*\/)([\s\S]*?)(\/\*\s*\/kintsugi:\2\s*\*\/)/g,
    (match, openTag, id, _content, closeTag) => {
      if (!(id in values)) return match;
      return `${openTag}\n${String(values[id])}\n${closeTag}`;
    }
  );
}
