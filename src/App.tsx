/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { BookOpen, Camera, History, Printer, Trash2, ChevronRight, Plus, Loader2, Download, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import RecognitionPage from "./components/RecognitionPage";
import HistoryPage from "./components/HistoryPage";
import { WrongQuestionRecord } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"recognition" | "history">("recognition");
  const [records, setRecords] = useState<WrongQuestionRecord[]>([]);

  // Load records from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("wrong_questions");
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse records", e);
      }
    }
  }, []);

  const saveRecord = (record: WrongQuestionRecord) => {
    const newRecords = [record, ...records];
    setRecords(newRecords);
    localStorage.setItem("wrong_questions", JSON.stringify(newRecords));
  };

  const deleteRecords = (ids: string[]) => {
    const newRecords = records.filter(r => !ids.includes(r.id));
    setRecords(newRecords);
    localStorage.setItem("wrong_questions", JSON.stringify(newRecords));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
            <Printer size={18} />
          </div>
          错题打印机
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "recognition" ? (
            <motion.div
              key="recognition"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <RecognitionPage onSave={saveRecord} />
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <HistoryPage records={records} onDelete={deleteRecords} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center z-20">
        <button
          onClick={() => setActiveTab("recognition")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "recognition" ? "text-black" : "text-gray-400"
          }`}
        >
          <Camera size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">识别</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "history" ? "text-black" : "text-gray-400"
          }`}
        >
          <History size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">错题本</span>
        </button>
      </nav>
    </div>
  );
}
