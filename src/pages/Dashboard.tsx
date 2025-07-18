import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { 
  Lightbulb, 
  MessageSquare, 
  BookOpen, 
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react'
import { blink } from '../blink/client'

export function Dashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    conceptsCreated: 0,
    reflectionsCompleted: 0,
    streakDays: 0
  })

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await blink.auth.me()
        setUser(userData)
        
        // Load user stats from database
        const concepts = await blink.db.concepts.list({
          where: { userId: userData.id },
          limit: 1000
        })
        
        const reflections = await blink.db.reflections.list({
          where: { userId: userData.id },
          limit: 1000
        })

        setStats({
          conceptsCreated: concepts.length,
          reflectionsCompleted: reflections.length,
          streakDays: calculateStreak(reflections)
        })
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [])

  const calculateStreak = (reflections: any[]) => {
    if (reflections.length === 0) return 0
    
    const today = new Date()
    let streak = 0
    let currentDate = new Date(today)
    
    for (let i = 0; i < 30; i++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const hasReflection = reflections.some(r => 
        r.createdAt.startsWith(dateStr)
      )
      
      if (hasReflection) {
        streak++
      } else if (i > 0) {
        break
      }
      
      currentDate.setDate(currentDate.getDate() - 1)
    }
    
    return streak
  }

  const quickActions = [
    {
      title: 'Create Differentiation Strategy',
      description: 'Combine your experiences with cross-industry ideas',
      icon: Lightbulb,
      href: '/workshop',
      color: 'bg-blue-500'
    },
    {
      title: 'Daily Reflection',
      description: 'Answer today\'s differentiation questions',
      icon: MessageSquare,
      href: '/reflection',
      color: 'bg-green-500'
    },
    {
      title: 'Browse Concepts',
      description: 'Explore your saved differentiation concepts',
      icon: BookOpen,
      href: '/library',
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!</h1>
          <p className="text-muted-foreground mt-1">
            Ready to discover new ways to differentiate yourself?
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concepts Created</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conceptsCreated}</div>
            <p className="text-xs text-muted-foreground">
              Differentiation strategies saved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reflections</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reflectionsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Questions answered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streakDays}</div>
            <p className="text-xs text-muted-foreground">
              Days of reflection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Card key={action.title} className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link to={action.href}>
                <CardHeader>
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Your Progress</span>
          </CardTitle>
          <CardDescription>
            Keep building your differentiation skills
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Concepts Created</span>
              <span>{stats.conceptsCreated}/10</span>
            </div>
            <Progress value={(stats.conceptsCreated / 10) * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Weekly Reflection Goal</span>
              <span>{Math.min(stats.streakDays, 7)}/7</span>
            </div>
            <Progress value={(Math.min(stats.streakDays, 7) / 7) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}