"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Send, User, Bot, ChefHat } from "lucide-react";
import ReactMarkdown from "react-markdown";
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
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Check if user has scrolled up manually
  const handleScroll = (e) => {
    // Try to get the scroll container from ScrollArea
    const scrollContainer = e.target.closest('[data-radix-scroll-area-viewport]') || e.target;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    setShouldAutoScroll(isNearBottom);
  };

  const readStream = async (response) => {
    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        botMessage += chunk;

        setMessages((prev) => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1] = {
            role: "assistant",
            content: botMessage,
          };
          return newHistory;
        });
      }

      scrollToBottom();
    } catch (error) {
      console.error("Stream reading error:", error);
      setMessages((prev) => {
        const newHistory = [...prev];
        if (
          newHistory[newHistory.length - 1]?.role === "assistant" &&
          !newHistory[newHistory.length - 1]?.content
        ) {
          newHistory[newHistory.length - 1] = {
            role: "assistant",
            content: `Sorry, I encountered an error: ${error.message}`,
          };
        }
        return newHistory;
      });
    }
  };

  // Only auto-scroll when messages change if shouldAutoScroll is true
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await startCooking(id);
        const tid = res.headers.get("X-Thread-ID");

        if (!tid) {
          throw new Error("No thread ID received from server");
        }

        setThreadId(tid);
        await readStream(res);
      } catch (e) {
        setMessages([
          {
            role: "assistant",
            content: `Error: ${e.message}. Please check your connection.`,
          },
        ]);
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

    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    
    // Auto-scroll when user sends a message
    setShouldAutoScroll(true);
    setTimeout(scrollToBottom, 100);

    try {
      const res = await sendChatMessage(threadId, userMsg);
      await readStream(res);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Failed to send: ${error.message}`,
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen max-w-3xl mx-auto bg-white shadow-xl border-x overflow-hidden">
      <div className="p-4 border-b bg-orange-50 flex items-center gap-3 shrink-0 relative z-10">
        <div className="p-2 bg-orange-200 rounded-full">
          <ChefHat className="w-6 h-6 text-orange-700" />
        </div>
        <div>
          <h1 className="font-bold text-neutral-800">Chef SnapCook</h1>
          <p className="text-xs text-neutral-500">Always here to help.</p>
        </div>
      </div>

      <ScrollArea className="flex-1 h-full w-full" ref={scrollRef} onScrollCapture={handleScroll}>
        <div className="p-4 pt-6 space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 w-full ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                ${msg.role === "user" ? "bg-neutral-200" : "bg-orange-100"}`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4 text-orange-600" />
                )}
              </div>

              <div
                className={`p-3 rounded-lg max-w-[85%] text-sm leading-relaxed 
                ${
                  msg.role === "user"
                    ? "bg-neutral-900 text-white rounded-tr-none"
                    : "bg-neutral-100 text-neutral-800 rounded-tl-none border border-neutral-200"
                }`}
              >
                <div className="prose prose-sm max-w-full wrap-break-words overflow-hidden">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="text-center text-xs text-neutral-400 animate-pulse">
              Chef is preparing...
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-white shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the next step..."
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!threadId}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}