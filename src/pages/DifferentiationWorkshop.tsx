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
  'テクノロジー', 'ヘルスケア', '教育', '金融', '小売', '製造業',
  'ホスピタリティ', '交通', 'エンターテイメント', 'スポーツ', 'アート', '音楽',
  'コンサルティング', 'マーケティング', '営業', 'オペレーション', 'リーダーシップ', 'スタートアップ',
  'NPO', '政府', '研究', 'デザイン', 'ライティング', '写真'
]

const crossIndustryIdeas = [
  'Netflixのサブスクリプションモデル → フィットネスコーチングに応用',
  'ビデオゲームのゲーミフィケーション → 学習プラットフォームに応用',
  'トヨタのジャストインタイム配送 → コンテンツ制作に応用',
  'ソフトウェアのフリーミアムモデル → コンサルティングサービスに応用',
  'Discordのコミュニティ構築 → プロフェッショナルネットワーキングに応用',
  'Spotifyのパーソナライゼーション → 食事プランニングに応用',
  'Airbnbのマーケットプレイスモデル → スキルシェアリングに応用',
  '製造業の自動化 → カスタマーサービスに応用',
  'ディズニーのストーリーテリング → ブランドマーケティングに応用',
  'Appleのミニマリズム → 生産性ツールに応用'
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
        title: "まず経験を選択してください",
        description: "アイデアを生成するには、少なくとも1つの経験や属性を選択してください。",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const randomCrossIndustryIdea = crossIndustryIdeas[Math.floor(Math.random() * crossIndustryIdeas.length)]
      
      const { text } = await blink.ai.generateText({
        prompt: `以下のユーザーの経験・属性：${selectedExperiences.join('、')} と、この異業種コンセプト：${randomCrossIndustryIdea} を組み合わせて、ユニークな差別化戦略を作成してください。

        ユーザーの背景をユニークな方法で活用する、創造的で実行可能な差別化アイデアを提供してください。実用的な応用と競争優位性に焦点を当ててください。簡潔でありながら刺激的な内容にしてください。日本語で回答してください。`,
        maxTokens: 200
      })

      setGeneratedIdea(text)
      
      // Generate catchphrase
      const { text: catchphrase } = await blink.ai.generateText({
        prompt: `この差別化戦略：「${text}」に基づいて、このユニークなアプローチの本質を捉える記憶に残る、パンチの効いたキャッチフレーズやタグラインを作成してください。キャッチーで、プロフェッショナルで、記憶に残るものにしてください。キャッチフレーズのみを提供し、他は何も含めないでください。日本語で回答してください。`,
        maxTokens: 50
      })

      setGeneratedCatchphrase(catchphrase.replace(/['\"]/g, ''))
      
    } catch (error) {
      console.error('Error generating idea:', error)
      toast({
        title: "生成に失敗しました",
        description: "アイデアの生成に失敗しました。もう一度お試しください。",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const saveConcept = async () => {
    if (!conceptTitle.trim() || !generatedIdea) {
      toast({
        title: "情報が不足しています",
        description: "タイトルを入力し、まずアイデアを生成してください。",
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
        experiences: selectedExperiences.join('、'),
        notes: conceptNotes,
        createdAt: new Date().toISOString()
      })

      toast({
        title: "コンセプトを保存しました！",
        description: "差別化コンセプトがライブラリに保存されました。"
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
        title: "データベースが利用できません",
        description: "現在データベースが利用できません。後でもう一度お試しください。",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">差別化ワークショップ</h1>
        <p className="text-muted-foreground">
          あなたのユニークな経験と異業種の洞察を組み合わせて、強力な差別化戦略を作成しましょう
        </p>
      </div>

      {/* Experience Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5" />
            <span>あなたの経験・属性</span>
          </CardTitle>
          <CardDescription>
            経験、スキル、またはユニークな属性がある分野を選択してください
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
              placeholder="カスタム経験を追加..."
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
              <Label>選択された経験：</Label>
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
            <span>AI生成差別化戦略</span>
          </CardTitle>
          <CardDescription>
            あなたの経験と異業種コンセプトを組み合わせてユニークなアイデアを生成
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
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                差別化アイデアを生成
              </>
            )}
          </Button>

          {generatedIdea && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-sm font-medium">差別化戦略：</Label>
                <p className="mt-1 text-sm leading-relaxed">{generatedIdea}</p>
              </div>
              
              {generatedCatchphrase && (
                <div>
                  <Label className="text-sm font-medium">提案キャッチフレーズ：</Label>
                  <p className="mt-1 text-sm font-medium italic">「{generatedCatchphrase}」</p>
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
              <span>コンセプトを保存</span>
            </CardTitle>
            <CardDescription>
              差別化コンセプトにタイトルを付けて、将来の参考のためにメモを追加してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">コンセプトタイトル</Label>
              <Input
                id="title"
                placeholder="例：テック・ヘルスケア融合アプローチ"
                value={conceptTitle}
                onChange={(e) => setConceptTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="notes">追加メモ（任意）</Label>
              <Textarea
                id="notes"
                placeholder="追加の考え、実装アイデア、改良点などを追加..."
                value={conceptNotes}
                onChange={(e) => setConceptNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={saveConcept} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              コンセプトライブラリに保存
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}