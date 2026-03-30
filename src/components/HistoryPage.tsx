import { useState } from "react";
import { Printer, Trash2, ChevronRight, Check, Square, CheckSquare, FileText, Download, Loader2 } from "lucide-react";
import { WrongQuestionRecord } from "../types";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import ReactMarkdown from "react-markdown";

interface HistoryPageProps {
  records: WrongQuestionRecord[];
  onDelete: (ids: string[]) => void;
}

export default function HistoryPage({ records, onDelete }: HistoryPageProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<WrongQuestionRecord | null>(null);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === records.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map(r => r.id));
    }
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`确定要删除选中的 ${selectedIds.length} 条记录吗？`)) {
      onDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const generatePDF = async () => {
    if (selectedIds.length === 0) return;
    setIsPrinting(true);

    try {
      const selectedRecords = records.filter(r => selectedIds.includes(r.id));
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Create a hidden container for rendering
      const container = document.createElement("div");
      container.style.width = "800px";
      container.style.padding = "40px";
      container.style.backgroundColor = "white";
      container.style.color = "black";
      container.style.fontFamily = "sans-serif";
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      
      container.innerHTML = `
        <h1 style="text-align: center; font-size: 28px; margin-bottom: 30px;">错题举一反三练习集</h1>
        ${selectedRecords.map((record, i) => `
          <div style="margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px;">
            <div style="background: #f5f5f5; padding: 10px; font-size: 14px; font-weight: bold; margin-bottom: 15px;">
              知识点：${record.knowledgePoint}
            </div>
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 16px; color: #d32f2f; margin-bottom: 10px;">【原题】</h3>
              <div style="font-size: 14px; line-height: 1.6;">${record.originalQuestion.content.replace(/\n/g, "<br>")}</div>
            </div>
            ${record.variants.map((v, j) => `
              <div style="margin-bottom: 25px; padding-left: 15px; border-left: 3px solid #eee;">
                <h4 style="font-size: 15px; margin-bottom: 8px;">【变式练习 0${j + 1}】</h4>
                <div style="font-size: 14px; line-height: 1.6; margin-bottom: 10px;">${v.content.replace(/\n/g, "<br>")}</div>
                <div style="font-size: 13px; color: #2e7d32; font-weight: bold; margin-bottom: 5px;">答案：${v.answer}</div>
                <div style="font-size: 12px; color: #666; font-style: italic;">解析：${v.analysis.replace(/\n/g, "<br>")}</div>
              </div>
            `).join("")}
          </div>
        `).join("")}
      `;
      
      document.body.appendChild(container);
      
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      doc.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= doc.internal.pageSize.getHeight();
      
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        doc.addPage();
        doc.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= doc.internal.pageSize.getHeight();
      }
      
      document.body.removeChild(container);
      doc.save(`错题集_${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("PDF 生成失败，请重试");
    } finally {
      setIsPrinting(false);
    }
  };

  if (viewingRecord) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <button 
          onClick={() => setViewingRecord(null)}
          className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1 hover:text-black transition-colors"
        >
          <ChevronRight className="rotate-180" size={14} /> 返回列表
        </button>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{viewingRecord.knowledgePoint}</h2>
            <span className="text-xs text-gray-400">{new Date(viewingRecord.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded uppercase">原错题</span>
            </div>
            <div className="text-sm leading-relaxed text-gray-700 bg-gray-50 p-4 rounded-xl">
              <ReactMarkdown>{viewingRecord.originalQuestion.content}</ReactMarkdown>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">举一反三变式</h3>
            {viewingRecord.variants.map((v, i) => (
              <div key={i} className="space-y-3 p-4 border border-gray-100 rounded-xl">
                <div className="text-xs font-bold">变式 0{i + 1}</div>
                <div className="text-sm text-gray-600">
                  <ReactMarkdown>{v.content}</ReactMarkdown>
                </div>
                <div className="pt-2 space-y-2">
                  <p className="text-xs font-bold text-green-600">答案：{v.answer}</p>
                  <div className="text-xs text-gray-400 italic">
                    <ReactMarkdown>{v.analysis}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={selectAll}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
          >
            {selectedIds.length === records.length && records.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
            全选
          </button>
          {selectedIds.length > 0 && (
            <button 
              onClick={handleDelete}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={16} />
              删除 ({selectedIds.length})
            </button>
          )}
        </div>
        
        <button 
          onClick={generatePDF}
          disabled={selectedIds.length === 0 || isPrinting}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-30"
        >
          {isPrinting ? <Loader2 className="animate-spin" size={14} /> : <Printer size={14} />}
          打印 PDF
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {records.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-4">
            <FileText size={48} strokeWidth={1} />
            <p className="text-sm font-medium">暂无错题记录，快去识别吧</p>
          </div>
        ) : (
          records.map((record) => (
            <div 
              key={record.id}
              className={`bg-white rounded-2xl border transition-all flex items-stretch overflow-hidden group ${
                selectedIds.includes(record.id) ? "border-black ring-1 ring-black" : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <button 
                onClick={() => toggleSelect(record.id)}
                className={`w-12 flex items-center justify-center border-r border-gray-50 transition-colors ${
                  selectedIds.includes(record.id) ? "bg-black text-white" : "bg-gray-50 text-gray-300 group-hover:text-gray-400"
                }`}
              >
                {selectedIds.includes(record.id) ? <Check size={18} /> : <div className="w-4 h-4 rounded border-2 border-current" />}
              </button>

              <div 
                onClick={() => setViewingRecord(record)}
                className="flex-1 p-5 cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-[9px] font-bold rounded uppercase">
                      {record.knowledgePoint}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 line-clamp-1">
                    {record.originalQuestion.content}
                  </p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-black transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
