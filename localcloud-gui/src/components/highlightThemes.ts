export const highlightThemes: Record<string, string> = {
  github: "github.css",
  "github-light": "github.css",
  "github-dark": "github-dark.css",
  "github-dark-dimmed": "github-dark-dimmed.css",
  "atom-one-dark": "atom-one-dark.css",
  "atom-one-light": "atom-one-light.css",
};

export type HighlightTheme = keyof typeof highlightThemes;
