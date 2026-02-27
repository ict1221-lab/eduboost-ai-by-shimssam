
import { GoogleGenAI, Type } from "@google/genai";
import { SchoolEvent } from "../types";

// Initialize GoogleGenAI with process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReportComments = async (studentInfo: string, keywords: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `교사로서 다음 학생의 생활기록부 행동발달 및 종합의견을 작성해줘. 
    학생 정보: ${studentInfo}
    핵심 키워드: ${keywords}
    문체는 정중하고 전문적인 어조로, 구체적인 사례를 상상해서 자연스럽게 연결해줘. 한국어 표준 맞춤법을 엄수해. 약 300자 내외로 작성해줘.`,
    config: {
      temperature: 0.7,
      topP: 0.9,
    },
  });
  return response.text;
};

export interface LessonPlanResult {
  text: string;
  links: { title: string; uri: string }[];
}

export const generateLessonPlan = async (topic: string, grade: string): Promise<LessonPlanResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `다음 주제에 대한 40분 분량의 수업 지도안을 작성해줘.
    학년: ${grade}
    주제: ${topic}
    구성: [학습목표], [준비물], [도입(동기유발, 5분)], [전개(활동 1, 2, 3, 30분)], [정리(마무리, 5분)]. 
    
    특히 중요: 각 단계별로 활용할 수 있는 '유튜브 교육 영상'과 '참고할 만한 PPT 자료'를 구글에서 검색해서 추천해줘. 
    지도안 본문 중간에 관련 링크가 어디에 쓰이면 좋을지 명시하고, 검색된 구체적인 URL들도 포함해줘.`,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });
  
  const text = response.text || '';
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const links = groundingChunks
    .map((chunk: any) => ({
      web: {
        title: chunk.web?.title || '관련 자료',
        uri: chunk.web?.uri || ''
      }
    }))
    .filter((chunk: any) => chunk.web.uri !== '')
    .map((chunk: any) => chunk.web);

  return { text, links };
};

export const generateParentNotice = async (context: string, grade: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `학부모님께 보낼 알림장 문구를 작성해줘. 
    대상 학년: 초등학교 ${grade}
    상황: ${context}. 
    문장 시작은 "안녕하세요, ${grade} 담임교사입니다."로 시작하고, 해당 학년 수준에 맞는 어휘와 톤을 사용해줘. 따뜻하고 신뢰감 가는 어조로 전문성 있게 작성해줘.`,
  });
  return response.text;
};

export const generateQuiz = async (content: string, count: number) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `다음 내용을 바탕으로 객관식 퀴즈 ${count}문항을 만들어줘. 
    내용: ${content}
    형식: 
    1. 문제
    가) 보기1
    나) 보기2
    다) 보기3
    라) 보기4
    정답: (번호)
    해설: (간략한 설명)`,
    config: {
      temperature: 0.5,
    }
  });
  return response.text;
};

export const getCommemorationMaterials = async (occasion: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `${occasion}에 관한 계기교육 자료를 만들어줘. 
    1. 이 날의 의미와 역사적 배경 요약
    2. 학생 수준별(초등/중등) 추천 활동 아이디어
    3. 수업에 바로 활용할 수 있는 유튜브 영상 링크와 학습지/PPT 자료 링크를 구글 검색을 통해 추천해줘.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || '';
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const links = groundingChunks
    .map((chunk: any) => ({
      web: {
        title: chunk.web?.title || '관련 리소스',
        uri: chunk.web?.uri || ''
      }
    }))
    .filter((chunk: any) => chunk.web.uri !== '')
    .map((chunk: any) => chunk.web);

  return { text, links };
};

export const askStudentRecordGuide = async (question: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `질문: ${question}
    
    위 질문에 대해 "2026학년도 학교생활기록부 기재요령"을 바탕으로 답변해줘. 
    만약 2026년 최신 기재요령에 명시된 특별한 변경사항이 있다면 강조해주고, 근거 조항이나 주의사항을 상세히 알려줘.
    답변은 교사가 현장에서 즉시 참고할 수 있도록 명확하고 전문적으로 작성해줘. 필요하다면 구글 검색을 활용하여 최신 지침(교육부 공식 발표 등)을 확인해줘.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "당신은 대한민국 교육부의 학교생활기록부 기재요령 전문가입니다. 2026학년도 최신 지침을 완벽하게 숙지하고 있으며, 교사들에게 정확한 가이드를 제공합니다."
    },
  });

  const text = response.text || '';
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const links = groundingChunks
    .map((chunk: any) => ({
      web: {
        title: chunk.web?.title || '관련 규정 확인',
        uri: chunk.web?.uri || ''
      }
    }))
    .filter((chunk: any) => chunk.web.uri !== '')
    .map((chunk: any) => chunk.web);

  return { text, links };
};

export const parseCalendarFromText = async (text: string): Promise<SchoolEvent[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `다음 텍스트에서 학교 학사 일정(날짜와 행사명)을 추출해서 JSON 배열 형식으로 응답해줘.
    텍스트: ${text}
    
    응답 형식: [{"date": "YYYY-MM-DD", "title": "행사명"}, ...]
    주의: 날짜 형식을 반드시 YYYY-MM-DD로 맞춰줘. 연도가 없으면 2026년으로 가정해.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            title: { type: Type.STRING }
          },
          required: ["date", "title"]
        }
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse calendar JSON", e);
    return [];
  }
};

export const parseCalendarFromImage = async (base64Data: string, mimeType: string): Promise<SchoolEvent[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "이 이미지에 포함된 학교 학사 일정(날짜와 행사명)을 추출해서 JSON 배열 형식으로 응답해줘. 응답 형식: [{\"date\": \"YYYY-MM-DD\", \"title\": \"행사명\"}, ...]. 날짜 형식을 반드시 YYYY-MM-DD로 맞춰줘. 연도가 없으면 2026년으로 가정해." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            title: { type: Type.STRING }
          },
          required: ["date", "title"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse calendar image JSON", e);
    return [];
  }
};
