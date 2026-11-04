/** Substitutes `{{name}}` placeholders. A missing variable renders as an empty
 *  string rather than leaking the placeholder to a customer. */
export function renderTemplate(
  body: string,
  data: Record<string, unknown>,
): string {
  return body.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, name: string) => {
    const value = data[name];
    return value === undefined || value === null ? '' : String(value);
  });
}
