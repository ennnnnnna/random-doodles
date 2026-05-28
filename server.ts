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
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Phase 1: Analyze speakers and topics
app.post("/api/analyze-topics", async (req, res) => {
  try {
    const { transcript, excludedTopics = [] } = req.body;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
        Analyze the following meeting transcript. 
        1. Identify all unique speakers. Look for patterns like "[Name] [Time]" or "[Name]:" at the start of paragraphs. 
           If clear names are found, use them (e.g., "홍길동"). If not, use "참석자 1", "참석자 2", etc.
        2. Recommend important core discussion topics suitable for business/collaboration domain, based on actual key agendas discussed. Do not restrict it to exactly 5 topics. Provide a flexible number of highly relevant topics depending on the transcript content, but do not exceed 10 topics in total.
        
        **CRITICAL RULES:**
        - ALL TOPICS MUST BE IN KOREAN (한국어).
        - DO NOT include or suggest any of these excluded topics: [${excludedTopics.join(", ")}].
        - Standardize and output up to 10 topics maximum.
        
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
              description: "List of detected speaker IDs or names"
            },
            topics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Recommended core topics in Korean, up to 10 topics max based on meeting agendas"
            }
          },
          required: ["speakers", "topics"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Phase 2: Final refinement
app.post("/api/refine-transcript", async (req, res) => {
  try {
    const { 
      transcript, 
      glossary, 
      questions, 
      selectedTopics, 
      speakerMap 
    } = req.body;

    const speakerMapStr = JSON.stringify(speakerMap);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
        You are a professional secretary and HR assistant.
        Refine the following meeting transcript into a RICH report.
        
        **RI RULES:**
        1. **Refinement:** Convert colloquial speech to professional literary (written) style Korean. Group consecutive lines by the same speaker into one block.
        2. **Glossary:** Correct terminology using: ${glossary}
        3. **Speaker Mapping:** Use these mapped names: ${speakerMapStr}.
        4. **RICH Summary & Citations:** For each topic in [${selectedTopics.join(", ")}]:
           - Provide a DETAILED summary (3-5 sentences).
           - Insert footnotes like [1], [2] at the end of relevant points.
           - For each footnote, provide a citation object containing the original speaker name and the core gist of their statement.
        5. **Question Mapping:** Map questions: [${questions}] to context.
        6. **Action Items:** Extract Who, What, When.
        7. **ALL OUTPUT MUST BE IN KOREAN.**
        
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
                  summary: { type: Type.STRING, description: "Detailed summary with [n] footnotes" },
                  citations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.NUMBER },
                        speaker: { type: Type.STRING },
                        text: { type: Type.STRING, description: "The core gist or quote from the transcript" }
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
