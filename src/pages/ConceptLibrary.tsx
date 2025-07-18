import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { 
  BookOpen, 
  Search, 
  Calendar, 
  Lightbulb,
  Trash2,
  Edit,
  Copy
} from 'lucide-react'
import { blink } from '../blink/client'
import { toast } from '../hooks/use-toast'

export function ConceptLibrary() {
  const [user, setUser] = useState(null)
  const [concepts, setConcepts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredConcepts, setFilteredConcepts] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await blink.auth.me()
        setUser(userData)
        
        const userConcepts = await blink.db.concepts.list({
          where: { userId: userData.id },
          orderBy: { createdAt: 'desc' }
        })
        
        setConcepts(userConcepts)
        setFilteredConcepts(userConcepts)
        
      } catch (error) {
        console.error('Error loading concepts:', error)
      }
    }
    
    loadData()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredConcepts(concepts)
    } else {
      const filtered = concepts.filter(concept =>
        concept.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        concept.idea.toLowerCase().includes(searchTerm.toLowerCase()) ||
        concept.experiences.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (concept.catchphrase && concept.catchphrase.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredConcepts(filtered)
    }
  }, [searchTerm, concepts])

  const deleteConcept = async (conceptId: string) => {
    try {
      await blink.db.concepts.delete(conceptId)
      const updatedConcepts = concepts.filter(c => c.id !== conceptId)
      setConcepts(updatedConcepts)
      toast({
        title: "Concept deleted",
        description: "The concept has been removed from your library."
      })
    } catch (error) {
      console.error('Error deleting concept:', error)
      toast({
        title: "Delete failed",
        description: "Failed to delete concept. Please try again.",
        variant: "destructive"
      })
    }
  }

  const copyCatchphrase = (catchphrase: string) => {
    navigator.clipboard.writeText(catchphrase)
    toast({
      title: "Copied!",
      description: "Catchphrase copied to clipboard."
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Concept Library</h1>
          <p className="text-muted-foreground mt-1">
            Your collection of differentiation strategies and ideas
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{concepts.length}</p>
          <p className="text-sm text-muted-foreground">Concepts Saved</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search concepts by title, idea, experiences, or catchphrase..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Concepts Grid */}
      {filteredConcepts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {concepts.length === 0 ? 'No concepts yet' : 'No matching concepts'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {concepts.length === 0 
                ? 'Start creating differentiation strategies in the Workshop to build your library.'
                : 'Try adjusting your search terms to find what you\'re looking for.'
              }
            </p>
            {concepts.length === 0 && (
              <Button onClick={() => window.location.href = '/workshop'}>
                <Lightbulb className="w-4 h-4 mr-2" />
                Go to Workshop
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConcepts.map((concept) => (
            <Card key={concept.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{concept.title}</CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(concept.createdAt)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteConcept(concept.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Experiences */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">EXPERIENCES</p>
                  <div className="flex flex-wrap gap-1">
                    {concept.experiences.split(', ').map((exp, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {exp}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Idea */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">STRATEGY</p>
                  <p className="text-sm leading-relaxed">{concept.idea}</p>
                </div>

                {/* Catchphrase */}
                {concept.catchphrase && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">CATCHPHRASE</p>
                    <div className="flex items-center justify-between bg-muted p-2 rounded">
                      <p className="text-sm font-medium italic">"{concept.catchphrase}"</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCatchphrase(concept.catchphrase)}
                        className="ml-2"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {concept.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">NOTES</p>
                    <p className="text-sm text-muted-foreground">{concept.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {concepts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Library Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{concepts.length}</p>
                <p className="text-sm text-muted-foreground">Total Concepts</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(concepts.flatMap(c => c.experiences.split(', '))).size}
                </p>
                <p className="text-sm text-muted-foreground">Unique Experiences</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {concepts.filter(c => c.catchphrase).length}
                </p>
                <p className="text-sm text-muted-foreground">With Catchphrases</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {concepts.filter(c => c.notes).length}
                </p>
                <p className="text-sm text-muted-foreground">With Notes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}