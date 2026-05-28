import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

// ── Phase 1: Analyze speakers, topics, AND keywords ──────────────────────────
app.post("/api/analyze-topics", async (req, res) => {
  try {
    const { transcript, excludedTopics = [] } = req.body;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Analyze the following meeting transcript.

1. **Speakers**: Identify all unique speakers.
   Look for patterns like "[Name] [Time]" or "[Name]:" at the start of paragraphs.
   Use real names if found (e.g., "홍길동"), otherwise "참석자 1", "참석자 2", etc.

2. **Topics**: Recommend important core discussion topics for business/HR/collaboration domain.
   Provide 5–10 highly relevant topics. ALL TOPICS MUST BE IN KOREAN.
   DO NOT include any of these excluded topics: [${excludedTopics.join(", ")}].

3. **Keywords**: Extract 5–8 concise keyword tags that best describe this meeting for archiving.
   Think: what tags would help someone search for this meeting later?
   Examples: 인사제도, 육아휴직, 조직개편, 성과평가, 복지개편
   ALL KEYWORDS MUST BE IN KOREAN. Single words or short compound nouns only.

Transcript:
${transcript.substring(0, 20000)}
`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            speakers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Detected speaker IDs or names"
            },
            topics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Recommended core topics in Korean"
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Archive keyword tags in Korean, 5-8 items"
            }
          },
          required: ["speakers", "topics", "keywords"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── Phase 2: Refine transcript ────────────────────────────────────────────────
app.post("/api/refine-transcript", async (req, res) => {
  try {
    const { transcript, glossary, questions, selectedTopics, speakerMap, keywords } = req.body;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are a professional secretary and HR assistant.
Refine the following meeting transcript into a RICH report.

**RULES:**
1. **Refinement**: Convert colloquial speech to professional literary Korean. Group consecutive lines by the same speaker.
2. **Glossary**: Correct terminology using: ${glossary}
3. **Speaker Mapping**: Use mapped names: ${JSON.stringify(speakerMap)}.
4. **Keywords context**: This meeting is tagged with [${(keywords || []).join(", ")}]. Use this context to better understand the domain.
5. **RICH Summary & Citations**: For each topic in [${selectedTopics.join(", ")}]:
   - Provide a DETAILED summary (3-5 sentences).
   - Insert footnotes [1], [2] at relevant points.
   - For each footnote, include the original speaker name and core gist.
6. **Question Mapping**: Map these questions to transcript context: [${questions}]
7. **Action Items**: Extract Who, What, When.
8. **ALL OUTPUT MUST BE IN KOREAN.**

Transcript:
${transcript.substring(0, 15000)}
`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  citations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.NUMBER },
                        speaker: { type: Type.STRING },
                        text: { type: Type.STRING }
                      },
                      required: ["id", "speaker", "text"]
                    }
                  }
                },
                required: ["topic", "summary", "citations"]
              }
            },
            questionMappings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answerMapping: { type: Type.STRING }
                },
                required: ["question", "answerMapping"]
              }
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  who: { type: Type.STRING },
                  what: { type: Type.STRING },
                  when: { type: Type.STRING }
                },
                required: ["who", "what", "when"]
              }
            },
            refinedLines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speakerId: { type: Type.STRING },
                  speakerName: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["speakerId", "speakerName", "text"]
              }
            }
          },
          required: ["summaryItems", "questionMappings", "actionItems", "refinedLines"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Refinement error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── v2: Cross-analysis ────────────────────────────────────────────────────────
app.post("/api/cross-analyze", async (req, res) => {
  try {
    const { meetings } = req.body;
    // meetings: Array<{ title, date, type, keywords, analysis }>

    const meetingSummaries = meetings.map((m: any, i: number) => `
## 회의 ${i + 1}: ${m.title} (${m.date}, ${m.type})
키워드: ${m.keywords?.join(', ')}
주제별 요약:
${m.analysis?.summaryItems?.map((s: any) => `- ${s.topic}: ${s.summary}`).join('\n')}
액션아이템:
${m.analysis?.actionItems?.map((a: any) => `- [${a.who}] ${a.what} (${a.when})`).join('\n')}
`).join('\n---\n');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are an expert HR and organizational analyst.
Analyze the following ${meetings.length} meeting records and produce cross-meeting insights.

${meetingSummaries}

Produce:
1. **actionItemTracking**: All action items across meetings, with meeting source and status inference.
2. **topicTimeline**: How key topics evolved across meetings (earliest to latest mention, changes in stance).
3. **unresolvedIssues**: Issues or concerns raised in multiple meetings without clear resolution.
ALL OUTPUT MUST BE IN KOREAN.
`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            actionItemTracking: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  who: { type: Type.STRING },
                  what: { type: Type.STRING },
                  when: { type: Type.STRING },
                  source: { type: Type.STRING },
                  status: { type: Type.STRING }
                },
                required: ["who", "what", "when", "source", "status"]
              }
            },
            topicTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  evolution: { type: Type.STRING }
                },
                required: ["topic", "evolution"]
              }
            },
            unresolvedIssues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  issue: { type: Type.STRING },
                  appearedIn: { type: Type.ARRAY, items: { type: Type.STRING } },
                  summary: { type: Type.STRING }
                },
                required: ["issue", "appearedIn", "summary"]
              }
            }
          },
          required: ["actionItemTracking", "topicTimeline", "unresolvedIssues"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Cross-analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── Static / Vite ─────────────────────────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
