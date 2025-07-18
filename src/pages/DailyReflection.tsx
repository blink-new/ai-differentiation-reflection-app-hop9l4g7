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
  "What unique combination of skills or experiences do you possess that others in your field typically don't have?",
  "How could you apply a successful strategy from a completely different industry to your current work or goals?",
  "What problem are you uniquely positioned to solve because of your specific background or perspective?",
  "If you had to explain your value proposition in one sentence, what would make someone choose you over alternatives?",
  "What unconventional approach could you take to a common challenge in your field?",
  "How do your personal values or life experiences create a different lens through which you approach problems?",
  "What would you do differently if you were starting fresh in your field today, knowing what you know now?",
  "How could you combine two seemingly unrelated interests or skills to create something new?",
  "What assumptions in your industry do you disagree with, and how could that disagreement become an advantage?",
  "If you could only be known for one thing professionally, what would create the most meaningful impact?"
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
        
        // Check if already completed today
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
        title: "No responses",
        description: "Please answer at least one question before submitting.",
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
        title: "Reflection saved!",
        description: `You've completed ${filledResponses.length} questions today.`
      })
      
    } catch (error) {
      console.error('Error saving reflection:', error)
      toast({
        title: "Save failed",
        description: "Failed to save your reflection. Please try again.",
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
        <h1 className="text-3xl font-bold mb-2">Daily Reflection</h1>
        <p className="text-muted-foreground">
          Deepen your self-awareness with 5 daily differentiation questions
        </p>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Today's Progress</span>
            </div>
            {completedToday && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString('en-US', { 
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
              <span>Questions Answered</span>
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
                <span>Question {index + 1}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">{question}</p>
              <Textarea
                placeholder="Take your time to reflect and write your thoughts..."
                value={responses[index]}
                onChange={(e) => updateResponse(index, e.target.value)}
                rows={4}
                disabled={completedToday}
                className="resize-none"
              />
              {responses[index].trim().length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Response saved</span>
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
                  Saving Reflection...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Save Today's Reflection ({completedCount}/5 questions)
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
              <span>Recent Reflections</span>
            </CardTitle>
            <CardDescription>
              Your reflection activity over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReflections.slice(0, 7).map((reflection) => (
                <div key={reflection.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(reflection.date).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="outline">
                    {reflection.completedQuestions}/5 questions
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