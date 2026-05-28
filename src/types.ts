export interface Speaker {
  id: string; // e.g., "참석자1"
  name: string; // e.g., "연구원장", "홍길동"
}

export interface ActionItem {
  who: string;
  what: string;
  when: string;
}

export interface Citation {
  id: number;
  text: string; // The quoted text or core point
  speaker: string;
}

export interface SummaryItem {
  topic: string;
  summary: string; // Summary with footnotes like [1], [2]
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
  topics: string[]; // 5 recommended topics
  selectedTopics: string[];
  excludedTopics?: string[]; // Topics that should not be recommended again
  summaryItems: SummaryItem[];
  questionMappings: QuestionMapping[];
  actionItems: ActionItem[];
  refinedTranscript: RefinedTranscriptLine[];
}

export interface Meeting {
  id: string;
  title: string; // User-defined or AI-generated title
  date: string;
  type: string;
  keywords: string[];
  originalTranscript: string;
  glossary: string;
  prefixedQuestions: string;
  speakerMap: Record<string, string>; // speakerId -> speakerName
  analysis?: MeetingAnalysis;
  updatedAt: string;
}
