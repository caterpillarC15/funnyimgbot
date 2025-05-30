import { NextRequest, NextResponse } from 'next/server'

interface NewsItem {
  title: string
  description: string
  category: string
  publishedAt: string
}

interface TrendingTopic {
  topic: string
  description: string
  category: string
  popularity: number
}

export async function GET() {
  console.log('📰 [TRENDING] Fetching trending topics...')
  
  try {
    const trends: TrendingTopic[] = []
    
    // Option 1: Use NewsAPI (requires API key)
    if (process.env.NEWS_API_KEY) {
      try {
        const newsResponse = await fetch(
          `https://newsapi.org/v2/top-headlines?country=us&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`
        )
        
        if (newsResponse.ok) {
          const newsData = await newsResponse.json()
          const newsItems: NewsItem[] = newsData.articles || []
          
          newsItems.forEach((item, index) => {
            trends.push({
              topic: item.title.split(' ').slice(0, 5).join(' '), // First 5 words
              description: item.description || item.title,
              category: 'news',
              popularity: 10 - index // Higher for top stories
            })
          })
          
          console.log(`📰 [NEWS_API] Found ${newsItems.length} news items`)
        }
      } catch (error) {
        console.log('⚠️ [NEWS_API_ERROR]', error)
      }
    }
    
    // Option 2: Hacker News API (free, no key needed)
    try {
      const hnResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
      if (hnResponse.ok) {
        const storyIds = await hnResponse.json()
        const topStoryIds = storyIds.slice(0, 5) // Get top 5 stories
        
        for (const storyId of topStoryIds) {
          try {
            const storyResponse = await fetch(
              `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`
            )
            if (storyResponse.ok) {
              const story = await storyResponse.json()
              if (story.title) {
                trends.push({
                  topic: story.title.split(' ').slice(0, 6).join(' '),
                  description: story.title,
                  category: 'tech',
                  popularity: Math.floor(Math.random() * 10) + 1
                })
              }
            }
          } catch (error) {
            console.log('⚠️ [HN_STORY_ERROR]', error)
          }
        }
        
        console.log(`💻 [HACKER_NEWS] Found ${topStoryIds.length} tech stories`)
      }
    } catch (error) {
      console.log('⚠️ [HACKER_NEWS_ERROR]', error)
    }
    
    // Option 3: Reddit API (trending subreddits - no key needed for basic access)
    try {
      const redditResponse = await fetch('https://www.reddit.com/r/popular.json?limit=5')
      if (redditResponse.ok) {
        const redditData = await redditResponse.json()
        const posts = redditData.data?.children || []
        
        posts.forEach((post: any) => {
          const title = post.data?.title
          if (title) {
            trends.push({
              topic: title.split(' ').slice(0, 5).join(' '),
              description: title,
              category: 'social',
              popularity: Math.floor(Math.random() * 10) + 1
            })
          }
        })
        
        console.log(`🔥 [REDDIT] Found ${posts.length} popular posts`)
      }
    } catch (error) {
      console.log('⚠️ [REDDIT_ERROR]', error)
    }
    
    // Add some evergreen funny topics as fallback
    const fallbackTopics: TrendingTopic[] = [
      {
        topic: "Cats wearing business suits",
        description: "Professional felines in corporate attire",
        category: "animals",
        popularity: 8
      },
      {
        topic: "Dogs hosting cooking shows",
        description: "Canine chefs teaching culinary arts",
        category: "animals",
        popularity: 9
      },
      {
        topic: "AI becoming too polite",
        description: "Artificial intelligence with excessive manners",
        category: "tech",
        popularity: 7
      },
      {
        topic: "Millennials explaining TikTok to Gen Z",
        description: "Generational reverse mentoring chaos",
        category: "social",
        popularity: 6
      },
      {
        topic: "Coffee shop productivity theater",
        description: "The art of looking busy while caffeinated",
        category: "lifestyle",
        popularity: 8
      }
    ]
    
    // If no external trends found, use fallback
    if (trends.length === 0) {
      trends.push(...fallbackTopics)
      console.log('🎭 [FALLBACK] Using fallback funny topics')
    } else {
      // Mix in some fallback topics for variety
      trends.push(...fallbackTopics.slice(0, 2))
    }
    
    // Sort by popularity and limit results
    const sortedTrends = trends
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10)
    
    console.log(`✅ [TRENDING] Returning ${sortedTrends.length} trending topics`)
    
    return NextResponse.json({
      trends: sortedTrends,
      timestamp: new Date().toISOString(),
      sources: ['news', 'tech', 'social', 'fallback']
    })
    
  } catch (error) {
    console.error('❌ [TRENDING_ERROR]', error)
    
    // Return fallback data on error
    return NextResponse.json({
      trends: [
        {
          topic: "Cats wearing business suits",
          description: "Professional felines in corporate attire",
          category: "animals",
          popularity: 8
        },
        {
          topic: "Dogs hosting cooking shows", 
          description: "Canine chefs teaching culinary arts",
          category: "animals",
          popularity: 9
        }
      ],
      timestamp: new Date().toISOString(),
      sources: ['fallback'],
      error: 'Failed to fetch live trends, using fallback topics'
    })
  }
} 