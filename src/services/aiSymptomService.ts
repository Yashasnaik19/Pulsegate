/**
 * @license
 * PulseGate AI Symptom Extraction & Multilingual NLP Service
 * Supports English, Kannada, and Hindi with Gemini API & Deterministic Safe Fallback
 */

import { GoogleGenAI, Type } from '@google/genai';
import type { ExtractedSymptom, LanguageCode } from '../types/index.ts';

export interface SymptomExtractionResult {
  languageDetected: LanguageCode;
  primaryComplaint: string;
  onset: string;
  duration: string;
  severityScale: number;
  symptoms: ExtractedSymptom[];
  reportedRedFlags: string[];
  uncertainItems: string[];
  missingInformation: string[];
  requiresHumanConfirmation: boolean;
  extractionSource: 'GEMINI_LLM' | 'LOCAL_DETERMINISTIC_PARSER';
}

// Deterministic dictionary for multilingual clinical term extraction
const CLINICAL_LEXICON: Array<{
  concept: string;
  label: string;
  keywordsEn: string[];
  keywordsKn: string[];
  keywordsHi: string[];
  redFlagId?: string;
}> = [
  {
    concept: 'facial_droop',
    label: 'Facial Droop (FAST)',
    keywordsEn: ['facial droop', 'face droop', 'crooked face', 'asymmetrical smile'],
    keywordsKn: ['ಮುಖದ ವಕ್ರತೆ', 'ಮುಖ ಒಂದು ಬದಿಗೆ ಸೊಟ್ಟ', 'ಮುಖ ಬಾಗುವುದು'],
    keywordsHi: ['चेहरे का टेढ़ापन', 'चेहरा लटकना', 'मुंह टेढ़ा'],
    redFlagId: 'EMERG-STROKE-FAST',
  },
  {
    concept: 'arm_weakness',
    label: 'Unilateral Arm Weakness (FAST)',
    keywordsEn: ['arm weakness', 'arm limp', 'one-sided weakness', 'loss of grip', 'cannot raise arm'],
    keywordsKn: ['ಕೈ ದೌರ್ಬಲ್ಯ', 'ಕೈ ಎತ್ತಲು ಆಗುತ್ತಿಲ್ಲ', 'ಒಂದು ಬದಿಯ ಕೈ ಶಕ್ತಿ ಇಲ್ಲ'],
    keywordsHi: ['हाथ में कमजोरी', 'हाथ नहीं उठ रहा', 'एक तरफ का हाथ सुन्न'],
    redFlagId: 'EMERG-STROKE-FAST',
  },
  {
    concept: 'speech_slur',
    label: 'Slurred Speech / Dysarthria (FAST)',
    keywordsEn: ['slurred speech', 'cannot speak', 'unclear speech', 'speech impediment', 'loss of words'],
    keywordsKn: ['ಮಾತು ತೊದಲುವಿಕೆ', 'ಮಾತು ಸರಿಯಾಗಿ ಬರುತ್ತಿಲ್ಲ', 'ಸ್ಪಷ್ಟವಿಲ್ಲದ ಮಾತು'],
    keywordsHi: ['बोली लड़खड़ाना', 'आवाज साफ नहीं', 'बोलने में कठिनाई'],
    redFlagId: 'EMERG-STROKE-FAST',
  },
  {
    concept: 'chest_pain',
    label: 'Retrosternal Chest Pain',
    keywordsEn: ['chest pain', 'crushing chest', 'pressure in chest', 'tightness in chest', 'heart pain'],
    keywordsKn: ['ಎದೆ ನೋವು', 'ಎದೆಯಲ್ಲಿ ಭಾರ', 'ಎದೆ ಹಿಂಡಿದಂತಾಗುವುದು'],
    keywordsHi: ['सीने में दर्द', 'छाती में भारीपन', 'सीने में दबाव'],
    redFlagId: 'EMERG-CARDIAC-ACS',
  },
  {
    concept: 'pain_radiation',
    label: 'Pain Radiating to Jaw or Left Arm',
    keywordsEn: ['radiating to jaw', 'radiating to left arm', 'shoulder pain', 'back pain with chest'],
    keywordsKn: ['ದವಡೆಗೆ ನೋವು', 'ಎಡ ಭುಜಕ್ಕೆ ನೋವು', 'ಎಡಗೈ ನೋವು'],
    keywordsHi: ['जबड़े में दर्द', 'बाएं हाथ में दर्द', 'कंधे में दर्द'],
    redFlagId: 'EMERG-CARDIAC-ACS',
  },
  {
    concept: 'diaphoresis',
    label: 'Profuse Sweating / Diaphoresis',
    keywordsEn: ['sweating', 'profuse sweat', 'cold clammy', 'diaphoresis', 'perspiration'],
    keywordsKn: ['ವಿಪರೀತ ಬೆವರು', 'ಬೆವರು ಸುರಿಯುವುದು', 'ತಣ್ಣನೆಯ ಬೆವರು'],
    keywordsHi: ['पसीना आना', 'बहुत ज्यादा पसीना', 'ठंडा पसीना'],
    redFlagId: 'EMERG-CARDIAC-ACS',
  },
  {
    concept: 'dyspnea',
    label: 'Shortness of Breath / Dyspnea',
    keywordsEn: ['shortness of breath', 'difficulty breathing', 'breathlessness', 'gasping', 'cannot breathe'],
    keywordsKn: ['ಉಸಿರಾಟದ ತೊಂದರೆ', 'ಉಸಿರು ಕಟ್ಟುವಿಕೆ', 'ದಮ್ಮು'],
    keywordsHi: ['सांस लेने में तकलीफ', 'सांस फूलना', 'दम घुटना'],
    redFlagId: 'EMERG-RESP-CRITICAL',
  },
  {
    concept: 'wheezing',
    label: 'Audible Wheezing / Stridor',
    keywordsEn: ['wheezing', 'whistling chest', 'stridor', 'audible sound when breathing'],
    keywordsKn: ['ಉಸಿರಿನಲ್ಲಿ ಸಿಳ್ಳೆ ಶಬ್ದ', 'ಎದೆಯಲ್ಲಿ ಗರಗರ ಶಬ್ದ', 'ಕೆಮ್ಮಿನ ಜೊತೆ ಶಬ್ದ'],
    keywordsHi: ['सीटी जैसी आवाज', 'घरघराहट', 'सांस में आवाज'],
    redFlagId: 'EMERG-RESP-CRITICAL',
  },
  {
    concept: 'fever',
    label: 'High Grade Fever / Chills',
    keywordsEn: ['fever', 'high temperature', 'chills', 'rigors', 'shivering'],
    keywordsKn: ['ಜ್ವರ', 'ವಿಪರೀತ ಜ್ವರ', 'ನಡುಕ'],
    keywordsHi: ['बुखार', 'तेज बुखार', 'कंपकंपी'],
  },
  {
    concept: 'altered_mental_status',
    label: 'Altered Mental Status / Confusion',
    keywordsEn: ['confusion', 'drowsy', 'disoriented', 'lethargic', 'not recognizing family', 'delirium'],
    keywordsKn: ['ಗೊಂದಲ', 'ಮಂಪರು', 'ಜ್ಞಾನ ತಪ್ಪುವುದು', 'ಎಚ್ಚರವಿಲ್ಲದಿರುವುದು'],
    keywordsHi: ['बेहोशी', 'भ्रम', 'सुस्ती', 'पहचानने में परेशानी'],
    redFlagId: 'EMERG-SHOCK-HYPOTENSION',
  },
  {
    concept: 'headache',
    label: 'Headache',
    keywordsEn: ['headache', 'head pain', 'pain in forehead', 'throbbing head'],
    keywordsKn: ['ತಲೆನೋವು', 'ತಲೆಯ ಭಾರ'],
    keywordsHi: ['सिरदर्द', 'सिर में दर्द', 'माथे में दर्द'],
  },
  {
    concept: 'abdominal_pain',
    label: 'Abdominal Pain',
    keywordsEn: ['stomach ache', 'abdominal pain', 'belly pain', 'cramps'],
    keywordsKn: ['ಹೊಟ್ಟೆ ನೋವು', 'ಹೊಟ್ಟೆ ಸೆಳೆತ'],
    keywordsHi: ['पेट दर्द', 'पेट में मरोड़'],
  },
];

/**
 * Detect language from text characters (Kannada Unicode block: 0x0C80-0x0CFF, Devanagari/Hindi: 0x0900-0x097F)
 */
export function detectLanguage(text: string): LanguageCode {
  let knCount = 0;
  let hiCount = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x0c80 && code <= 0x0cff) knCount++;
    else if (code >= 0x0900 && code <= 0x097f) hiCount++;
  }
  if (knCount > 2) return 'kn';
  if (hiCount > 2) return 'hi';
  return 'en';
}

/**
 * Local deterministic extraction fallback
 */
export function extractSymptomsLocally(transcript: string): SymptomExtractionResult {
  const lang = detectLanguage(transcript);
  const lower = transcript.toLowerCase();
  const extracted: ExtractedSymptom[] = [];
  const redFlags: string[] = [];

  for (const item of CLINICAL_LEXICON) {
    let matchedKeywords: string[] = [];
    if (lang === 'kn') {
      matchedKeywords = item.keywordsKn.filter((k) => transcript.includes(k));
    } else if (lang === 'hi') {
      matchedKeywords = item.keywordsHi.filter((k) => transcript.includes(k));
    }
    // Also test English terms in mixed language intake
    const enMatches = item.keywordsEn.filter((k) => lower.includes(k.toLowerCase()));
    const allMatches = [...matchedKeywords, ...enMatches];

    if (allMatches.length > 0) {
      extracted.push({
        concept: item.concept,
        label: item.label,
        reportedStatus: 'present',
        evidenceText: allMatches[0],
        confidence: 0.95,
      });
      if (item.redFlagId && !redFlags.includes(item.redFlagId)) {
        redFlags.push(item.redFlagId);
      }
    }
  }

  // Parse duration heuristically if present
  let duration = 'Reported acutely';
  const durationMatch = transcript.match(/(\d+)\s*(minute|min|hour|hr|day|week|ವಾರ|ಗಂಟೆ|ಘಂಟೆ|दिन|घंटे)/i);
  if (durationMatch) {
    duration = durationMatch[0];
  }

  return {
    languageDetected: lang,
    primaryComplaint: extracted.length > 0 ? extracted[0].label : transcript.slice(0, 80),
    onset: 'Acute onset',
    duration,
    severityScale: redFlags.length > 0 ? 8 : 4,
    symptoms: extracted,
    reportedRedFlags: redFlags,
    uncertainItems: [],
    missingInformation: extracted.length === 0 ? ['Specific clinical symptoms not recognized'] : [],
    requiresHumanConfirmation: true,
    extractionSource: 'LOCAL_DETERMINISTIC_PARSER',
  };
}

/**
 * Main AI extraction service using Gemini when API key is available,
 * falling back transparently to the deterministic multilingual parser.
 */
export async function extractSymptomsWithAI(transcript: string): Promise<SymptomExtractionResult> {
  const apiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Transparent, high-accuracy local deterministic fallback
    return extractSymptomsLocally(transcript);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a clinical NLP extractor for PulseGate. Extract reported symptoms from the following patient transcript. The transcript may be in English, Kannada (ಕನ್ನಡ), or Hindi (हिंदी).
Never diagnose or determine a triage category. Only extract explicitly reported factual concepts.

Transcript: "${transcript}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            languageDetected: { type: Type.STRING, enum: ['en', 'kn', 'hi'] },
            primaryComplaint: { type: Type.STRING },
            onset: { type: Type.STRING },
            duration: { type: Type.STRING },
            severityScale: { type: Type.INTEGER },
            symptoms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  concept: { type: Type.STRING },
                  label: { type: Type.STRING },
                  reportedStatus: { type: Type.STRING, enum: ['present', 'absent', 'unknown'] },
                  evidenceText: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                },
                required: ['concept', 'label', 'reportedStatus', 'evidenceText'],
              },
            },
            reportedRedFlags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            missingInformation: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['languageDetected', 'primaryComplaint', 'symptoms'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      languageDetected: parsed.languageDetected || detectLanguage(transcript),
      primaryComplaint: parsed.primaryComplaint || transcript.slice(0, 80),
      onset: parsed.onset || 'Not specified',
      duration: parsed.duration || 'Not specified',
      severityScale: parsed.severityScale || 5,
      symptoms: parsed.symptoms || [],
      reportedRedFlags: parsed.reportedRedFlags || [],
      uncertainItems: [],
      missingInformation: parsed.missingInformation || [],
      requiresHumanConfirmation: true,
      extractionSource: 'GEMINI_LLM',
    };
  } catch (err) {
    console.warn('Gemini extraction unavailable, engaging deterministic local fallback:', err);
    return extractSymptomsLocally(transcript);
  }
}
