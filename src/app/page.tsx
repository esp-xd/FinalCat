"use client";

import { useState, useRef, useEffect } from "react";
import { AIChatInput } from "@/components/ui/ai-chat-input";
import { ChatStream } from "@/components/chat-stream";
import { Settings, Trash2, LayoutDashboard, Moon, Sun, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image" | "audio";
  mediaUrl?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Hello! How can I help you today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (content: string, mediaData?: { type: "image", url: string }) => {
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: "user", 
      content,
      type: mediaData?.type,
      mediaUrl: mediaData?.url
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const isImageGen = content.toLowerCase().includes("/gen");
      const model = isImageGen ? "retro-diffusion/rd-plus" : (mediaData ? "google/gemini-3-flash-preview" : "qwen/qwen3-32b");
      
      let payloadMessages: any[] = [];
      if (mediaData && mediaData.type === "image") {
        payloadMessages = [{
          role: "user",
          content: [
            { type: "text", text: content || "Analyze this image" },
            { type: "image_url", image_url: { url: mediaData.url } }
          ]
        }];
      } else {
        payloadMessages = messages.concat(userMsg).map(m => ({ role: m.role, content: m.content }));
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages, model })
      });

      if (!response.body) return;

      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMsgId, role: "assistant", content: "" }]);
      setIsTyping(false);

      const reader = response.body.getReader();
      const decoder = new TextEncoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        fullContent += chunk;
        
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, content: fullContent } : m
        ));
      }

      // Auto-play audio response if text and not image gen
      if (!isImageGen) {
        playAudio(fullContent);
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const playAudio = async (text: string) => {
    try {
      const response = await fetch("/api/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
      }
    } catch (e) {}
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleSend("", { type: "image", url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorder.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];
        
        mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
        mediaRecorder.current.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');
          
          const response = await fetch('/api/audio/transcriptions', {
            method: 'POST',
            body: formData
          });
          const data = await response.json();
          if (data.text) {
            handleSend(data.text);
          }
        };
        
        mediaRecorder.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Mic access denied:", err);
      }
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-[300px] border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col p-4 z-50"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-bold text-lg">Assistant</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">
                <Settings size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">History</div>
              <button className="w-full text-left p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-sm truncate">How to build a SaaS...</button>
              <button className="w-full text-left p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-sm truncate">Marketing strategy for...</button>
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <button onClick={() => setMessages([{ id: "1", role: "assistant", content: "Chat cleared." }])} className="w-full flex items-center gap-3 p-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors">
                <Trash2 size={16} />
                Clear Chat
              </button>
              <a href="#" className="w-full flex items-center gap-3 p-3 text-sm hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <LayoutDashboard size={16} />
                GitHub Repository
              </a>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm z-40 sticky top-0">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg">
                <Settings size={18} />
              </button>
            )}
            <h1 className="font-semibold text-sm">New Conversation</h1>
          </div>
          <div className="flex items-center gap-2">
            {isRecording && <div className="flex items-center gap-2 text-xs text-red-500 animate-pulse font-medium"><div className="w-2 h-2 rounded-full bg-red-500" /> Recording...</div>}
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <ChatStream messages={messages} isTyping={isTyping} />
        </div>

        <div className="p-4 md:p-6 bg-gradient-to-t from-white dark:from-slate-950 via-white dark:via-slate-950 to-transparent">
          <AIChatInput 
            onSend={handleSend} 
            onImageUpload={handleImageUpload}
            onVoiceStart={toggleRecording}
          />
          <p className="text-[10px] text-slate-400 text-center mt-3">
            AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </main>
    </div>
  );
}
