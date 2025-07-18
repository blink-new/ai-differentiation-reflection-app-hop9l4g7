import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { 
  Lightbulb, 
  Plus, 
  Sparkles, 
  Save, 
  RefreshCw,
  X
} from 'lucide-react'
import { blink } from '../blink/client'
import { toast } from '../hooks/use-toast'

const experienceCategories = [
  'Technology', 'Healthcare', 'Education', 'Finance', 'Retail', 'Manufacturing',
  'Hospitality', 'Transportation', 'Entertainment', 'Sports', 'Art', 'Music',
  'Consulting', 'Marketing', 'Sales', 'Operations', 'Leadership', 'Startup',
  'Non-profit', 'Government', 'Research', 'Design', 'Writing', 'Photography'
]

const crossIndustryIdeas = [
  'Subscription model from Netflix → Apply to fitness coaching',
  'Gamification from video games → Apply to learning platforms',
  'Just-in-time delivery from Toyota → Apply to content creation',
  'Freemium model from software → Apply to consulting services',
  'Community building from Discord → Apply to professional networking',
  'Personalization from Spotify → Apply to meal planning',
  'Marketplace model from Airbnb → Apply to skill sharing',
  'Automation from manufacturing → Apply to customer service',
  'Storytelling from Disney → Apply to brand marketing',
  'Minimalism from Apple → Apply to productivity tools'
]

export function DifferentiationWorkshop() {
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([])
  const [customExperience, setCustomExperience] = useState('')
  const [generatedIdea, setGeneratedIdea] = useState('')
  const [generatedCatchphrase, setGeneratedCatchphrase] = useState('')
  const [conceptTitle, setConceptTitle] = useState('')
  const [conceptNotes, setConceptNotes] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [user, setUser] = useState(null)

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

  const addCustomExperience = () => {
    if (customExperience.trim() && !selectedExperiences.includes(customExperience.trim())) {
      setSelectedExperiences([...selectedExperiences, customExperience.trim()])
      setCustomExperience('')
    }
  }

  const removeExperience = (experience: string) => {
    setSelectedExperiences(selectedExperiences.filter(exp => exp !== experience))
  }

  const generateIdea = async () => {
    if (selectedExperiences.length === 0) {
      toast({
        title: "Select experiences first",
        description: "Please select at least one experience or attribute to generate ideas.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const randomCrossIndustryIdea = crossIndustryIdeas[Math.floor(Math.random() * crossIndustryIdeas.length)]
      
      const { text } = await blink.ai.generateText({
        prompt: `Create a unique differentiation strategy by combining these user experiences/attributes: ${selectedExperiences.join(', ')} with this cross-industry concept: ${randomCrossIndustryIdea}. 

        Provide a creative, actionable differentiation idea that leverages the user's background in a unique way. Focus on practical application and competitive advantage. Keep it concise but inspiring.`,
        maxTokens: 200
      })

      setGeneratedIdea(text)
      
      // Generate catchphrase
      const { text: catchphrase } = await blink.ai.generateText({
        prompt: `Based on this differentiation strategy: "${text}", create a memorable, punchy catchphrase or tagline that captures the essence of this unique approach. Make it catchy, professional, and memorable. Provide just the catchphrase, nothing else.`,
        maxTokens: 50
      })

      setGeneratedCatchphrase(catchphrase.replace(/['"]/g, ''))
      
    } catch (error) {
      console.error('Error generating idea:', error)
      toast({
        title: "Generation failed",
        description: "Failed to generate idea. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const saveConcept = async () => {
    if (!conceptTitle.trim() || !generatedIdea) {
      toast({
        title: "Missing information",
        description: "Please provide a title and generate an idea first.",
        variant: "destructive"
      })
      return
    }

    try {
      await blink.db.concepts.create({
        userId: user.id,
        title: conceptTitle,
        idea: generatedIdea,
        catchphrase: generatedCatchphrase,
        experiences: selectedExperiences.join(', '),
        notes: conceptNotes,
        createdAt: new Date().toISOString()
      })

      toast({
        title: "Concept saved!",
        description: "Your differentiation concept has been saved to your library."
      })

      // Reset form
      setConceptTitle('')
      setConceptNotes('')
      setGeneratedIdea('')
      setGeneratedCatchphrase('')
      setSelectedExperiences([])
      
    } catch (error) {
      console.error('Error saving concept:', error)
      toast({
        title: "Save failed",
        description: "Failed to save concept. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Differentiation Workshop</h1>
        <p className="text-muted-foreground">
          Combine your unique experiences with cross-industry insights to create powerful differentiation strategies
        </p>
      </div>

      {/* Experience Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5" />
            <span>Your Experiences & Attributes</span>
          </CardTitle>
          <CardDescription>
            Select areas where you have experience, skills, or unique attributes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {experienceCategories.map((category) => (
              <Button
                key={category}
                variant={selectedExperiences.includes(category) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (selectedExperiences.includes(category)) {
                    removeExperience(category)
                  } else {
                    setSelectedExperiences([...selectedExperiences, category])
                  }
                }}
                className="justify-start"
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="flex space-x-2">
            <Input
              placeholder="Add custom experience..."
              value={customExperience}
              onChange={(e) => setCustomExperience(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomExperience()}
            />
            <Button onClick={addCustomExperience} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {selectedExperiences.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Experiences:</Label>
              <div className="flex flex-wrap gap-2">
                {selectedExperiences.map((experience) => (
                  <Badge key={experience} variant="secondary" className="flex items-center space-x-1">
                    <span>{experience}</span>
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeExperience(experience)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Idea Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>AI-Generated Differentiation Strategy</span>
          </CardTitle>
          <CardDescription>
            Generate unique ideas by combining your experiences with cross-industry concepts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={generateIdea} 
            disabled={isGenerating || selectedExperiences.length === 0}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Differentiation Idea
              </>
            )}
          </Button>

          {generatedIdea && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-sm font-medium">Differentiation Strategy:</Label>
                <p className="mt-1 text-sm leading-relaxed">{generatedIdea}</p>
              </div>
              
              {generatedCatchphrase && (
                <div>
                  <Label className="text-sm font-medium">Suggested Catchphrase:</Label>
                  <p className="mt-1 text-sm font-medium italic">"{generatedCatchphrase}"</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Concept */}
      {generatedIdea && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Save className="w-5 h-5" />
              <span>Save Your Concept</span>
            </CardTitle>
            <CardDescription>
              Give your differentiation concept a title and add notes for future reference
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Concept Title</Label>
              <Input
                id="title"
                placeholder="e.g., Tech-Healthcare Hybrid Approach"
                value={conceptTitle}
                onChange={(e) => setConceptTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional thoughts, implementation ideas, or refinements..."
                value={conceptNotes}
                onChange={(e) => setConceptNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={saveConcept} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save to Concept Library
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}