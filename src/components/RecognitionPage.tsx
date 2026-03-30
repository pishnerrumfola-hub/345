import React, { useState, useRef } from "react";
import { Camera, Upload, Loader2, Sparkles, Save, RefreshCw, CheckCircle2 } from "lucide-react";
import { recognizeQuestion, generateVariants } from "../services/gemini";
import { OCRResult, Question, WrongQuestionRecord } from "../types";
import ReactMarkdown from "react-markdown";

interface RecognitionPageProps {
  onSave: (record: WrongQuestionRecord) => void;
}

export default function RecognitionPage({ onSave }: RecognitionPageProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [variants, setVariants] = useState<Question[]>([]);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setOcrResult(null);
        setVariants([]);
        setSaved(false);
        performRecognition(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const performRecognition = async (base64: string) => {
    setIsRecognizing(true);
    try {
      const result = await recognizeQuestion(base64);
      setOcrResult(result);
    } catch (error) {
      console.error("Recognition failed", error);
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleGenerate = async () => {
    if (!ocrResult) return;
    setIsGenerating(true);
    try {
      const result = await generateVariants(ocrResult.question, ocrResult.knowledgePoint);
      setVariants(result);
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!ocrResult || variants.length === 0) return;
    const record: WrongQuestionRecord = {
      id: Date.now().toString(),
      originalQuestion: {
        content: ocrResult.question,
        answer: ocrResult.standardAnswer,
        analysis: "",
      },
      knowledgePoint: ocrResult.knowledgePoint,
      variants: variants,
      createdAt: Date.now(),
    };
    onSave(record);
    setSaved(true);
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-video bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors relative group"
        >
          {image ? (
            <img src={image} alt="Uploaded" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                <Upload size={24} />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-500">点击上传或拍摄错题</p>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      </section>

      {/* Recognition Results */}
      {isRecognizing && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="animate-spin text-black" size={32} />
          <p className="text-sm text-gray-500 font-medium">正在识别题目内容...</p>
        </div>
      )}

      {ocrResult && !isRecognizing && (
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">识别结果</span>
              <span className="px-2 py-1 bg-black text-white text-[10px] font-bold rounded uppercase">
                {ocrResult.knowledgePoint}
              </span>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase">题目内容</label>
              <textarea 
                value={ocrResult.question}
                onChange={(e) => setOcrResult({ ...ocrResult, question: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-black transition-all min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">我的回答</label>
                <input 
                  value={ocrResult.userAnswer}
                  onChange={(e) => setOcrResult({ ...ocrResult, userAnswer: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">标准答案</label>
                <input 
                  value={ocrResult.standardAnswer}
                  onChange={(e) => setOcrResult({ ...ocrResult, standardAnswer: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black transition-all"
                />
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-black text-white rounded-xl py-4 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              生成举一反三
            </button>
          </div>
        </section>
      )}

      {/* Generation Results */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="animate-spin text-black" size={32} />
          <p className="text-sm text-gray-500 font-medium">正在基于知识点生成变式题...</p>
        </div>
      )}

      {variants.length > 0 && !isGenerating && (
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">举一反三变式题</h3>
            <button onClick={handleGenerate} className="text-gray-400 hover:text-black transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {variants.map((v, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold">
                    0{i + 1}
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase">变式练习</span>
                </div>
                <div className="text-sm leading-relaxed text-gray-700">
                  <ReactMarkdown>{v.content}</ReactMarkdown>
                </div>
                <div className="pt-4 border-t border-gray-50 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded uppercase">答案</span>
                    <p className="text-xs font-medium">{v.answer}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase">解析</span>
                    <div className="text-xs text-gray-500 leading-relaxed">
                      <ReactMarkdown>{v.analysis}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleSave}
            disabled={saved}
            className={`w-full rounded-xl py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              saved ? "bg-green-500 text-white" : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {saved ? "已保存到错题本" : "保存整套题目"}
          </button>
        </section>
      )}
    </div>
  );
}
