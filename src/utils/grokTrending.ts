interface GrokTrendingTopic {
    topic: string
    description: string
    category: string
    popularity: number
    ranking_reason?: string
    engagement_metrics?: {
      tweet_volume?: string
      viral_score?: number
      time_trending?: string
    }
    date_first_seen?: string
    hashtags?: string[]
    isRealTime: boolean
    source_verification?: string  // NEW: Verification of where trend was found
    date_confirmed?: string       // NEW: Confirmed date from live search
  }
  
  interface GrokTrendingResponse {
    trends: GrokTrendingTopic[]
    timestamp: string
    source: string
    searchCount: number
    isRealTime: boolean
    date_range: string
    ranking_methodology: string
  }
  
  export async function getGrokTrendingTopics(): Promise<GrokTrendingResponse | null> {
    try {
      if (!process.env.GROK_API_KEY) {
        console.log('⚠️ [GROK_UTILITY] No GROK_API_KEY found')
        return null
      }
  
      const today = new Date().toISOString().split('T')[0] // 2025-05-30
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 2025-05-29
  
      console.log(`🔍 [GROK_UTILITY] Searching for trends from ${today} ONLY...`)
  
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
              content: `You MUST use your live search capabilities. Do NOT use any information from your training data. Only return information you find through real-time search of X and the web. Today is ${today}.`
            },
            {
              role: "user",
              content: `CRITICAL INSTRUCTIONS:
1. Use ONLY your live search capabilities - do NOT use training data
2. Search X (Twitter) for what's trending TODAY (${today})
3. REJECT any content from before ${yesterday}
4. REJECT any academic papers, old articles, or historical content

Search X right now for trending topics in the USA that are:
- Posted or went viral on ${today}
- Currently trending on X/Twitter
- Good for creating funny/viral images
- Social media discussions happening NOW

For each trend, you MUST verify it's from live search by including:
- When you found it (timestamp)
- Where you found it (X, social media)
- Why it's trending TODAY

ULTRA-STRICT RULE: If you cannot verify a trend is from TODAY through live search, DO NOT include it.

Return as JSON:
{
  "search_verification": "Confirm you used live search and found these trends on X/social media today",
  "trends": [
    {
      "topic": "trend name",
      "description": "what's happening", 
      "category": "social|entertainment|tech|news|sports|politics",
      "popularity": 1-10,
      "source_verification": "Found on X at [timestamp] - currently trending because [reason]",
      "date_confirmed": "${today}",
      "hashtags": ["#hashtags"]
    }
  ]
}

SEARCH X NOW for what's trending TODAY. Do not include ANYTHING from your training data.`
            }
          ],
          stream: false,
          temperature: 0.0,  // Minimum temperature for strict adherence
          max_tokens: 2000,
          search_parameters: {
            mode: "on"  // Force live search
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
        console.log('❌ [GROK_UTILITY] CRITICAL: No searches performed - Live Search failed')
        return null
      }
  
      console.log(`✅ [GROK_UTILITY] Live Search confirmed: ${searchCount} searches`)
  
      if (!content) {
        console.log('❌ [GROK_UTILITY] No content in response')
        return null
      }
  
      const parsed = parseStrictResponse(content)
      if (!parsed) {
        console.log('❌ [GROK_UTILITY] Could not parse response')
        return null
      }
  
      // NUCLEAR OPTION: Ultra-aggressive filtering
      const ultraFilteredTrends = nuclearFilter(parsed.trends, today)
  
      if (ultraFilteredTrends.length === 0) {
        console.log('❌ [GROK_UTILITY] All trends filtered out - possibly all old content')
        return null
      }
  
      console.log(`🎯 [GROK_UTILITY] Ultra-filtered to ${ultraFilteredTrends.length} verified current trends`)
  
      return {
        trends: ultraFilteredTrends.slice(0, 10),
        timestamp: new Date().toISOString(),
        source: 'grok_live_search_ultra_strict',
        searchCount,
        isRealTime: true,
        date_range: `Verified from ${today}`,
        ranking_methodology: "Ultra-strict live search verification only"
      }
  
    } catch (error) {
      console.error('❌ [GROK_UTILITY_ERROR]', error)
      return null
    }
  }
  
  // Parse with strict verification
  function parseStrictResponse(content: string): {
    trends: GrokTrendingTopic[]
    search_verification?: string
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
  
      // Verify search confirmation
      if (parsed.search_verification) {
        console.log(`✅ [VERIFICATION] ${parsed.search_verification}`)
      }
  
      const trends = parsed.trends
        .filter((trend: any) => trend.topic && trend.description)
        .map((trend: any) => ({
          topic: trend.topic.trim(),
          description: trend.description.trim(),
          category: trend.category || 'social',
          popularity: Number(trend.popularity) || 5,
          source_verification: trend.source_verification || 'No verification provided',
          date_confirmed: trend.date_confirmed,
          hashtags: trend.hashtags || extractHashtags(trend.topic),
          isRealTime: true,
          ranking_reason: trend.ranking_reason,
          engagement_metrics: trend.engagement_metrics
        }))
  
      return { 
        trends,
        search_verification: parsed.search_verification
      }
  
    } catch (error) {
      console.error('❌ [PARSE_ERROR]', error)
      return null
    }
  }
  
  // NUCLEAR OPTION: Extremely aggressive filtering
  function nuclearFilter(trends: GrokTrendingTopic[], today: string): GrokTrendingTopic[] {
    const bannedPatterns = [
      // Years (any 4-digit year)
      /\b20\d{2}\b/,
      /\(\d{4}\)/,
      
      // Technical/Academic terms
      /radix/i,
      /trick/i,
      /algorithm/i,
      /software defined/i,
      /rasdr/i,
      /astronomy/i,
      /theorem/i,
      /research/i,
      /study/i,
      /paper/i,
      /computational/i,
      /mathematical/i,
      /ieee/i,
      /arxiv/i,
      
      // Old meme formats
      /got you like this/i,
      
      // Generic phrases that often indicate old content
      /announces that she/i,
      /using.*wealth/i
    ]
  
    const suspiciousPhrases = [
      'radix',
      'trick',
      'software',
      'astronomy',
      'algorithm',
      '2017',
      '2018',
      '2019',
      '2020',
      '2021',
      '2022',
      '2023'
    ]
  
    return trends.filter(trend => {
      const fullText = `${trend.topic} ${trend.description}`.toLowerCase()
      
      // Check banned patterns
      const hasBannedPattern = bannedPatterns.some(pattern => pattern.test(fullText))
      if (hasBannedPattern) {
        console.log(`🚫 [NUCLEAR_FILTER] BANNED PATTERN: ${trend.topic}`)
        return false
      }
  
      // Check suspicious phrases
      const suspiciousCount = suspiciousPhrases.filter(phrase => 
        fullText.includes(phrase.toLowerCase())
      ).length
      
      if (suspiciousCount > 0) {
        console.log(`🚫 [NUCLEAR_FILTER] SUSPICIOUS (${suspiciousCount} flags): ${trend.topic}`)
        return false
      }
  
      // Must have verification or be clearly current
      if (!trend.source_verification?.includes(today) && 
          !trend.date_confirmed?.includes(today)) {
        console.log(`🚫 [NUCLEAR_FILTER] NO DATE VERIFICATION: ${trend.topic}`)
        return false
      }
  
      // Additional checks for current relevance
      const currentIndicators = [
        'trending',
        'viral',
        'today',
        'now',
        'current',
        'latest',
        'breaking',
        'new',
        '#'
      ]
  
      const hasCurrentIndicator = currentIndicators.some(indicator => 
        fullText.includes(indicator)
      )
  
      if (!hasCurrentIndicator) {
        console.log(`🚫 [NUCLEAR_FILTER] NO CURRENT INDICATORS: ${trend.topic}`)
        return false
      }
  
      console.log(`✅ [NUCLEAR_FILTER] PASSED: ${trend.topic}`)
      return true
    })
    .sort((a, b) => b.popularity - a.popularity)
  }
  
  function extractHashtags(text: string): string[] {
    const hashtags = text.match(/#\w+/g) || []
    return hashtags
  }
  
  // Emergency fallback: Ask for ONLY hashtags
  export async function getOnlyHashtags(): Promise<string[]> {
    try {
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
            content: "Search X right now: What hashtags are trending in the USA TODAY? Return only hashtags that are currently viral. Format: #hashtag1, #hashtag2, #hashtag3"
          }],
          search_parameters: { mode: "on" }
        })
      })
  
      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0]?.message?.content || ''
        const hashtags = content.match(/#\w+/g) || []
        console.log(`📱 [HASHTAGS] Found: ${hashtags.join(', ')}`)
        return hashtags
      }
      
      return []
    } catch (error) {
      console.log('❌ [HASHTAGS] Error:', error)
      return []
    }
  }
  
  // Quick trends with different time limits (kept for backward compatibility)
  export async function getGrokTrends24Hours(): Promise<GrokTrendingResponse | null> {
    return getGrokTrendingTopics()
  }
  
  export async function getGrokTrends12Hours(): Promise<GrokTrendingResponse | null> {
    return getGrokTrendingTopics()
  }
  
  export async function getGrokTrends6Hours(): Promise<GrokTrendingResponse | null> {
    return getGrokTrendingTopics()
  }