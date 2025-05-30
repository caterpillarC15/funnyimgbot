import { NextRequest, NextResponse } from 'next/server'
import { getGrokTrendingTopics } from '@/utils/grokTrending'

export async function GET() {
  console.log('📰 [TRENDING] Fetching Grok trending topics only...')
  
  try {
    // ONLY use Grok - no other sources
    const grokData = await getGrokTrendingTopics()
    
    if (!grokData || !grokData.trends || grokData.trends.length === 0) {
      console.log('❌ [TRENDING] No verified trends from Grok')
      
      // Return minimal fallback that won't pollute data
      return NextResponse.json({
        trends: [
          {
            topic: "Cats being dramatic",
            description: "Felines acting like they're in a soap opera",
            category: "animals",
            popularity: 8
          },
          {
            topic: "Dogs with jobs",
            description: "Professional canines in the workplace",
            category: "animals", 
            popularity: 9
          }
        ],
        timestamp: new Date().toISOString(),
        sources: ['fallback'],
        message: 'Using clean fallback - Grok verification failed'
      })
    }

    console.log(`✅ [TRENDING] Got ${grokData.trends.length} verified Grok trends`)
    
    return NextResponse.json({
      trends: grokData.trends,
      timestamp: grokData.timestamp,
      sources: ['grok'],
      searchCount: grokData.searchCount,
      ranking_methodology: grokData.ranking_methodology
    })
    
  } catch (error) {
    console.error('❌ [TRENDING_ERROR]', error)
    
    return NextResponse.json({
      trends: [
        {
          topic: "Cats being dramatic",
          description: "Felines acting like they're in a soap opera", 
          category: "animals",
          popularity: 8
        }
      ],
      timestamp: new Date().toISOString(),
      sources: ['fallback'],
      error: 'Grok API failed, using minimal fallback'
    })
  }
} 