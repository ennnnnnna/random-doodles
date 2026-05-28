// ─────────────────────────────────────────────
// v2-ready data structures
// ─────────────────────────────────────────────

export interface ActionItem {
  who: string;
  what: string;
  when: string;
  status?: 'pending' | 'done'; // v2: tracking
}

export interface Citation {
  id: number;
  text: string;
  speaker: string;
}

export interface SummaryItem {
  topic: string;
  summary: string;
  citations: Citation[];
}

export interface QuestionMapping {
  question: string;
  answerMapping: string;
}

export interface RefinedTranscriptLine {
  id: string;
  timestamp?: string;
  speakerId: string;
  speakerName: string;
  text: string;
}

export interface MeetingAnalysis {
  topics: string[];
  selectedTopics: string[];
  excludedTopics?: string[];
  summaryItems: SummaryItem[];
  questionMappings: QuestionMapping[];
  actionItems: ActionItem[];
  refinedTranscript: RefinedTranscriptLine[];
}

export interface Meeting {
  // identity
  id: string;
  title: string;
  date: string;         // YYYY.MM.DD
  type: string;         // 회의 종류 e.g. 간담회
  keywords: string[];   // AI-suggested + manual tags

  // input
  originalTranscript: string;
  glossary: string;
  prefixedQuestions: string;
  speakerMap: Record<string, string>; // speakerId → displayName

  // output
  analysis?: MeetingAnalysis;

  // meta
  createdAt: string;    // ISO string
  updatedAt: string;    // ISO string

  // v2: sync marker (will be used when switching to Firebase)
  syncedAt?: string;
}

// v2 placeholder — swap body for Firebase calls
export interface StorageAdapter {
  getAll: () => Promise<Meeting[]>;
  save: (meeting: Meeting) => Promise<void>;
  remove: (id: string) => Promise<void>;
}
