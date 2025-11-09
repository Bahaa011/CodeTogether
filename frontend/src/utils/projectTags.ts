export const PROJECT_TAG_OPTIONS = [
  "AI/ML",
  "Web",
  "Mobile",
  "DevOps",
  "Game Dev",
  "Data Viz",
  "Open Source",
  "Education",
  "Productivity",
  "Security",
] as const;

export const MAX_PROJECT_TAGS = 3;

export type ProjectTagOption = (typeof PROJECT_TAG_OPTIONS)[number];
