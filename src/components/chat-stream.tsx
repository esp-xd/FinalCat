"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image" | "audio";
  mediaUrl?: string;
}

interface ChatStreamProps {
  messages: Message[];
  isTyping?: boolean;
}

export function ChatStream({ messages, isTyping }: ChatStreamProps) {
  return (
    <div className="flex flex-col gap-6 py-10 w-full max-w-3xl mx-auto px-4">
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex gap-4 w-full",
            msg.role === "user" ? "flex-row-reverse" : "flex-row"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800",
            msg.role === "user" ? "bg-emerald-500 text-white border-transparent" : "bg-slate-100 dark:bg-slate-900 text-slate-500"
          )}>
            {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
          </div>
          
          <div className={cn(
            "flex flex-col gap-2 max-w-[85%]",
            msg.role === "user" ? "items-end" : "items-start"
          )}>
            <div className={cn(
              "px-4 py-3 rounded-2xl text-sm leading-relaxed",
              msg.role === "user" 
                ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-tr-none" 
                : "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-sm"
            )}>
              {msg.type === "image" && msg.mediaUrl && (
                <img src={msg.mediaUrl} alt="Generated content" className="rounded-lg mb-3 max-w-full h-auto" />
              )}
              {msg.type === "audio" && msg.mediaUrl && (
                <audio src={msg.mediaUrl} controls className="mb-3 h-8" />
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        </motion.div>
      ))}

      {isTyping && (
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-500">
            <Bot size={16} />
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-bounce [animation-delay:0.4s]"></span>
          </div>
        </div>
      )}
    </div>
  );
}
