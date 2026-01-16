"use client"

import { useState, useRef, useEffect } from 'react'
import { useChat } from 'ai/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, X, Send, Bot, Loader2, Sparkles, Minimize2, Maximize2 } from 'lucide-react'
import { convertMarkdownToHtml } from "@/components/ui/rich-text-editor"
import { useAuth } from "@/hooks/use-auth"

export function HelpChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { user } = useAuth()

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: "/api/chat-help",
        body: {
            userId: user?.id
        },
        initialMessages: [
            {
                id: "welcome",
                role: "assistant",
                content: "¡Hola! Soy Edu de EduPlanner 🤖. Estoy aquí para ayudarte a crear planeaciones, exámenes y mucho más. ¿En qué te ayudo hoy?",
            }
        ]
    })

    // Auto-scroll
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, isOpen])

    // No mostrar si no hay usuario autenticado
    if (!user) return null

    const toggleChat = () => {
        setIsOpen(!isOpen)
        setIsMinimized(false)
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Botón Flotante */}
            {!isOpen && (
                <div className="relative group">
                    <div className="absolute -top-12 right-0 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-2xl shadow-xl border border-purple-100 dark:border-purple-800 transform transition-all duration-700 animate-float-intro bg-opacity-95 backdrop-blur-sm">
                        <span className="text-sm font-semibold whitespace-nowrap flex items-center gap-2">
                            👋 ¡Hola! ¿Necesitas ayuda?
                        </span>
                        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-gray-800 border-r border-b border-purple-100 dark:border-purple-800 transform rotate-45"></div>
                    </div>

                    <Button
                        onClick={toggleChat}
                        className="h-16 pl-3 pr-4 rounded-full shadow-2xl bg-white hover:bg-purple-50 pointer-events-auto transition-all duration-300 hover:scale-105 group border-2 border-purple-100 dark:border-purple-800"
                    >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-indigo-500 to-blue-500 p-[2px] shadow-lg mr-3 animate-pulse-slow">
                            <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 overflow-hidden flex items-center justify-center">
                                <img
                                    src="/images/Edu.png"
                                    alt="Edu"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col items-start pr-2">
                            <span className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-purple-700 transition-colors">Ayuda IA</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Pregúntale a Edu</span>
                        </div>
                    </Button>
                </div>
            )}

            {/* Ventana de Chat */}
            {isOpen && (
                <Card className={`w-[350px] sm:w-[400px] shadow-2xl border-0 flex flex-col pointer-events-auto transition-all duration-300 ${isMinimized ? 'h-[70px]' : 'h-[550px]'}`}>
                    <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg p-4 flex flex-row items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="bg-white p-1 rounded-full shadow-sm">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src="/images/Edu.png" className="object-cover" />
                                        <AvatarFallback className="text-purple-600 font-bold bg-white">ED</AvatarFallback>
                                    </Avatar>
                                </div>
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-purple-600"></span>
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold">Edu de EduPlanner</CardTitle>
                                {!isMinimized && <p className="text-xs text-purple-100 opacity-90">Tu asistente virtual experto</p>}
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                                onClick={() => setIsMinimized(!isMinimized)}
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardHeader>

                    {!isMinimized && (
                        <>
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        {message.role === "assistant" && (
                                            <Avatar className="h-9 w-9 mt-1 shadow-sm bg-white p-0.5 border border-purple-100 flex-shrink-0">
                                                <AvatarImage src="/images/Edu.png" className="object-cover" />
                                                <AvatarFallback className="bg-purple-100 text-purple-600 font-bold text-xs">EDU</AvatarFallback>
                                            </Avatar>
                                        )}

                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${message.role === "user"
                                                ? "bg-purple-600 text-white rounded-br-none"
                                                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none"
                                                }`}
                                        >
                                            {message.role === "assistant" ? (
                                                <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(message.content) }} />
                                            ) : (
                                                message.content
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex gap-3 justify-start">
                                        <Avatar className="h-9 w-9 mt-1 shadow-sm bg-white p-0.5 border border-purple-100 flex-shrink-0">
                                            <AvatarImage src="/images/Edu.png" className="object-cover" />
                                            <AvatarFallback className="bg-purple-100 text-purple-600">EDU</AvatarFallback>
                                        </Avatar>
                                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                                            <span className="text-xs text-gray-500 font-medium">Edu está escribiendo...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </CardContent>

                            <CardFooter className="p-3 border-t bg-white dark:bg-gray-800 rounded-b-lg">
                                <form onSubmit={handleSubmit} className="flex w-full gap-2 items-center">
                                    <Input
                                        value={input}
                                        onChange={handleInputChange}
                                        placeholder="Escribe tu duda..."
                                        className="flex-1 focus-visible:ring-purple-500"
                                        disabled={isLoading}
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="bg-purple-600 hover:bg-purple-700 text-white shrink-0 h-10 w-10"
                                        disabled={isLoading || !input.trim()}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </>
                    )}
                </Card>
            )}
        </div>
    )
}
