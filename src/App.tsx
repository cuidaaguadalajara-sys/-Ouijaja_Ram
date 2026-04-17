/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { Ghost, Send, Trash2, HelpCircle, Volume2, VolumeX } from 'lucide-react';

// --- Types ---

interface Position {
  x: number;
  y: number;
}

interface Target {
  id: string;
  label: string;
  pos: Position;
}

// --- Constants ---

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const NUMBERS = "0123456789".split("");
const SPECIAL = ["YES", "NO", "GOODBYE"];

// --- Helper Functions ---

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getSpiritAnswer(question: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: `You are a spirit communicating through an Ouija board. 
      The user asks: "${question}"
      Respond briefly in uppercase characters. 
      Only use letters A-Z, numbers 0-9, and the words YES, NO, or GOODBYE.
      Keep answers under 20 characters if possible.
      Be cryptic, spooky, or slightly helpful.
      Format: Just the string response.`,
    });
    return response.text.toUpperCase().trim();
  } catch (error) {
    console.error("Spirit connection failed:", error);
    return "GOODBYE";
  }
}

// --- Components ---

export default function App() {
  const [question, setQuestion] = useState("");
  const [isCommunicating, setIsCommunicating] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [planchettePos, setPlanchettePos] = useState<Position>({ x: 0, y: 0 });
  const [targetLabels, setTargetLabels] = useState<Target[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  
  const boardRef = useRef<HTMLDivElement>(null);

  // Split alphabet for the arch layout in Geometric Balance
  const alphabetTop = LETTERS.slice(0, 13);
  const alphabetBottom = LETTERS.slice(13);

  // Initialize targets once the board is rendered
  useEffect(() => {
    const updateTargets = () => {
      const targets: Target[] = [];
      const boardElement = boardRef.current;
      if (!boardElement) return;

      const items = boardElement.querySelectorAll('[data-ouija]');
      const boardRect = boardElement.getBoundingClientRect();

      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        targets.push({
          id: item.getAttribute('data-ouija') || "",
          label: item.textContent || "",
          pos: {
            x: rect.left - boardRect.left + rect.width / 2,
            y: rect.top - boardRect.top + rect.height / 2,
          }
        });
      });
      setTargetLabels(targets);
      
      // Set initial position to center
      if (targets.length > 0) {
        setPlanchettePos({ x: boardRect.width / 2, y: boardRect.height / 2 });
      }
    };

    updateTargets();
    // Re-run after a short delay to ensure fonts and layout are absolute
    const timer = setTimeout(updateTargets, 500);
    window.addEventListener('resize', updateTargets);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTargets);
    };
  }, []);

  const handleAsk = async () => {
    if (!question || isCommunicating) return;

    setIsCommunicating(true);
    setCurrentAnswer("");
    
    await new Promise(r => setTimeout(r, 1500));
    
    const answer = await getSpiritAnswer(question);
    
    const tokens: string[] = [];
    let remaining = answer;
    
    while (remaining.length > 0) {
      let matched = false;
      for (const spec of SPECIAL) {
        if (remaining.startsWith(spec)) {
          tokens.push(spec);
          remaining = remaining.slice(spec.length).trim();
          matched = true;
          break;
        }
      }
      if (!matched) {
        const char = remaining[0];
        if (/[A-Z0-9]/.test(char)) tokens.push(char);
        remaining = remaining.slice(1).trim();
      }
    }

    for (const token of tokens) {
      const target = targetLabels.find(t => t.id === token);
      if (target) {
        setPlanchettePos(target.pos);
        setCurrentAnswer(prev => prev + (token.length > 1 ? ` ${token} ` : token));
        await new Promise(r => setTimeout(r, 1500)); 
      }
    }
    
    setIsCommunicating(false);
    setQuestion("");
  };

  return (
    <div className="min-h-screen bg-ink text-gold font-serif overflow-hidden relative flex flex-col items-center justify-center p-4">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#c5a059_0%,transparent_70%)] blur-[120px]" />
      </div>

      {/* Main Layout Container (Canvas) */}
      <div 
        ref={boardRef}
        className="relative w-full max-w-[900px] aspect-[900/650] bg-ink border-2 border-gold p-10 flex flex-col justify-between items-center shadow-[inset_0_0_100px_rgba(0,0,0,0.8),0_0_40px_rgba(197,160,89,0.1)] select-none overflow-hidden"
        style={{ background: 'radial-gradient(circle at center, #1f1f1f 0%, #0a0a0a 100%)' }}
      >
        {/* Corner Icons */}
        <div className="absolute top-5 left-5 text-4xl opacity-80 select-none cursor-default" title="The Sun">&#9728;</div>
        <div className="absolute top-5 right-5 text-4xl opacity-80 select-none cursor-default" title="The Moon">&#9789;</div>

        {/* Decorative Lines */}
        <div className="absolute top-[150px] left-10 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent rotate-[15deg] pointer-events-none" />
        <div className="absolute top-[150px] right-10 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent rotate-[-15deg] pointer-events-none" />

        {/* Top Bar: Yes/No */}
        <div className="w-full flex justify-between px-16 mt-4">
          <div data-ouija="YES" className="text-3xl font-bold tracking-[10px] cursor-default transition-colors hover:text-white">SI</div>
          <div data-ouija="NO" className="text-3xl font-bold tracking-[10px] cursor-default transition-colors hover:text-white">NO</div>
        </div>

        {/* Title */}
        <h1 className="text-6xl md:text-7xl font-bold tracking-[15px] uppercase mt-[-20px] opacity-90">
          Ouija
        </h1>

        {/* Alphabet Arch */}
        <div className="flex flex-col gap-5 items-center">
          <div className="flex gap-4 justify-center">
            {alphabetTop.map(char => (
              <span key={char} data-ouija={char} className="text-3xl md:text-4xl font-bold w-[45px] text-center cursor-default transition-colors hover:text-white">
                {char}
              </span>
            ))}
          </div>
          <div className="flex gap-4 justify-center">
            {alphabetBottom.map(char => (
              <span key={char} data-ouija={char} className="text-3xl md:text-4xl font-bold w-[45px] text-center cursor-default transition-colors hover:text-white">
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Numbers Row */}
        <div className="flex justify-center gap-8 text-2xl mt-4">
          {NUMBERS.map(num => (
            <span key={num} data-ouija={num} className="font-bold px-1 cursor-default transition-colors hover:text-white">
              {num}
            </span>
          ))}
        </div>

        {/* Footer: Goodbye */}
        <div className="w-[60%] border-t border-gold/30 mt-4 mb-4 pt-5 text-center">
          <button data-ouija="GOODBYE" className="text-4xl font-bold tracking-[12px] uppercase cursor-default transition-colors hover:text-white">
            ADIÓS
          </button>
        </div>

        {/* The Planchette (Geometric Style) */}
        <motion.div 
          className="absolute pointer-events-none z-20"
          animate={{ x: planchettePos.x - 60, y: planchettePos.y - 75 }}
          transition={{ type: "spring", damping: 15, stiffness: 60 }}
        >
          <div 
            className="w-[120px] h-[150px] bg-gold/5 border border-gold flex items-center justify-center shadow-lg"
            style={{ clipPath: 'polygon(50% 0%, 100% 70%, 80% 100%, 20% 100%, 0% 70%)' }}
          >
            {/* Viewing Hole */}
            <div className="w-10 h-10 border border-gold rounded-full bg-white/10 backdrop-blur-[1px]" />
          </div>
        </motion.div>
      </div>

      {/* Controls Overlay (Styled as minimal utility) */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="z-30 mt-10 w-full max-w-xl bg-ink/80 backdrop-blur-md border border-gold/20 rounded-lg p-6 shadow-2xl"
      >
        <div className="flex gap-4">
          <input 
            type="text" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Interroga a los espíritus..."
            disabled={isCommunicating}
            className="flex-grow bg-transparent border-b border-gold/40 py-2 px-1 focus:outline-none focus:border-gold text-xl disabled:opacity-50 transition-all placeholder:italic placeholder:gold/20"
          />
          <button 
            onClick={handleAsk}
            disabled={isCommunicating || !question.trim()}
            className="bg-gold hover:bg-white text-ink p-3 rounded-sm transition-colors shadow-lg active:scale-95"
          >
            {isCommunicating ? <Ghost className="animate-pulse" /> : <Send />}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {currentAnswer && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 text-center"
            >
              <p className="text-gold/60 text-xs uppercase tracking-[4px] font-bold mb-2">Transcripción Espiritual</p>
              <p className="text-3xl font-bold tracking-tight text-white">{currentAnswer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Utilities */}
      <div className="absolute bottom-6 right-6 flex gap-4 text-gold/40">
        <button onClick={() => setIsMuted(!isMuted)} className="hover:text-gold transition-colors">
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button onClick={() => setCurrentAnswer("")} className="hover:text-red-400 transition-colors">
          <Trash2 size={20} />
        </button>
      </div>

      {/* Flashing Effect */}
      <AnimatePresence>
        {isCommunicating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.03, 0, 0.01, 0],
              transition: { duration: 3, repeat: Infinity } 
            }}
            className="fixed inset-0 bg-gold pointer-events-none z-50 mix-blend-screen"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
