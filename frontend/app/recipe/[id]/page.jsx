"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Send,
    User,
    Bot,
    ChefHat,
    ArrowLeft,
    AlertCircle,
    Loader2,
    Users,
    Timer
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { startCooking, sendChatMessage } from "@/lib/api";

export default function CookingPage() {
    const { id } = useParams();
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [threadId, setThreadId] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const [recipeInfo, setRecipeInfo] = useState(null);
    const scrollRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        if (shouldAutoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: "smooth",
                block: "end"
            });
        }
    }, [shouldAutoScroll]);

    const handleScroll = useCallback((e) => {
        const scrollContainer = e.target.closest('[data-radix-scroll-area-viewport]') || e.target;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
        setShouldAutoScroll(isNearBottom);
    }, []);

    const readStream = useCallback(async (response) => {
        if (!response.body) {
            throw new Error("No response body available");
        }

        setIsStreaming(true);
        let botMessage = "";

        try {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Add initial empty message
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "",
                timestamp: Date.now()
            }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                botMessage += chunk;

                // Update the last message with accumulated content
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    if (newMessages[lastIndex]?.role === "assistant") {
                        newMessages[lastIndex] = {
                            ...newMessages[lastIndex],
                            content: botMessage,
                        };
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Stream reading error:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                if (newMessages[lastIndex]?.role === "assistant") {
                    newMessages[lastIndex] = {
                        ...newMessages[lastIndex],
                        content: `🚫 Sorry, I encountered an error while responding: ${error.message}`,
                        isError: true
                    };
                }
                return newMessages;
            });
            setError("Failed to receive complete response");
        } finally {
            setIsStreaming(false);
        }
    }, []);

    const initializeCooking = useCallback(async () => {
        if (!id) return;

        setError(null);
        setIsInitializing(true);

        try {
            const response = await startCooking(id);
            const tid = response.headers.get("X-Thread-ID");

            if (!tid) {
                throw new Error("Server didn't provide a thread ID");
            }

            setThreadId(tid);

            // Try to extract recipe info from response if available
            try {
                const contentType = response.headers.get("content-type");
                if (contentType?.includes("application/json")) {
                    const data = await response.json();
                    setRecipeInfo(data.recipe || null);
                }
            } catch (e) {
                // Not JSON response, proceed with stream reading
                await readStream(response);
            }

        } catch (error) {
            console.error("Initialization error:", error);
            setError(error.message);
            setMessages([{
                role: "assistant",
                content: `🚫 **Connection Error**\n\nI couldn't start the cooking session: ${error.message}\n\nPlease check your internet connection and try refreshing the page.`,
                timestamp: Date.now(),
                isError: true
            }]);
        } finally {
            setIsInitializing(false);
        }
    }, [id, readStream]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        const message = input.trim();
        if (!message || !threadId || isSending) return;

        setInput("");
        setIsSending(true);
        setError(null);
        setShouldAutoScroll(true);

        // Add user message immediately
        const userMessage = {
            role: "user",
            content: message,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await sendChatMessage(threadId, message);
            await readStream(response);
        } catch (error) {
            console.error("Send message error:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `🚫 **Message Failed**\n\nCouldn't send your message: ${error.message}\n\nPlease try again.`,
                timestamp: Date.now(),
                isError: true
            }]);
            setError("Failed to send message");
        } finally {
            setIsSending(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [input, threadId, isSending, readStream]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        initializeCooking();
    }, [initializeCooking]);

    // Loading screen
    if (isInitializing) {
        return (
            <div className="flex flex-col items-center justify-center h-screen max-w-2xl mx-auto p-8">
                <div className="text-center space-y-6">
                    <div className="p-4 bg-orange-100 rounded-full w-fit mx-auto">
                        <ChefHat className="w-12 h-12 text-orange-600 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-800">Setting up your kitchen...</h2>
                        <p className="text-gray-600">Chef SnapCook is preparing your cooking session</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Initializing recipe assistant</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-linear-to-br from-orange-50 to-amber-50">
            {/* Header */}
            <header className="bg-white border-b border-orange-200 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.back()}
                                className="hover:bg-orange-100"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>

                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-md">
                                    <ChefHat className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-800">Chef SnapCook</h1>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <span>Active cooking session</span>
                                        </div>
                                        {recipeInfo && (
                                            <>
                                                {recipeInfo.servings && (
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        <span>{recipeInfo.servings} servings</span>
                                                    </div>
                                                )}
                                                {recipeInfo.cookTime && (
                                                    <div className="flex items-center gap-1">
                                                        <Timer className="w-3 h-3" />
                                                        <span>{recipeInfo.cookTime}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <Badge variant="destructive" className="animate-pulse">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Connection Issue
                            </Badge>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Chat Area */}
            <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col bg-white shadow-xl border-x border-orange-200">
                <ScrollArea
                    className="flex-1 px-4 py-6"
                    onScrollCapture={handleScroll}
                    ref={scrollRef}
                >
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {messages.length === 0 && !isInitializing && (
                            <Card className="border-orange-200 bg-orange-50/50">
                                <CardContent className="p-6 text-center">
                                    <ChefHat className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                        Welcome to your cooking session!
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        I'm here to guide you through each step. Ask me anything about the recipe,
                                        cooking techniques, or ingredient substitutions.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {messages.map((message, index) => (
                            <div
                                key={`${message.timestamp}-${index}`}
                                className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : "flex-row"
                                    }`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${message.role === "user"
                                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                                            : message.isError
                                                ? "bg-red-100 text-red-600"
                                                : "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                                        }`}
                                >
                                    {message.role === "user" ? (
                                        <User className="w-5 h-5" />
                                    ) : message.isError ? (
                                        <AlertCircle className="w-5 h-5" />
                                    ) : (
                                        <Bot className="w-5 h-5" />
                                    )}
                                </div>

                                {/* Message Content */}
                                <div
                                    className={`rounded-2xl px-4 py-3 max-w-[75%] shadow-sm ${message.role === "user"
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-md"
                                            : message.isError
                                                ? "bg-red-50 text-red-800 border border-red-200 rounded-tl-md"
                                                : "bg-white border border-gray-200 rounded-tl-md"
                                        }`}
                                >
                                    <div className={`prose prose-sm max-w-none ${message.role === "user"
                                            ? "prose-invert"
                                            : message.isError
                                                ? "prose-red"
                                                : "prose-gray"
                                        }`}>
                                        <ReactMarkdown
                                            components={{
                                                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                                h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                                                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                                                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                                ul: ({ children }) => <ul className="mb-2 pl-4 space-y-1">{children}</ul>,
                                                ol: ({ children }) => <ol className="mb-2 pl-4 space-y-1">{children}</ol>,
                                                li: ({ children }) => <li className="text-sm">{children}</li>,
                                                code: ({ children }) => (
                                                    <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">
                                                        {children}
                                                    </code>
                                                ),
                                                pre: ({ children }) => (
                                                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                                        {children}
                                                    </pre>
                                                ),
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>

                                    {message.timestamp && (
                                        <div className={`text-xs mt-2 ${message.role === "user"
                                                ? "text-blue-200"
                                                : "text-gray-500"
                                            }`}>
                                            {new Date(message.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Streaming Indicator */}
                        {isStreaming && (
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-linear-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-sm">Chef is thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </ScrollArea>
                <div className="border-t border-gray-200 bg-white p-4">
                    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={
                                        threadId
                                            ? "Ask about ingredients, techniques, or next steps..."
                                            : "Connecting to chef..."
                                    }
                                    disabled={!threadId || isSending}
                                    className="pr-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                                    maxLength={500}
                                />
                                {input.length > 400 && (
                                    <div className="absolute right-3 top-3 text-xs text-gray-500">
                                        {500 - input.length}
                                    </div>
                                )}
                            </div>
                            <Button
                                type="submit"
                                disabled={!threadId || !input.trim() || isSending}
                                className="bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6"
                            >
                                {isSending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>

                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <span>
                                {threadId ? "Connected and ready" : "Connecting..."}
                            </span>
                            <span>Press Enter to send</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}