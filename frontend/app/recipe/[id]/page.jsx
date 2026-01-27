"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Send, User, Bot, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { startCooking, sendChatMessage } from "@/lib/api";

export default function CookingPage() {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef(null);

  const readStream = async (response) => {
    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMessage = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        botMessage += chunk;

        setMessages(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1] = { role: "assistant", content: botMessage };
          return newHistory;
        });
      }
      
      // Scroll to bottom after message is complete
      setTimeout(() => {
        if (scrollRef.current) {
          const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }, 100);
    } catch (error) {
      console.error("Stream reading error:", error);
      setMessages(prev => {
        const newHistory = [...prev];
        if (newHistory[newHistory.length - 1]?.role === "assistant" && !newHistory[newHistory.length - 1]?.content) {
          newHistory[newHistory.length - 1] = { 
            role: "assistant", 
            content: `Sorry, I encountered an error while processing the response: ${error.message}` 
          };
        }
        return newHistory;
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        console.log("Starting cooking for recipe ID:", id);
        const res = await startCooking(id);
        const tid = res.headers.get("X-Thread-ID");
        console.log("Available headers:", Array.from(res.headers.entries()));
        console.log("Got thread ID:", tid);
        
        if (!tid) {
          throw new Error("No thread ID received from server");
        }
        
        setThreadId(tid);
        await readStream(res); 
      } catch (e) {
        console.error("Failed to start cooking:", e);
        setMessages([{
          role: "assistant", 
          content: `Sorry, I couldn't load the recipe. Error: ${e.message}. Please make sure the recipe exists and the backend server is running.`
        }]);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !threadId) return;

    const userMsg = input;
    setInput("");
    
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    
    // Scroll to bottom after adding user message
    setTimeout(() => {
      if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);

    try {
      const res = await sendChatMessage(threadId, userMsg);
      await readStream(res);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `Sorry, I couldn't process your message. Error: ${error.message}` 
      }]);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white shadow-xl border-x">
      <div className="p-4 border-b bg-orange-50 flex items-center gap-3 sticky top-0 z-10">
        <div className="p-2 bg-orange-200 rounded-full">
          <ChefHat className="w-6 h-6 text-orange-700" />
        </div>
        <div>
          <h1 className="font-bold text-neutral-800">Chef SnapCook</h1>
          <p className="text-xs text-neutral-500">Always here to help.</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                ${msg.role === "user" ? "bg-neutral-200" : "bg-orange-100"}`}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-orange-600" />}
              </div>
              
              <div className={`p-3 rounded-lg max-w-[80%] text-sm leading-relaxed wrap-break-words overflow-wrap-anywhere
                ${msg.role === "user" 
                  ? "bg-neutral-900 text-white rounded-tr-none" 
                  : "bg-neutral-100 text-neutral-800 rounded-tl-none border border-neutral-200"
                }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-center text-xs text-neutral-400 animate-pulse">Chef is preparing...</div>}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about the next step..."
            className="flex-1"
          />
          <Button type="submit" disabled={!threadId} className="bg-orange-600 hover:bg-orange-700">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}