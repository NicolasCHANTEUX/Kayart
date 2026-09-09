export type ListParams = Record<string, string | string[] | undefined>;
export function queryText(params: ListParams, key: string, max = 120) {
  return typeof params[key] === "string" ? params[key].trim().slice(0, max) : "";
}
export function queryPage(params: ListParams) {
  const value = queryText(params, "page", 6);
  return /^\d+$/.test(value) ? Math.max(1, Math.min(10000, Number(value))) : 1;
}
export function pageHref(path: string, values: Record<string, string>, page: number) {
  const query = new URLSearchParams(Object.entries(values).filter(([, value]) => value));
  query.set("page", String(page));
  return `${path}?${query}`;
}
