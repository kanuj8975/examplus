
import { GoogleGenAI, Type } from "@google/genai";
import { ExamType, Language, Question, Difficulty } from "./types";
import { EXAM_CONFIGS } from "./examConfig";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Enhanced retry logic with exponential backoff specifically for 429 errors.
 * Gemini 3 Pro often has stricter rate limits (e.g. 2 RPM for free tier).
 */
async function generateWithRetry(ai: any, params: any, retries = 4, initialBackoff = 15000): Promise<any> {
  let currentBackoff = initialBackoff;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent(params);
      return response;
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit && i < retries - 1) {
        console.warn(`Rate limit hit (429). Waiting ${currentBackoff / 1000}s before retry ${i + 1}/${retries}...`);
        await delay(currentBackoff);
        // Exponentially increase backoff for the next attempt
        currentBackoff *= 2; 
        continue;
      }
      
      // If it's not a rate limit or we're out of retries, throw the error
      throw error;
    }
  }
}

async function generateSection(
  examType: ExamType,
  sectionName: string,
  count: number,
  language: Language,
  difficulty: Difficulty,
  weakAreas: string[],
  onSectionStart?: (name: string) => void
): Promise<Question[]> {
  onSectionStart?.(sectionName);
  
  // Create a new instance right before use to ensure correct API key from process.env
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Gemini 3 Pro supports Google Search Grounding
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    Role: Senior Exam Content Researcher (15 years experience).
    Mission: Generate a High-Probability Prediction Paper for ${examType}.
    Advantage: Use GOOGLE SEARCH to verify 2024-2025 data (Current Affairs, Economy, Law changes, latest events).
    
    Subject: ${sectionName}
    Language: ${language}
    Question Count: ${count}
    Overall Difficulty: ${difficulty}
    
    CRITICAL RULES:
    1. DIFFICULTY MIX: 30% Easy (Fundamentals), 50% Moderate (Application), 20% Hard (Analytical).
    2. GROUNDING: Verify facts using Google Search. Focus on 2024 and early 2025 updates.
    3. DISTRACTORS: Options must be confusingly close.
    4. SUCCESS LOGIC: For every question, include a 1-sentence expert shortcut or reasoning why this specific question has a high probability of appearing.
    5. NO REPETITION: Every question must cover a unique concept.
    6. FORMAT: Return exactly ${count} questions in the specified JSON schema.
  `;

  try {
    const response = await generateWithRetry(ai, {
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are an elite researcher. Your questions define selection chances. 
        Format as JSON array: text, options(4), correctAnswer(0-3), explanation(short), successLogic(expert tip).`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              successLogic: { type: Type.STRING },
              subject: { type: Type.STRING }
            },
            required: ["text", "options", "correctAnswer", "explanation", "successLogic"]
          }
        }
      }
    });

    const questions: Question[] = JSON.parse(response.text || "[]");
    return questions.map((q, idx) => ({ 
      ...q, 
      id: `q-${sectionName}-${idx}-${Date.now()}`,
      subject: q.subject || sectionName
    }));
  } catch (e) {
    console.error(`Critical error generating section ${sectionName}:`, e);
    // Return empty but allow the process to continue for other sections
    return [];
  }
}

export const generateFullExamPaper = async (
  examType: ExamType, 
  language: Language,
  difficulty: Difficulty,
  weakAreas: string[] = [],
  onProgress?: (sectionName: string) => void
): Promise<Question[]> => {
  const config = EXAM_CONFIGS[examType];
  const fullPaper: Question[] = [];
  
  // To avoid hitting RPM (Requests Per Minute) limits on free/low tiers,
  // we add a substantial delay between section requests.
  const INTER_SECTION_DELAY = 10000; // 10 seconds

  for (const sectionName of config.sections) {
    const count = Math.ceil(config.totalQuestions / config.sections.length);
    const questions = await generateSection(examType, sectionName, count, language, difficulty, weakAreas, onProgress);
    
    if (questions.length > 0) {
      fullPaper.push(...questions);
    }
    
    // If not the last section, wait to respect rate limits
    if (config.sections.indexOf(sectionName) < config.sections.length - 1) {
      await delay(INTER_SECTION_DELAY);
    }
  }
  
  if (fullPaper.length === 0) {
    throw new Error("Generation failed due to persistent API rate limits. Please check your Gemini API key quota or try a different difficulty.");
  }

  // Ensure we don't return more than requested due to rounding
  return fullPaper.slice(0, config.totalQuestions);
};
