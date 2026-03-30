import { GoogleGenAI, Type } from "@google/genai";
import { OCRResult, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function recognizeQuestion(base64Image: string): Promise<OCRResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    你是一个专业的OCR识别与学科专家。请识别图片中的题目内容。
    提取以下信息：
    1. 题目文本 (question)
    2. 选项 (options, 如果有)
    3. 用户回答 (userAnswer, 如果有)
    4. 标准答案 (standardAnswer, 如果有)
    5. 核心知识点 (knowledgePoint, 简短明了)

    请以 JSON 格式返回。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          userAnswer: { type: Type.STRING },
          standardAnswer: { type: Type.STRING },
          knowledgePoint: { type: Type.STRING },
        },
        required: ["question", "knowledgePoint"],
      },
    },
  });

  return JSON.parse(response.text || "{}") as OCRResult;
}

export async function generateVariants(originalQuestion: string, knowledgePoint: string): Promise<Question[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    基于以下原题和知识点，生成3道“举一反三”的变式题。
    原题：${originalQuestion}
    知识点：${knowledgePoint}

    要求：
    1. 题目难度与原题相当。
    2. 覆盖同一知识点的不同角度或变换式。
    3. 每道题必须包含：题目内容 (content)、正确答案 (answer)、解析 (analysis)。
    4. 解析中必须包含“易错点分析”。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            answer: { type: Type.STRING },
            analysis: { type: Type.STRING },
          },
          required: ["content", "answer", "analysis"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]") as Question[];
}
