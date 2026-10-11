// What the popup's Tags field starts with: the saved default tags plus a
// trailing space (so the user can type another tag straight away), or
// empty when none were saved.
export const initialTagsValue = (defaultTags: string | undefined): string =>
  defaultTags ? `${defaultTags} ` : '';

// Turns the Tags field into the list sent to Shlink: split on spaces,
// dropping empty entries. Only the space character separates tags.
export const parseTags = (raw: string): string[] =>
  raw.split(' ').filter((s) => s !== '');
