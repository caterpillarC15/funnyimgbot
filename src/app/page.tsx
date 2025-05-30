'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Image, Bot, User, Loader2, TrendingUp, Sparkles } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  imageUrl?: string
  timestamp: Date
}

interface TrendingTopic {
  topic: string
  description: string
  category: string
  popularity: number
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([])
  const [loadingTrends, setLoadingTrends] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize messages on client side to avoid hydration mismatch
  useEffect(() => {
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: 'Hey there! 👋 I\'m your funny image generator. Describe something and I\'ll create a hilarious image for you! Or pick from trending topics below! 🔥',
        timestamp: new Date()
      }
    ])
  }, [])

  // Fetch trending topics on component mount
  useEffect(() => {
    fetchTrendingTopics()
  }, [])

  const fetchTrendingTopics = async () => {
    try {
      setLoadingTrends(true)
      const response = await fetch('/api/trending')
      if (response.ok) {
        const data = await response.json()
        setTrendingTopics(data.trends || [])
      }
    } catch (error) {
      console.error('Error fetching trending topics:', error)
    } finally {
      setLoadingTrends(false)
    }
  }

  const generateImage = async (prompt: string) => {
    try {
      // Get current trending data to pass to image generation
      const currentTrending = trendingTopics.length > 0 ? trendingTopics[0] : null
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          trendingData: currentTrending 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const data = await response.json()
      return {
        imageUrl: data.imageUrl,
        description: data.description
      }
    } catch (error) {
      console.error('Error generating image:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const result = await generateImage(input.trim())
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: result?.description || 'Sorry, I couldn\'t generate an image right now. Please try again! 😅',
        imageUrl: result?.imageUrl,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Oops! Something went wrong. Please try again! 😅',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleTrendingClick = (topic: TrendingTopic) => {
    setInput(topic.topic)
  }

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'news': return '📰'
      case 'tech': return '💻'
      case 'social': return '🔥'
      case 'animals': return '🐾'
      case 'lifestyle': return '☕'
      default: return '✨'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'news': return 'bg-red-500'
      case 'tech': return 'bg-blue-500'
      case 'social': return 'bg-orange-500'
      case 'animals': return 'bg-green-500'
      case 'lifestyle': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎨 Funny Image Generator
          </h1>
          <p className="text-white/80">
            Powered by Gemini AI • Describe anything and get hilarious results!
          </p>
        </div>

        {/* Trending Topics Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-white" />
            <h2 className="text-xl font-bold text-white">🔥 Trending Topics</h2>
            <button
              onClick={fetchTrendingTopics}
              disabled={loadingTrends}
              className="ml-auto text-white/70 hover:text-white transition-colors"
            >
              {loadingTrends ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </button>
          </div>
          
          {loadingTrends ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
              <span className="ml-2 text-white/80">Fetching latest trends...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {trendingTopics.slice(0, 6).map((topic, index) => (
                <button
                  key={index}
                  onClick={() => handleTrendingClick(topic)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 text-left transition-all duration-200 hover:scale-105 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold text-white ${getCategoryColor(topic.category)}`}>
                      {getCategoryEmoji(topic.category)} {topic.category}
                    </span>
                    <span className="text-xs text-white/60 font-mono">
                      #{topic.popularity}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                    {topic.topic}
                  </h3>
                  <p className="text-white/70 text-xs line-clamp-2">
                    {topic.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Messages */}
          <div className="h-96 md:h-[500px] overflow-y-auto p-6 chat-container">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 mb-6 ${
                  message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user'
                      ? 'bg-blue-500'
                      : 'bg-gradient-to-r from-green-400 to-blue-500'
                  }`}
                >
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg ${
                    message.type === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/90 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  {/* Image Display */}
                  {message.imageUrl && (
                    <div className="mt-3">
                      <img
                        src={message.imageUrl}
                        alt="Generated funny image"
                        className="rounded-lg shadow-lg max-w-full h-auto"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=🎨+Image+Not+Found';
                        }}
                      />
                    </div>
                  )}
                  
                  <p className="text-xs text-white/60 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/90 text-gray-800 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Creating your funny image...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="p-6 border-t border-white/20">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe a funny image you want to generate..."
                  className="w-full bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  disabled={isLoading}
                />
                <Image className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-2xl transition-all duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            Made with ❤️ using Next.js and Gemini AI
          </p>
        </div>
      </div>
    </div>
  )
} 