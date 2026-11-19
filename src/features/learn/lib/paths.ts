import type { Mode } from './progress';

export const lessonPath = (lessonId: string) => `/learn/${lessonId}`;

export const playPath = (lessonId: string, key: string, mode: Mode) => `/learn/${lessonId}/play/${encodeURIComponent(key)}?mode=${mode}`;
