// Looks up an element by id, failing loudly if the page markup and the
// script have drifted apart (jQuery used to hide that as a silent no-op).
export const byId = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} element`);
  return el as T;
};
