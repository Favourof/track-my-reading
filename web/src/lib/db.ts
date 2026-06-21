import Dexie, { Table } from 'dexie';

export interface Book {
  id?: number;
  title: string;
  author?: string;
  totalPages: number;
  coverImage?: string; // base64 or URL
  createdAt: Date;
  type: 'pdf' | 'physical';
  file?: Blob;
  fileType?: string;
  lastPageRead?: number;
}

export interface ReadingSession {
  id?: number;
  bookId: number;
  date: string; // YYYY-MM-DD
  pagesRead: number;
  notes?: string;
  createdAt: Date;
}

export interface Flashcard {
  id?: number;
  sessionId: number;
  bookId: number;
  question: string;
  answer: string;
  createdAt: Date;
}

export interface DictionaryEntry {
  id?: number;
  word: string;
  definition: string;
  example?: string;
  createdAt: Date;
}

export interface Goal {
  id?: number;
  dailyPages: number;
  updatedAt: Date;
}

export class ReadingTrackerDB extends Dexie {
  books!: Table<Book>;
  sessions!: Table<ReadingSession>;
  flashcards!: Table<Flashcard>;
  dictionary!: Table<DictionaryEntry>;
  goals!: Table<Goal>;

  constructor() {
    super('ReadingTrackerDB');
    this.version(1).stores({
      books: '++id, title, createdAt', // Primary key and indexed props
      sessions: '++id, bookId, date, createdAt',
      flashcards: '++id, sessionId, bookId, createdAt',
      dictionary: '++id, word, createdAt',
      goals: '++id'
    });
  }
}

export const db = new ReadingTrackerDB();
