import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  FileText, Code, Terminal, CheckCircle2, 
  Scissors, Network, AlertTriangle, 
  Cpu, UserCheck
} from "lucide-react";

interface DiagramProps {
  type: string;
  accentColor: "blue" | "teal" | "mint" | "lavender";
}

export const SlideDiagrams: React.FC<DiagramProps> = ({ type, accentColor }) => {
  // State handlers for interactive diagrams
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [frictionValue, setFrictionValue] = useState<number>(75); 
  const [selectedClankerFlow, setSelectedClankerFlow] = useState<"bot" | "human">("bot");
  const [lobotomyStep, setLobotomyStep] = useState<number>(0);
  const [mockTerminalLogs, setMockTerminalLogs] = useState<string[]>([
    "pi harness initialized.",
    "running in silent YOLO execution mode..."
  ]);

  const triggerMockToolExecution = (tool: string) => {
    setActiveTool(tool);
    let log = "";
    switch (tool) {
      case "Read":
        log = "→ read_file('src/App.tsx') [Lines 1-20] SUCCESS. Return pure string.";
        break;
      case "Write":
        log = "→ write_file('tests/unit.spec.ts', content) OVERWRITE SUCCESS.";
        break;
      case "Edit":
        log = "→ edit_file('config.ts') replaced [Target: 'v1'] -> [Replacement: 'v2'] cleanly.";
        break;
      case "Bash":
        log = "→ run_bash('npm run test') CODE 0: All tests compiled successfully.";
        break;
    }
    setMockTerminalLogs(prev => [...prev.slice(-3), log]);
  };

  const renderIntroDiagram = () => (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-tr from-gray-50 to-[#f8f9fa] opacity-60 z-0"></div>
      
      {/* Decorative Google I/O Shape Sets */}
      <div className="absolute top-10 left-10 w-24 h-24 rounded-full border-4 border-[#34a853]/20 border-dashed animate-spin [animation-duration:30s] z-0"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 rounded-3xl bg-[#1a73e8]/5 rotate-45 z-0"></div>
      
      {/* Animated Glowing Crest */}
      <motion.div 
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: [0, 10, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="w-48 h-48 rounded-full bg-gradient-to-tr from-[#1a73e8] via-[#8a4bf3] to-[#00796b] opacity-10 blur-xl absolute"
      />
      
      <div className="relative z-10 text-center flex flex-col items-center space-y-6 max-w-md">
        <div className="flex space-x-2">
          {[
            { color: "bg-[#1a73e8]", delay: 0 },
            { color: "bg-[#ea4335]", delay: 0.15 },
            { color: "bg-[#f9ab00]", delay: 0.3 },
            { color: "bg-[#34a853]", delay: 0.45 },
          ].map((dot, idx) => (
            <motion.span
              key={idx}
              className={`w-4 h-4 rounded-full ${dot.color}`}
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeOut",
                delay: dot.delay
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderMotivationDiagram = () => (
    <div className="w-full h-full flex flex-col justify-between p-6 bg-white rounded-3xl border border-gray-100 shadow-xs">
      <div className="text-center pb-2">
        <span className="text-[11px] font-mono bg-blue-50 text-[#1a73e8] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
          เครื่องมือพัง vs เครื่องมือคงทน
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 my-auto">
        <div className="p-4 rounded-2xl bg-[#ea4335]/5 border border-[#ea4335]/20 flex flex-col space-y-2">
          <div className="flex justify-between items-center text-[#ea4335]">
            <span className="font-mono text-xs font-bold uppercase">The Broken Hammer</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-400 leading-relaxed font-mono">
            Cloud Code ที่ซับซ้อนเกินจำเป็น มีฟีเจอร์แอปพลิเคชันปนเปื้อน รันโมเดลหลังบ้านที่ไม่เปิดเผย มีอาการกะพริบและบั๊กเปลี่ยนพฤติกรรมทุกเช้า
          </p>
          <div className="pt-2 flex flex-wrap gap-1">
            <span className="text-[8px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Unstable IDE</span>
            <span className="text-[8px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Telemetry Spill</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#00796b]/5 border border-[#00796b]/20 flex flex-col space-y-2">
          <div className="flex justify-between items-center text-[#00796b]">
            <span className="font-mono text-xs font-bold uppercase">The Solid Tool (pi)</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-mono">
            กล่องเครื่องมือโปร่งใส ปราศจากหนี้ทางเทคนิค เป็นส่วนขยายเจตจำนงของวิศวกรแบบหมดจด ไม่มีการพยายามเข้ามาตัดสินใจแทนมนุษย์
          </p>
          <div className="pt-2 flex flex-wrap gap-1">
            <span className="text-[8px] font-mono bg-[#e0f2f1] text-[#00796b] px-1.5 py-0.5 rounded font-bold">100% Transparent</span>
            <span className="text-[8px] font-mono bg-[#e0f2f1] text-[#00796b] px-1.5 py-0.5 rounded font-bold">Zero Overhead</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-2.5 rounded-xl text-center">
        <span className="text-[10px] text-gray-400 font-mono tracking-wide">
          "ค้อนต้องตอบสนองด้วยแรงคงเดิมในทุกการทุบกระแทก"
        </span>
      </div>
    </div>
  );

  const renderLobotomyDiagram = () => (
    <div className="w-full h-full flex flex-col justify-between p-6 bg-white rounded-3xl border border-gray-100 shadow-xs relative">
      <div className="text-center">
        <span className="text-[11px] font-mono bg-teal-50 text-[#00796b] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
          ความจำลู่หาย (Context Pruning Lobotomy)
        </span>
      </div>

      <div className="my-auto relative flex flex-col items-center py-4">
        {/* Memory Flow Lane */}
        <div className="w-full flex justify-between items-center border border-dashed border-gray-200 p-2 rounded-xl relative z-10 bg-white/80 max-w-md">
          <div className="text-[10px] font-mono bg-blue-50 text-blue-600 p-1.5 rounded text-center">
            <Cpu className="w-4 h-4 mx-auto mb-1" /> System Prompt
          </div>
          <div className="text-gray-300">→</div>
          
          <div className="relative">
            <div className={`text-[10px] font-mono p-1.5 rounded text-center transition-all ${
              lobotomyStep === 0 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800 line-through opacity-40"
            }`}>
              <Scissors className="w-4 h-4 mx-auto mb-1 animate-pulse" />
              Tool Result (10k Tokens)
            </div>
            {lobotomyStep === 1 && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.1, 1], opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute -top-2 -right-2 bg-red-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded-sm"
              >
                Cut!
              </motion.span>
            )}
          </div>
          
          <div className="text-gray-300">→</div>
          <div className="text-[10px] font-mono bg-emerald-50 text-emerald-800 p-1.5 rounded text-center">
            <Network className="w-4 h-4 mx-auto mb-1" /> Next Token Output
          </div>
        </div>

        <div className="mt-4 p-3 rounded-2xl bg-gray-50 w-full max-w-md border border-gray-100 text-left">
          <div className="font-mono text-[11px] text-gray-500 flex items-center justify-between">
            <span>กลไก Pruning ทั่วไป:</span>
            <button 
              onClick={() => setLobotomyStep(prev => prev === 0 ? 1 : 0)}
              className="text-xs bg-[#00796b] text-white px-2 py-0.5 rounded-md hover:bg-[#005a50]"
            >
              {lobotomyStep === 0 ? "ลองสั่งตัด Context" : "ย้อนกลับ"}
            </button>
          </div>
          <p className="text-[11px] font-mono mt-1 text-gray-400 leading-relaxed">
            {lobotomyStep === 0 
              ? "เฟรมเวิร์กทั่วไปสุ่มสั่งลบประวัติคำตอบหรือผลลัพธ์ของไฟล์เดิมจาก Context ทันทีที่ข้อความเฉลี่ยเกินลิมิต ทำให้โมเดลจดจำงานตัวเองไม่ได้"
              : "โมเดลสูญเสียตระหนักรู้ ส่งผลให้เกิดปฏิกิริยาลูปซ้ำซ้อน เพราะความรู้เพิ่งสร้างโดนตัดทิ้งโดยพลการ"}
          </p>
        </div>
      </div>

      <div className="text-center font-mono text-[10px] text-gray-400">
        * pi แก้ไขโดยการห่อหุ้ม Context แบบคงสถานะเดิมตลอดอายุเซสชัน
      </div>
    </div>
  );

  const renderBenchmarkDiagram = () => (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-white rounded-3xl border border-gray-100 shadow-xs font-mono text-xs">
      <div className="text-center pb-2">
        <span className="text-[11px] bg-green-50 text-[#34a853] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
          Terminal Bench Accuracy Verdict
        </span>
      </div>

      <div className="space-y-4 my-auto">
        <div className="space-y-1">
          <div className="flex justify-between font-bold text-[10.5px]">
            <span>1. tmux Terminal Keystroke system (pi style)</span>
            <span className="text-[#34a853]">88.5% Accuracy</span>
          </div>
          <div className="w-full bg-gray-100 h-6.5 rounded-full overflow-hidden relative border border-gray-100 flex items-center px-2 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "88.5%" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="bg-[#34a853] h-full absolute left-0 top-0 opacity-85"
            />
            <span className="relative z-10 text-white font-bold text-[10px] pl-1">Minimalist Masterpiece</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-gray-400 text-[10.5px]">
            <span>2. Standard File Operations with High Abstractions</span>
            <span>54.2% Accuracy</span>
          </div>
          <div className="w-full bg-gray-100 h-6.5 rounded-full overflow-hidden relative flex items-center px-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "54.2%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="bg-yellow-500 h-full absolute left-0 top-0 opacity-70"
            />
            <span className="relative z-10 text-white font-bold text-[10px] pl-1">Moderate Bloat</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-gray-400 text-[10.5px]">
            <span>3. High Abstraction Auto-reviewer & Sub-agents</span>
            <span className="text-red-500">41.8% Accuracy</span>
          </div>
          <div className="w-full bg-gray-100 h-6.5 rounded-full overflow-hidden relative flex items-center px-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "41.8%" }}
              transition={{ duration: 1.0, ease: "easeOut" }}
              className="bg-red-500 h-full absolute left-0 top-0 opacity-60"
            />
            <span className="relative z-10 text-white font-bold text-[10px] pl-1">Lobotomized Slop</span>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 p-2.5 rounded-xl text-center text-[10px] font-bold">
        "การพยายามสร้าง Abstraction ที่มากเกินไปคือศัตรูของประสิทธิภาพ"
      </div>
    </div>
  );

  const renderToolsDiagram = () => (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-gray-950 rounded-3xl border border-gray-800 shadow-lg text-white font-mono text-xs">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <div className="flex space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
        </div>
        <span className="text-[10px] text-gray-400 tracking-wider">PI_4_TOOLS_HARNESS.EXE</span>
      </div>

      <div className="grid grid-cols-2 gap-2 my-2">
        {[
          { name: "Read", desc: "อ่านไฟล์สด", icon: FileText, color: "text-blue-400 hover:bg-blue-950/40 hover:border-blue-800" },
          { name: "Write", desc: "เขียนไฟล์ทดแทน", icon: Code, color: "text-green-400 hover:bg-green-950/40 hover:border-green-800" },
          { name: "Edit", desc: "ขัดสกัดเฉพาะจุด", icon: Scissors, color: "text-purple-400 hover:bg-purple-950/40 hover:border-purple-800" },
          { name: "Bash", desc: "คุมคำสั่งเชลล์ดิบ", icon: Terminal, color: "text-amber-400 hover:bg-amber-950/40 hover:border-amber-800" }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.name}
              onClick={() => triggerMockToolExecution(t.name)}
              className={`p-3 rounded-xl border border-gray-800 bg-gray-900/60 text-left transition-all relative ${t.color} ${
                activeTool === t.name ? "border-white bg-gray-800/80 ring-1 ring-white/10" : "border-gray-800"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4" />
                <span className="font-bold text-xs">{t.name}</span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1">{t.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-gray-905 border border-gray-800 rounded-xl p-2 h-20 overflow-y-auto">
        <span className="text-[8px] text-gray-500 block">// Real-time Terminal Log (คลิกเลือกปุ่มด้านบนเพื่อทดสอบ):</span>
        {mockTerminalLogs.map((log, index) => (
          <div key={index} className="text-[8.5px] text-gray-300 mt-0.5 leading-tight truncate">
            {log}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSelfModDiagram = () => (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-white rounded-3xl border border-gray-100 shadow-xs relative">
      <div className="text-center font-mono">
        <span className="text-[11px] bg-purple-50 text-[#8a4bf3] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
          ความตระหนักรู้และการพัฒนาตนเอง
        </span>
      </div>

      <div className="my-auto relative flex flex-col items-center">
        {/* Simple Loop visual */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-dashed border-[#8a4bf3]/40"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute inset-1.5 rounded-full border border-dashed border-teal-400/40"
          />
          <div className="bg-[#8a4bf3]/5 rounded-full w-20 h-20 flex flex-col items-center justify-center border border-[#8a4bf3]/10">
            <Cpu className="w-6 h-6 text-[#8a4bf3] mb-0.5 animate-pulse" />
            <span className="text-[8px] text-[#8a4bf3] font-bold font-mono">SELF_MOD</span>
          </div>
        </div>

        <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100 max-w-sm text-left">
          <span className="font-bold text-[10px] text-[#8a4bf3] block font-mono">HOW IT WORKS:</span>
          <p className="text-[10px] text-gray-650 leading-relaxed font-mono mt-1">
            pi บรรจุข้อมูลเอกสารสถาปัตยกรรมตัวเองและซอร์สโค้ด และเมื่อรันคำสั่งพิเศษ โมเดลจะสามารถเขียน .ts extensions มาอัปเดตแกนหลักตัวเอง สัญญะความโปร่งใสแบบสมบูรณ์
          </p>
        </div>
      </div>

      <div className="text-center font-mono text-[9px] text-gray-400">
        "พล็อตความสามารถไปจนถึงการติดตั้งเกม Doom ได้ด้วยตัวเอง"
      </div>
    </div>
  );

  const renderClankersDiagram = () => (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-white rounded-3xl border border-gray-100 shadow-xs font-mono">
      <div className="text-center">
        <span className="text-[11px] bg-red-50 text-red-600 px-3 py-1 rounded-full uppercase tracking-wider font-bold">
          The Human-Only defense Flowchrt
        </span>
      </div>

      <div className="my-auto space-y-4">
        {/* Toggle option */}
        <div className="flex justify-center space-x-2">
          <button 
            onClick={() => setSelectedClankerFlow("bot")}
            className={`px-3 py-1 rounded-xl text-[10px] border transition-all ${
              selectedClankerFlow === "bot" 
                ? "bg-red-50 text-red-600 border-red-200 font-bold" 
                : "border-gray-200 text-gray-500 hover:text-gray-900 bg-white"
            }`}
          >
            บอทสแปม (Clanker)
          </button>
          <button 
            onClick={() => setSelectedClankerFlow("human")}
            className={`px-3 py-1 rounded-xl text-[10px] border transition-all ${
              selectedClankerFlow === "human" 
                ? "bg-emerald-50 text-emerald-600 border-emerald-200 font-bold" 
                : "border-gray-200 text-gray-500 hover:text-gray-900 bg-white"
            }`}
          >
            วิศวกรจริง (Human)
          </button>
        </div>

        {/* Visual Animation Container */}
        <div className="h-24 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-around relative overflow-hidden">
          {selectedClankerFlow === "bot" ? (
            <>
              {/* Bot Animation */}
              <motion.div 
                animate={{ x: [0, 80] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex flex-col items-center text-red-500"
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="text-[7.5px] mt-0.5">Spam Bot</span>
              </motion.div>
              
              <div className="w-2.5 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-[8px] font-bold relative">
                <span className="absolute -top-3 text-[7.5px] text-red-600 uppercase font-bold whitespace-nowrap">Human-only Wall</span>
              </div>
              
              <div className="text-gray-300 opacity-60 flex flex-col items-center">
                <UserCheck className="w-5 h-5" />
                <span className="text-[7.5px] mt-0.5">PR Reject</span>
              </div>
            </>
          ) : (
            <>
              {/* Human Animation */}
              <motion.div 
                animate={{ x: [0, 160] }}
                transition={{ duration: 3, ease: "easeOut" }}
                className="flex flex-col items-center text-emerald-600"
              >
                <UserCheck className="w-5 h-5" />
                <span className="text-[7.5px] mt-0.5">Contributor</span>
              </motion.div>

              <div className="w-2.5 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold relative">
                <span className="absolute -top-3 text-[7.5px] text-emerald-600 uppercase font-bold whitespace-nowrap">Vouched Pass</span>
              </div>
              
              <div className="text-emerald-600 flex flex-col items-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </motion.div>
                <span className="text-[7.5px] mt-0.5 font-bold">Auto-Merged</span>
              </div>
            </>
          )}
        </div>

        {/* Info Box */}
        <p className="text-[10px] text-gray-400 text-center mx-auto max-w-xs">
          {selectedClankerFlow === "bot" 
            ? "ผลลัพธ์: Clanker ส่งบอทเข้ายิงสแปมโค้ดอัตโนมัติหละหลวม แต่ต้องถอยร่นเพราะไม่มีมนุษย์มาตอบ Issue บังคับของระบบ"
            : "ผลลัพธ์: วิศวกรรมระบบแท้ที่เขียน Issue ปาร์ตี้ด้วยภาษาจริง จะถูกบันทึกชื่อไว้ใน Vouch File และผ่านทางด่วนเสมอ"}
        </p>
      </div>
    </div>
  );

  const renderOurobourosDiagram = () => (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-white rounded-3xl border border-gray-100 shadow-xs font-mono">
      <div className="text-center">
        <span className="text-[11px] bg-purple-50 text-purple-600 px-3 py-1 rounded-full uppercase tracking-wider font-bold">
          The AI Ouroboros (งูกินหาง)
        </span>
      </div>

      <div className="my-auto flex flex-col items-center relative py-2">
        <svg className="w-32 h-32 text-purple-600" viewBox="0 0 100 100">
          {/* Ouroboros Circle */}
          <motion.circle 
            cx="50" cy="50" r="35" 
            fill="transparent" 
            stroke="currentColor" 
            strokeWidth="3.5" 
            strokeDasharray="6 3"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          />
          {/* Arrow heads on circumference to visually imply eating itself */}
          <circle cx="50" cy="15" r="4.5" fill="red" />
          <text x="50" y="12" fill="red" className="text-[7px] font-bold text-center" textAnchor="middle">POISON_DATA</text>
        </svg>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center bg-white p-1 rounded-full">
          <span className="text-[9px] text-red-600 font-bold whitespace-nowrap block animate-pulse">
            ขยะป้อนขยะ (Slop Loop)
          </span>
        </div>

        <div className="mt-3 p-3 bg-red-50/50 rounded-xl border border-red-100/60 max-w-sm text-left">
          <p className="text-[9.5px] text-red-950/80 leading-relaxed">
            เมื่อ AI นำโค้ดเฉลี่ยไร้มาตรฐานบนอินเทอร์เน็ตที่ปะปนข้อมูลสวะ (Slop) มาฝึกสอน จากนั้นประยุกต์รันโมเดลสังเคราะห์โค้ดใหม่วนซ้ำ ระบบความมั่นคงของวิศวกรรมจะพังทลายอย่างถาวร
          </p>
        </div>
      </div>
    </div>
  );

  const renderFrictionDiagram = () => (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-white rounded-3xl border border-gray-100 shadow-xs font-mono">
      <div className="text-center">
        <span className="text-[11px] bg-[#e6f4ea] text-[#34a853] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
          เครื่องเลื่อนวัดระดับ Cognitive Friction
        </span>
      </div>

      <div className="my-auto space-y-4 px-2">
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>ความหนืดน้อย (Zero Friction)</span>
          <span>ความปลอดภัยสูง (Strong Friction)</span>
        </div>
        
        {/* HTML5 Range slider for friction interactivity */}
        <div className="relative">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={frictionValue} 
            onChange={(e) => setFrictionValue(Number(e.target.value))}
            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#34a853]"
          />
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#34a853] bg-[#e6f4ea] px-2 py-0.5 rounded">
            Friction: {frictionValue}%
          </span>
        </div>

        {/* Dynamic Metric displays */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-2 bg-gray-50 rounded-xl text-center">
            <span className="text-[8px] text-gray-400 block">ปริมาณข้อมูล Slop ในหัว</span>
            <span className={`text-base font-bold ${frictionValue < 40 ? "text-red-500" : "text-gray-700"}`}>
              {100 - frictionValue}%
            </span>
          </div>

          <div className="p-2 bg-gray-50 rounded-xl text-center">
            <span className="text-[8px] text-gray-400 block">Mental Model (ความจำแท้)</span>
            <span className={`text-base font-bold ${frictionValue > 60 ? "text-[#34a853]" : "text-gray-700"}`}>
              {frictionValue}%
            </span>
          </div>
        </div>

        <p className="text-[9.5px] text-gray-400 text-center leading-relaxed">
          {frictionValue < 40 
            ? "⚠️ การก้าวผ่านการคิดและปล่อยให้ AI ทำแทนทุกอย่างแบบลื่นไหล จะนำไปสู่สัญชาตญาณความขี้เกียจและพังพินาศ" 
            : "✔️ ความหนืดที่มีประสิทธิภาพจากการเค้นความคิดด้วยตนเอง ช่วยรักษาความรัดกุมแห่งเจ้าของโค้ดเบส"}
        </p>
      </div>

      <div className="text-center text-[8.5px] text-gray-400">
        * ลองขยับสไลเดอร์เพื่อดูผลกระทบของการเร่งความเร็ว
      </div>
    </div>
  );

  const renderSummaryDiagram = () => (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-gradient-to-b from-white to-[#f8f9fa] rounded-3xl border border-gray-100 shadow-xs font-mono">
      <div className="text-center">
        <span className="text-[11px] bg-blue-50 text-[#1a73e8] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
          สรุปรอบด้าน (Material Checklist)
        </span>
      </div>

      <div className="my-auto space-y-2 max-w-sm mx-auto">
        {[
          { label: "1. YOLO as Architecture, Docker as Container", active: true },
          { label: "2. Limit Scopes (ระบุขอบเขตการทำงานจำกัด)", active: true },
          { label: "3. Read Every Single Line of Code", active: true },
          { label: "4. Slow down & Enjoy Cognitive Friction", active: true }
        ].map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2.5 p-2 bg-white/90 border border-gray-100 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-[#34a853] shrink-0" />
            <span className="text-[10px] text-gray-700 font-bold">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="text-center text-[10px] text-gray-400">
        Google Product Design Lab • 2026
      </div>
    </div>
  );


  const renderKafkaDiagram = () => {
    const eventLabels = ["สร้างออเดอร์", "จ่ายเงินสำเร็จ", "จองสต็อกแล้ว", "พร้อมส่งของ"];
    const partitions = [
      { name: "P0", broker: "Broker 1", color: "bg-[#1a73e8]" },
      { name: "P1", broker: "Broker 2", color: "bg-[#00796b]" },
      { name: "P2", broker: "Broker 3", color: "bg-[#8a4bf3]" }
    ];
    const brokerRows = [
      { name: "Broker 1", parts: ["payments-0", "orders-2"], active: true },
      { name: "Broker 2", parts: ["payments-1", "orders-0"], active: true },
      { name: "Broker 3", parts: ["payments-2", "orders-1"], active: true }
    ];

    if (type === "kafka-story") {
      return (
        <div className="w-full h-full bg-white rounded-3xl border border-gray-100 shadow-xs p-6 overflow-hidden relative font-mono">
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-[#1a73e8]/8 via-[#00796b]/8 to-[#8a4bf3]/10"
            animate={{ opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10 h-full flex flex-col justify-between">
            <span className="self-start text-[11px] bg-blue-50 text-[#1a73e8] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
              แผนที่ Event Streaming
            </span>
            <div className="grid grid-cols-3 gap-4 items-center">
              {["แอปสร้าง Event", "Kafka เก็บไทม์ไลน์", "หลายทีม Replay ได้"].map((label, idx) => (
                <motion.div
                  key={label}
                  className="h-32 rounded-3xl border border-gray-100 bg-white/90 shadow-xs p-4 flex flex-col justify-center text-center"
                  animate={{ y: [0, idx === 1 ? -10 : -4, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: idx * 0.35, ease: "easeInOut" }}
                >
                  <span className="text-3xl font-black text-gray-900">{idx + 1}</span>
                  <span className="text-[11px] text-gray-500 font-bold leading-tight">{label}</span>
                </motion.div>
              ))}
            </div>
            <div className="relative h-24">
              {[0, 1, 2, 3, 4].map((idx) => (
                <motion.span
                  key={idx}
                  className="absolute top-8 left-0 w-8 h-8 rounded-full bg-[#1a73e8] text-white text-[10px] font-bold flex items-center justify-center shadow-lg"
                  animate={{ x: ["0%", "820%"], scale: [0.8, 1, 0.8] }}
                  transition={{ duration: 4.5, repeat: Infinity, delay: idx * 0.55, ease: "linear" }}
                >
                  e{idx}
                </motion.span>
              ))}
              <div className="absolute top-12 left-0 right-0 h-1 rounded-full bg-gray-100" />
            </div>
          </div>
        </div>
      );
    }

    if (type === "kafka-log") {
      return (
        <div className="w-full h-full bg-white rounded-3xl border border-gray-100 shadow-xs p-5 font-mono flex flex-col justify-between">
          <span className="self-start text-[11px] bg-teal-50 text-[#00796b] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
            Log แบบต่อท้ายเท่านั้น
          </span>
          <div className="space-y-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
                <div className="flex justify-between text-[10px] text-gray-400 mb-2">
                  <span>partition-{row}</span>
                  <span>offset เพิ่มขึ้น →</span>
                </div>
                <div className="flex gap-2 overflow-hidden">
                  {[0, 1, 2, 3, 4].map((offset) => (
                    <motion.div
                      key={offset}
                      className={`min-w-16 h-14 rounded-xl border flex flex-col items-center justify-center ${
                        offset === 4 ? "bg-[#e0f2f1] border-[#00796b]/20" : "bg-white border-gray-200"
                      }`}
                      animate={offset === 4 ? { boxShadow: ["0 0 0 0 rgba(0,121,107,0)", "0 0 0 8px rgba(0,121,107,0.10)", "0 0 0 0 rgba(0,121,107,0)"] } : {}}
                      transition={{ duration: 1.8, repeat: Infinity, delay: row * 0.25 }}
                    >
                      <span className="text-[9px] text-gray-400">ออฟเซ็ต</span>
                      <span className="text-lg font-black text-gray-900">{offset}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center">Consumer จำ offset ของตัวเอง; Kafka เก็บ log ไว้ตาม retention.</p>
        </div>
      );
    }

    if (type === "kafka-partitions") {
      return (
        <div className="w-full h-full bg-white rounded-3xl border border-gray-100 shadow-xs p-5 font-mono flex flex-col justify-between">
          <span className="self-start text-[11px] bg-purple-50 text-purple-600 px-3 py-1 rounded-full uppercase tracking-wider font-bold">
            Key เลือก Partition
          </span>
          <div className="grid grid-cols-2 gap-5 items-center">
            <div className="space-y-2">
              {eventLabels.map((event, idx) => (
                <motion.div
                  key={event}
                  className="rounded-2xl bg-gray-50 border border-gray-100 p-3 text-[11px] text-gray-700 font-bold"
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                >
                  key: customer-{idx % 3} · {event}
                </motion.div>
              ))}
            </div>
            <div className="space-y-3">
              {partitions.map((partition) => (
                <div key={partition.name} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-xs">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                    <span>{partition.name}</span>
                    <span>{partition.broker}</span>
                  </div>
                  <div className="h-5 rounded-full bg-gray-100 overflow-hidden">
                    <motion.div
                      className={`h-full ${partition.color}`}
                      animate={{ width: ["25%", "82%", "25%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center">Key เดียวกัน → Partition เดียวกัน → ลำดับของ Key นั้นคงเดิม</p>
        </div>
      );
    }

    if (type === "kafka-brokers") {
      return (
        <div className="w-full h-full bg-white rounded-3xl border border-gray-100 shadow-xs p-5 font-mono flex flex-col justify-between">
          <span className="self-start text-[11px] bg-blue-50 text-[#1a73e8] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
            Cluster ของ Broker
          </span>
          <div className="grid grid-cols-3 gap-3">
            {brokerRows.map((broker, idx) => (
              <motion.div
                key={broker.name}
                className="rounded-3xl border border-gray-100 bg-gray-50 p-4 min-h-64"
                animate={{ y: [0, idx === 1 ? -8 : -4, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: idx * 0.25, ease: "easeInOut" }}
              >
                <div className="text-sm font-black text-gray-900 mb-4">{broker.name}</div>
                <div className="space-y-3">
                  {broker.parts.map((part) => (
                    <div key={part} className="rounded-2xl bg-white border border-gray-200 p-3 text-[11px] text-gray-600">
                      {part}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center">Partition กระจายพื้นที่เก็บข้อมูลและ traffic ไปหลายเครื่อง</p>
        </div>
      );
    }

    if (type === "kafka-consumers") {
      return (
        <div className="w-full h-full bg-white rounded-3xl border border-gray-100 shadow-xs p-5 font-mono flex flex-col justify-between">
          <span className="self-start text-[11px] bg-green-50 text-[#34a853] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
            Consumer Group แบบขนาน
          </span>
          <div className="grid grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              {partitions.map((partition, idx) => (
                <div key={partition.name} className="rounded-2xl bg-gray-50 border border-gray-100 p-3 flex items-center justify-between">
                  <span className="text-gray-900 font-black">{partition.name}</span>
                  <motion.span
                    className="w-8 h-8 rounded-full bg-[#34a853] text-white text-[10px] font-bold flex items-center justify-center"
                    animate={{ x: [0, 150, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: idx * 0.45, ease: "easeInOut" }}
                  >
                    msg
                  </motion.span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {["Consumer A", "Consumer B", "Consumer C"].map((consumer, idx) => (
                <div key={consumer} className="rounded-2xl bg-[#e6f4ea] border border-[#34a853]/20 p-4 text-center">
                  <span className="text-sm font-black text-gray-900">{consumer}</span>
                  <span className="block text-[10px] text-gray-500 mt-1">ถือ P{idx}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center">ใน Group เดียวกัน Partition หนึ่งถูกประมวลผลโดย Consumer หนึ่งตัว ณ เวลาหนึ่ง</p>
        </div>
      );
    }

    if (type === "kafka-replication") {
      return (
        <div className="w-full h-full bg-white rounded-3xl border border-gray-100 shadow-xs p-5 font-mono flex flex-col justify-between">
          <span className="self-start text-[11px] bg-red-50 text-[#ea4335] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
            Leader และ Follower
          </span>
          <div className="grid grid-cols-3 gap-3 items-center">
            {["Leader", "Follower", "Follower"].map((role, idx) => (
              <div key={role + idx} className={`rounded-3xl border p-4 min-h-56 flex flex-col justify-between ${
                idx === 0 ? "bg-[#fce8e6] border-[#ea4335]/20" : "bg-gray-50 border-gray-100"
              }`}>
                <span className="text-sm font-black text-gray-900">{role}</span>
                <motion.div
                  className={`h-20 rounded-2xl ${idx === 0 ? "bg-[#ea4335]" : "bg-gray-300"}`}
                  animate={{ opacity: idx === 0 ? [0.85, 1, 0.85] : [0.45, 0.85, 0.45] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: idx * 0.3 }}
                />
                <span className="text-[10px] text-gray-500">สำเนา Partition</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3 text-center text-[10px] text-gray-500">
            ถ้า Broker ที่เป็น Leader ตาย Follower ที่ตามทันสามารถรับช่วงต่อได้
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-white rounded-3xl border border-gray-100 shadow-xs p-5 font-mono flex flex-col justify-between">
        <span className="self-start text-[11px] bg-teal-50 text-[#00796b] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
          Retention และ Replay
        </span>
        <div className="relative h-56 rounded-3xl bg-gray-50 border border-gray-100 p-5 overflow-hidden">
          <div className="absolute top-1/2 left-5 right-5 h-2 rounded-full bg-gray-200" />
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="absolute top-[42%]" style={{ left: `${8 + idx * 16}%` }}>
              <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-xs font-black text-gray-700 shadow-xs">
                {idx}
              </div>
            </div>
          ))}
          <motion.div
            className="absolute top-[24%] w-14 h-14 rounded-full bg-[#00796b] text-white text-[10px] font-black flex items-center justify-center shadow-lg"
            animate={{ left: ["6%", "72%", "24%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            อ่าน
          </motion.div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-[10px]">
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3 text-gray-500">Consumer หยุด อ่านต่อ และ replay จาก offset เก่าได้</div>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3 text-gray-500">Retention ตัดสินว่า Event เก่าถูกลบเมื่อไร ไม่ใช่การอ่านของ Consumer</div>
        </div>
      </div>
    );
  };

  // Selector
  switch (type) {
    case "intro": return renderIntroDiagram();
    case "motivation": return renderMotivationDiagram();
    case "lobotomy": return renderLobotomyDiagram();
    case "benchmark": return renderBenchmarkDiagram();
    case "tools": return renderToolsDiagram();
    case "self-mod": return renderSelfModDiagram();
    case "clankers": return renderClankersDiagram();
    case "ourobouros": return renderOurobourosDiagram();
    case "friction": return renderFrictionDiagram();
    case "summary": return renderSummaryDiagram();
    case "kafka-story":
    case "kafka-log":
    case "kafka-partitions":
    case "kafka-brokers":
    case "kafka-consumers":
    case "kafka-replication":
    case "kafka-retention":
      return renderKafkaDiagram();
    default: return renderIntroDiagram();
  }
};
