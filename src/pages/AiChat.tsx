import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { 
  Bot, 
  User, 
  Send, 
  MessageSquare,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { blink } from '../blink/client'
import { toast } from '../hooks/use-toast'

const rolePlayScenarios = [
  {
    title: "Career Coach",
    description: "Get guidance on career development and differentiation strategies",
    prompt: "You are an experienced career coach specializing in helping professionals identify and leverage their unique value propositions. Help me explore my differentiation opportunities and career growth strategies."
  },
  {
    title: "Business Mentor",
    description: "Discuss business ideas and entrepreneurial differentiation",
    prompt: "You are a successful business mentor with experience across multiple industries. Help me think through business opportunities and how to differentiate in competitive markets."
  },
  {
    title: "Innovation Consultant",
    description: "Explore creative approaches and cross-industry insights",
    prompt: "You are an innovation consultant who specializes in cross-industry pattern recognition and creative problem-solving. Help me discover unconventional approaches and innovative differentiation strategies."
  },
  {
    title: "Personal Brand Expert",
    description: "Develop your personal brand and unique positioning",
    prompt: "You are a personal branding expert who helps professionals articulate their unique value and build compelling personal brands. Help me clarify and strengthen my personal brand positioning."
  }
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function AiChat() {
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await blink.auth.me()
        setUser(userData)
      } catch (error) {
        console.error('Error loading user:', error)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startRolePlay = (scenario: typeof rolePlayScenarios[0]) => {
    setSelectedScenario(scenario.title)
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Hello! I'm your ${scenario.title.toLowerCase()}. ${scenario.description} What would you like to explore today?`,
        timestamp: new Date()
      }
    ])
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const scenario = rolePlayScenarios.find(s => s.title === selectedScenario)
      const systemPrompt = scenario ? scenario.prompt : "You are a helpful AI assistant focused on differentiation and self-reflection."
      
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      let responseContent = ''
      
      await blink.ai.streamText(
        {
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory
          ],
          model: 'gpt-4o-mini',
          maxTokens: 500
        },
        (chunk) => {
          responseContent += chunk
          
          // Update the last message if it's from assistant, or add new one
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1]
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.id === 'streaming') {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: responseContent }
              ]
            } else {
              return [
                ...prev,
                {
                  id: 'streaming',
                  role: 'assistant',
                  content: responseContent,
                  timestamp: new Date()
                }
              ]
            }
          })
        }
      )

      // Finalize the message with a proper ID
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage && lastMessage.id === 'streaming') {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, id: Date.now().toString() }
          ]
        }
        return prev
      })

    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Message failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setSelectedScenario(null)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Chat & Role-Play</h1>
        <p className="text-muted-foreground">
          Practice conversations and get personalized guidance from AI mentors
        </p>
      </div>

      {/* Scenario Selection */}
      {!selectedScenario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>Choose Your AI Mentor</span>
            </CardTitle>
            <CardDescription>
              Select a role-play scenario to start your conversation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rolePlayScenarios.map((scenario) => (
                <Card 
                  key={scenario.title} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => startRolePlay(scenario)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                    <CardDescription>{scenario.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      {selectedScenario && (
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5" />
                <CardTitle>{selectedScenario}</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={clearChat}>
                <RefreshCw className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
          </CardHeader>
          
          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                    )}
                    {message.role === 'user' && (
                      <User className="w-4 h-4 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Textarea
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                rows={2}
                className="resize-none"
                disabled={isLoading}
              />
              <Button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}