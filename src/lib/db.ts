import Dexie, { type EntityTable, type Table } from 'dexie';
import type {
  AchievementUnlock,
  ActivityEvent,
  ArchiveRecord,
  GameAnalysis,
  GameRecord,
  LichessAttempt,
  LichessDaily,
  LichessRating,
  MetaRow,
  MoveAnalysis,
  Profile,
  Puzzle,
  PuzzleAttempt,
  PuzzleCandidate,
} from './types';

export const DB_NAME = 'blunderlab';

/**
 * The single IndexedDB database for the app. The whole schema lives in this file.
 * Features that need their own tables add a new `this.version(n).stores({...})` below
 * (keep earlier versions intact). Changing username deletes the entire database.
 */
export class BlunderDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>;
  games!: EntityTable<GameRecord, 'uuid'>;
  archives!: EntityTable<ArchiveRecord, 'month'>;
  analyses!: EntityTable<GameAnalysis, 'gameId'>;
  moves!: Table<MoveAnalysis, [string, number]>;
  puzzles!: EntityTable<Puzzle, 'id'>;
  puzzleAttempts!: EntityTable<PuzzleAttempt, 'id'>;
  puzzleCandidates!: Table<PuzzleCandidate, [string, number]>;
  lichessAttempts!: EntityTable<LichessAttempt, 'id'>;
  lichessRating!: EntityTable<LichessRating, 'id'>;
  lichessDaily!: EntityTable<LichessDaily, 'date'>;
  activity!: EntityTable<ActivityEvent, 'id'>;
  achievements!: EntityTable<AchievementUnlock, 'id'>;
  meta!: EntityTable<MetaRow, 'key'>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      profile: 'id',
      games: 'uuid, endTime, month, timeClass, result, analysisStatus, [analysisStatus+endTime]',
      archives: 'month',
      analyses: 'gameId, endTime, analyzedAt',
      moves: '[gameId+ply], gameId, classification, [actor+classification]',
    });
    // Puzzles feature.
    this.version(2).stores({
      puzzles: 'id, gameId, gameEndTime, dueAt',
      puzzleAttempts: '++id, puzzleId, at',
      puzzleCandidates: '[gameId+ply], gameId, outcome',
    });
    // Lichess puzzles (kept apart from the owner's own puzzles) and the shared activity log.
    this.version(3).stores({
      lichessAttempts: '++id, puzzleId, at, origin',
      lichessRating: 'id',
      lichessDaily: 'date',
      activity: '++id, at, kind, [kind+at]',
    });
    // Streaks, titles and badges: earned badges and small app-level flags.
    this.version(4).stores({
      achievements: 'id',
      meta: 'key',
    });
  }
}

export const db = new BlunderDB();
