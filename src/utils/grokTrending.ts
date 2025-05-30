interface GrokTrendingTopic {
    topic: string
    description: string
    category: string
    popularity: number
    ranking_reason: string        // NEW: Why this trend is ranked this way
    engagement_metrics?: {        // NEW: Specific metrics
      tweet_volume?: string
      viral_score?: number
      time_trending?: string
    }
    date_first_seen?: string     // NEW: When trend started
    hashtags?: string[]
    isRealTime: boolean
  }
  
  interface GrokTrendingResponse {
    trends: GrokTrendingTopic[]
    timestamp: string
    source: string
    searchCount: number
    isRealTime: boolean
    date_range: string           // NEW: Time period searched
    ranking_methodology: string  // NEW: How trends were ranked
  }
  
  export async function getGrokTrendingTopics(
    timeframeHours: number = 24  // NEW: Configurable time limit
  ): Promise<GrokTrendingResponse | null> {
    try {
      if (!process.env.GROK_API_KEY) {
        console.log('⚠️ [GROK_UTILITY] No GROK_API_KEY found')
        return null
      }
  
      const dateLimit = new Date()
      dateLimit.setHours(dateLimit.getHours() - timeframeHours)
      const dateLimitString = dateLimit.toISOString().split('T')[0] // YYYY-MM-DD format
  
      console.log(`🔍 [GROK_UTILITY] Searching trends from last ${timeframeHours} hours (since ${dateLimitString})...`)
  
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`
        },
        body: JSON.stringify({
          model: "grok-3",
          messages: [
            {
              role: "system",
              content: `You are a real-time social media trend analyst. Use your live search to find current trends and provide detailed ranking reasoning. Only include content from the last ${timeframeHours} hours. Today's date is ${new Date().toISOString().split('T')[0]}.`
            },
            {
              role: "user",
              content: `Search X (Twitter) and social media for trending topics in the United States from the last ${timeframeHours} hours only.
  
DATE REQUIREMENT: Only include trends that started or became viral AFTER ${dateLimitString}. Do not include anything older than ${timeframeHours} hours.
  
RANKING REQUIREMENT: For each trend, explain WHY you ranked it at that popularity level. Consider:
- Tweet volume and engagement
- How quickly it's spreading (viral velocity)
- Cross-platform presence (X, TikTok, Instagram, etc.)
- Meme potential and shareability
- Current relevance and cultural impact
  
Find 15-20 current trending topics and rank them by actual viral metrics.
  
Return as JSON:
{
  "ranking_methodology": "Explain how you ranked these trends and what data you used",
  "date_range": "Last ${timeframeHours} hours",
  "trends": [
    {
      "topic": "trending topic/hashtag",
      "description": "what this trend is about",
      "category": "social|entertainment|tech|news|sports|politics|lifestyle",
      "popularity": 1-10,
      "ranking_reason": "Detailed explanation of why this got this popularity score based on engagement, virality, etc.",
      "engagement_metrics": {
        "tweet_volume": "number of tweets or estimate",
        "viral_score": 1-10,
        "time_trending": "how long it's been trending"
      },
      "date_first_seen": "when this trend started",
      "hashtags": ["#relevant", "#hashtags"]
    }
  ]
}
  
CRITICAL: Only include trends from the last ${timeframeHours} hours. Show your reasoning for each ranking.`
            }
          ],
          stream: false,
          temperature: 0.1,  // Very low for factual accuracy
          max_tokens: 3000,  // More tokens for detailed reasoning
          search_parameters: {
            mode: "on"  // Using the working config we discovered
          }
        })
      })
  
      if (!response.ok) {
        console.log(`❌ [GROK_UTILITY] API error: ${response.status}`)
        return null
      }
  
      const data = await response.json()
      const content = data.choices[0]?.message?.content
      const searchCount = data.usage?.number_searches || 0
  
      console.log(`📊 [GROK_UTILITY] Performed ${searchCount} searches`)
  
      if (searchCount === 0) {
        console.log('⚠️ [GROK_UTILITY] No searches performed')
        return null
      }
  
      console.log(`✅ [GROK_UTILITY] Live Search active! ${searchCount} searches`)
  
      if (!content) {
        console.log('❌ [GROK_UTILITY] No content in response')
        return null
      }
  
      const parsed = parseRankedResponse(content, timeframeHours)
      if (!parsed) {
        console.log('❌ [GROK_UTILITY] Could not parse response')
        return null
      }
  
      // Additional date filtering as backup
      const dateFilteredTrends = filterByDate(parsed.trends, timeframeHours)
  
      console.log(`🎯 [GROK_UTILITY] Got ${dateFilteredTrends.length} trends from last ${timeframeHours} hours`)
      
      // Log ranking reasoning
      if (parsed.ranking_methodology) {
        console.log(`📈 [RANKING] ${parsed.ranking_methodology}`)
      }
  
      return {
        trends: dateFilteredTrends.slice(0, 10),
        timestamp: new Date().toISOString(),
        source: 'grok_live_search_ranked',
        searchCount,
        isRealTime: true,
        date_range: `Last ${timeframeHours} hours`,
        ranking_methodology: parsed.ranking_methodology || "Based on engagement and virality metrics"
      }
  
    } catch (error) {
      console.error('❌ [GROK_UTILITY_ERROR]', error)
      return null
    }
  }
  
  // Parse response with ranking methodology
  function parseRankedResponse(content: string, timeframeHours: number): {
    trends: GrokTrendingTopic[]
    ranking_methodology?: string
  } | null {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.log('❌ [PARSE] No JSON found in response')
        return null
      }
  
      const parsed = JSON.parse(jsonMatch[0])
      
      if (!parsed.trends || !Array.isArray(parsed.trends)) {
        console.log('❌ [PARSE] Invalid trends format')
        return null
      }
  
      const cleanedTrends = parsed.trends
        .filter((trend: any) => trend.topic && trend.description)
        .map((trend: any) => ({
          topic: trend.topic.trim(),
          description: trend.description.trim(),
          category: trend.category || 'social',
          popularity: Number(trend.popularity) || 5,
          ranking_reason: trend.ranking_reason || 'No ranking reason provided',
          engagement_metrics: trend.engagement_metrics || {},
          date_first_seen: trend.date_first_seen,
          hashtags: trend.hashtags || extractHashtags(trend.topic),
          isRealTime: true
        }))
  
      return { 
        trends: cleanedTrends,
        ranking_methodology: parsed.ranking_methodology
      }
  
    } catch (error) {
      console.error('❌ [PARSE_ERROR]', error)
      return null
    }
  }
  
  // Filter trends by date
  function filterByDate(trends: GrokTrendingTopic[], timeframeHours: number): GrokTrendingTopic[] {
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - timeframeHours)
  
    return trends.filter(trend => {
      // Check for obvious old date patterns
      const hasOldYear = /20(1[0-9]|2[0-3])\b/.test(trend.topic + ' ' + trend.description)
      if (hasOldYear) {
        console.log(`🗑️ [DATE_FILTER] Removing old trend: ${trend.topic}`)
        return false
      }
  
      // Check date_first_seen if provided
      if (trend.date_first_seen) {
        const trendDate = new Date(trend.date_first_seen)
        if (trendDate < cutoffDate) {
          console.log(`🗑️ [DATE_FILTER] Trend too old: ${trend.topic} (${trend.date_first_seen})`)
          return false
        }
      }
  
      return true
    })
    .sort((a, b) => {
      // Sort by popularity (ranking)
      return b.popularity - a.popularity
    })
  }
  
  function extractHashtags(text: string): string[] {
    const hashtags = text.match(/#\w+/g) || []
    return hashtags
  }
  
  // Quick trends with different time limits
  export async function getGrokTrends24Hours(): Promise<GrokTrendingResponse | null> {
    return getGrokTrendingTopics(24)
  }
  
  export async function getGrokTrends12Hours(): Promise<GrokTrendingResponse | null> {
    return getGrokTrendingTopics(12)
  }
  
  export async function getGrokTrends6Hours(): Promise<GrokTrendingResponse | null> {
    return getGrokTrendingTopics(6)
  }
  
  // Test ranking system
  export async function testRankingSystem(): Promise<void> {
    console.log('🧪 [TEST] Testing ranking system...')
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-3",
        messages: [{ 
          role: "user", 
          content: "Search social media and rank the top 3 trending topics right now. Explain your ranking methodology and why each trend got its score." 
        }],
        search_parameters: { mode: "on" }
      })
    })
  
    if (response.ok) {
      const data = await response.json()
      const searchCount = data.usage?.number_searches || 0
      console.log(`🔍 [TEST] Ranking test: ${searchCount} searches`)
      console.log(`📝 [TEST] Response preview: ${data.choices[0]?.message?.content?.substring(0, 300)}...`)
    }
  }