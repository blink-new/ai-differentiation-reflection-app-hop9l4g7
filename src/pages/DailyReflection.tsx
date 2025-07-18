import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  Clock,
  Lightbulb,
  TrendingUp
} from 'lucide-react'
import { blink } from '../blink/client'
import { toast } from '../hooks/use-toast'

const differentiationQuestions = [
  "あなたの分野で他の人が通常持っていない、ユニークなスキルや経験の組み合わせは何ですか？",
  "全く異なる業界の成功戦略を、現在の仕事や目標にどのように応用できますか？",
  "あなたの特定の背景や視点により、ユニークに解決できる問題は何ですか？",
  "あなたの価値提案を一文で説明するとしたら、他の選択肢ではなくあなたを選ぶ理由は何でしょうか？",
  "あなたの分野の一般的な課題に対して、どのような型破りなアプローチを取ることができますか？",
  "あなたの個人的な価値観や人生経験は、問題へのアプローチにどのような異なるレンズを作り出しますか？",
  "今知っていることを知った状態で、あなたの分野で新しく始めるとしたら、何を違ったやり方でしますか？",
  "一見関係のない2つの興味やスキルを組み合わせて、何か新しいものを作ることができますか？",
  "あなたの業界でどの前提に反対し、その反対意見をどのように優位性に変えることができますか？",
  "プロフェッショナルとして1つのことだけで知られるとしたら、最も意味のあるインパクトを生み出すものは何でしょうか？"
]

export function DailyReflection() {
  const [user, setUser] = useState(null)
  const [todaysQuestions, setTodaysQuestions] = useState<string[]>([])
  const [responses, setResponses] = useState<string[]>(['', '', '', '', ''])
  const [completedToday, setCompletedToday] = useState(false)
  const [recentReflections, setRecentReflections] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await blink.auth.me()
        setUser(userData)
        
        // Generate today's questions
        const today = new Date().toISOString().split('T')[0]
        const seed = today.split('-').join('')
        const shuffled = [...differentiationQuestions].sort(() => 
          Math.sin(parseInt(seed)) - 0.5
        )
        setTodaysQuestions(shuffled.slice(0, 5))
        
        // Check if already completed today and load recent reflections
        try {
          const todayReflections = await blink.db.reflections.list({
            where: { 
              userId: userData.id,
              date: today
            }
          })
          
          if (todayReflections.length > 0) {
            setCompletedToday(true)
            const reflection = todayReflections[0]
            setResponses(JSON.parse(reflection.responses))
          }
          
          // Load recent reflections
          const recent = await blink.db.reflections.list({
            where: { userId: userData.id },
            orderBy: { createdAt: 'desc' },
            limit: 7
          })
          setRecentReflections(recent)
        } catch (dbError) {
          console.log('Database not yet available for reflections')
        }
        
      } catch (error) {
        console.error('Error loading reflection data:', error)
      }
    }
    
    loadData()
  }, [])

  const updateResponse = (index: number, value: string) => {
    const newResponses = [...responses]
    newResponses[index] = value
    setResponses(newResponses)
  }

  const submitReflection = async () => {
    const filledResponses = responses.filter(r => r.trim().length > 0)
    if (filledResponses.length === 0) {
      toast({
        title: "回答がありません",
        description: "送信する前に少なくとも1つの質問に答えてください。",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      await blink.db.reflections.create({
        userId: user.id,
        date: today,
        questions: JSON.stringify(todaysQuestions),
        responses: JSON.stringify(responses),
        completedQuestions: filledResponses.length,
        createdAt: new Date().toISOString()
      })

      setCompletedToday(true)
      toast({
        title: "振り返りを保存しました！",
        description: `今日は${filledResponses.length}問完了しました。`
      })
      
    } catch (error) {
      console.error('Error saving reflection:', error)
      toast({
        title: "保存に失敗しました",
        description: "振り返りの保存に失敗しました。もう一度お試しください。",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const completedCount = responses.filter(r => r.trim().length > 0).length
  const progressPercentage = (completedCount / 5) * 100

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">日々の振り返り</h1>
        <p className="text-muted-foreground">
          5つの日々の差別化質問で自己認識を深めましょう
        </p>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>今日の進捗</span>
            </div>
            {completedToday && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                完了
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString('ja-JP', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>回答した質問</span>
              <span>{completedCount}/5</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-6">
        {todaysQuestions.map((question, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                  {index + 1}
                </div>
                <span>質問 {index + 1}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">{question}</p>
              <Textarea
                placeholder="時間をかけて振り返り、あなたの考えを書いてください..."
                value={responses[index]}
                onChange={(e) => updateResponse(index, e.target.value)}
                rows={4}
                disabled={completedToday}
                className="resize-none"
              />
              {responses[index].trim().length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>回答を保存しました</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      {!completedToday && (
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={submitReflection} 
              disabled={isSubmitting || completedCount === 0}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  振り返りを保存中...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  今日の振り返りを保存 ({completedCount}/5 問)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentReflections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>最近の振り返り</span>
            </CardTitle>
            <CardDescription>
              過去1週間の振り返り活動
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReflections.slice(0, 7).map((reflection) => (
                <div key={reflection.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(reflection.date).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <Badge variant="outline">
                    {reflection.completedQuestions}/5 問
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}