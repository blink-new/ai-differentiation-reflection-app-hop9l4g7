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
    title: "キャリアコーチ",
    description: "キャリア開発と差別化戦略についてのガイダンスを受ける",
    prompt: "あなたは、プロフェッショナルがユニークな価値提案を特定し活用することを専門とする経験豊富なキャリアコーチです。私の差別化の機会とキャリア成長戦略を探求するのを手伝ってください。日本語で回答してください。"
  },
  {
    title: "ビジネスメンター",
    description: "ビジネスアイデアと起業家的差別化について議論する",
    prompt: "あなたは複数の業界で経験を持つ成功したビジネスメンターです。ビジネス機会と競争市場での差別化方法について考えるのを手伝ってください。日本語で回答してください。"
  },
  {
    title: "イノベーションコンサルタント",
    description: "創造的なアプローチと異業種の洞察を探求する",
    prompt: "あなたは異業種パターン認識と創造的問題解決を専門とするイノベーションコンサルタントです。型破りなアプローチと革新的な差別化戦略を発見するのを手伝ってください。日本語で回答してください。"
  },
  {
    title: "パーソナルブランド専門家",
    description: "パーソナルブランドとユニークなポジショニングを開発する",
    prompt: "あなたはプロフェッショナルがユニークな価値を明確にし、魅力的なパーソナルブランドを構築することを支援するパーソナルブランディング専門家です。私のパーソナルブランドポジショニングを明確化し強化するのを手伝ってください。日本語で回答してください。"
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
        content: `こんにちは！私はあなたの${scenario.title.toLowerCase()}です。${scenario.description}今日は何を探求したいですか？`,
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
      const systemPrompt = scenario ? scenario.prompt : "あなたは差別化と自己省察に焦点を当てた親切なAIアシスタントです。日本語で回答してください。"
      
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
        title: "メッセージの送信に失敗しました",
        description: "メッセージの送信に失敗しました。もう一度お試しください。",
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
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">AIチャット・ロールプレイ</h1>
        <p className="text-muted-foreground">
          AIメンターとの会話練習とパーソナライズされたガイダンス
        </p>
      </div>

      {/* Scenario Selection */}
      {!selectedScenario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>AIメンターを選択</span>
            </CardTitle>
            <CardDescription>
              会話を始めるロールプレイシナリオを選択してください
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
                新しいチャット
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
                placeholder="メッセージを入力..."
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
              Enterで送信、Shift+Enterで改行
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}