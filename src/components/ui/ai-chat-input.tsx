"use client" 

import * as React from "react"
import { useState, useEffect, useRef } from "react";
import { Lightbulb, Mic, Globe, Paperclip, Send } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const PLACEHOLDERS = [
  "Generate website with HextaUI",
  "Create a new project with Next.js",
  "What is the meaning of life?",
  "What is the best way to learn React?",
  "How to cook a delicious meal?",
  "Summarize this article",
];

interface AIChatInputProps {
  onSend: (value: string) => void;
  onImageUpload?: (file: File) => void;
  onVoiceStart?: () => void;
}

const AIChatInput = ({ onSend, onImageUpload, onVoiceStart }: AIChatInputProps) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cycle placeholder text when input is inactive
  useEffect(() => {
    if (isActive || inputValue) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, inputValue]);

  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (!inputValue) setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue]);

  const handleActivate = () => setIsActive(true);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSend(inputValue);
      setInputValue("");
    }
  };

  const containerVariants = {
    collapsed: {
      height: 68,
      boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
      transition: { type: "spring", stiffness: 120, damping: 18 } as const,
    },
    expanded: {
      height: 128,
      boxShadow: "0 4px 12px 0 rgba(0,0,0,0.1)",
      transition: { type: "spring", stiffness: 120, damping: 18 } as const,
    },
  };

  const placeholderContainerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  };

  const letterVariants = {
    initial: {
      opacity: 0,
      filter: "blur(4px)",
      y: 5,
    },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        opacity: { duration: 0.25 },
        filter: { duration: 0.4 },
        y: { type: "spring", stiffness: 80, damping: 20 } as const,
      },
    },
    exit: {
      opacity: 0,
      filter: "blur(4px)",
      y: -5,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { type: "spring", stiffness: 80, damping: 20 } as const,
      },
    },
  };

  return (
    <div className="w-full flex justify-center items-center">
      <motion.div
        ref={wrapperRef}
        className="w-full max-w-3xl border border-slate-200 dark:border-slate-800"
        variants={containerVariants}
        animate={isActive || inputValue ? "expanded" : "collapsed"}
        initial="collapsed"
        style={{ overflow: "hidden", borderRadius: 24, background: "var(--background)" }}
        onClick={handleActivate}
      >
        <div className="flex flex-col items-stretch w-full h-full">
          {/* Input Row */}
          <div className="flex items-center gap-2 p-3 w-full">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => e.target.files?.[0] && onImageUpload?.(e.target.files[0])}
            />
            <button
              className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition text-slate-500"
              title="Attach file"
              type="button"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              <Paperclip size={20} />
            </button>

            {/* Text Input & Placeholder */}
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="flex-1 border-0 outline-0 rounded-md py-2 text-base bg-transparent w-full font-normal text-slate-900 dark:text-slate-100"
                style={{ position: "relative", zIndex: 1 }}
                onFocus={handleActivate}
              />
              <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center px-3 py-2">
                <AnimatePresence mode="wait">
                  {showPlaceholder && !isActive && !inputValue && (
                    <motion.span
                      key={placeholderIndex}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 select-none pointer-events-none"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        zIndex: 0,
                      }}
                      variants={placeholderContainerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {PLACEHOLDERS[placeholderIndex]
                        .split("")
                        .map((char, i) => (
                          <motion.span
                            key={i}
                            variants={letterVariants}
                            style={{ display: "inline-block" }}
                          >
                            {char === " " ? "\u00A0" : char}
                          </motion.span>
                        ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <button
              className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition text-slate-500"
              title="Voice input"
              type="button"
              onClick={(e) => { e.stopPropagation(); onVoiceStart?.(); }}
            >
              <Mic size={20} />
            </button>
            <button
              className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-full font-medium justify-center transition-colors shadow-sm"
              title="Send"
              type="button"
              onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
            >
              <Send size={18} />
            </button>
          </div>

          {/* Expanded Controls */}
          <motion.div
            className="w-full flex justify-start px-4 items-center text-sm"
            variants={{
              hidden: {
                opacity: 0,
                y: 10,
                pointerEvents: "none" as const,
                transition: { duration: 0.2 },
              },
              visible: {
                opacity: 1,
                y: 0,
                pointerEvents: "auto" as const,
                transition: { duration: 0.25, delay: 0.05 },
              },
            }}
            initial="hidden"
            animate={isActive || inputValue ? "visible" : "hidden"}
            style={{ marginTop: 4 }}
          >
            <div className="flex gap-3 items-center">
              {/* Think Toggle */}
              <button
                className={`flex items-center gap-1 px-4 py-1.5 rounded-full transition-all font-medium group ${
                  thinkActive
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                title="Think"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setThinkActive((a) => !a);
                }}
              >
                <Lightbulb
                  className="transition-all"
                  size={16}
                />
                Think
              </button>

              {/* Deep Search Toggle */}
              <motion.button
                className={`flex items-center px-4 gap-1 py-1.5 rounded-full transition font-medium whitespace-nowrap overflow-hidden justify-start  ${
                  deepSearchActive
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                title="Deep Search"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeepSearchActive((a) => !a);
                }}
                initial={false}
                animate={{
                  width: deepSearchActive ? 125 : 36,
                  paddingLeft: deepSearchActive ? 8 : 9,
                }}
              >
                <div className="flex-1">
                  <Globe size={16} />
                </div>
                <motion.span
                  initial={false}
                  animate={{
                    opacity: deepSearchActive ? 1 : 0,
                  }}
                >
                  Deep Search
                </motion.span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export { AIChatInput };