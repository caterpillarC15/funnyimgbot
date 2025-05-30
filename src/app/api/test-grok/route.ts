import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  console.log('🧪 [GROK_TEST_V2] Testing Grok API with explicit search prompts...')
  
  try {
    if (!process.env.GROK_API_KEY) {
      console.log('❌ [GROK_API_KEY] Missing GROK_API_KEY environment variable')
      return NextResponse.json(
        { error: 'GROK_API_KEY is not configured' },
        { status: 500 }
      )
    }

    console.log('🔑 [GROK_API_KEY] Found API key, testing with explicit search prompts...')

    // Test 1: Explicit Live Search prompt (from @monitor.md)
    console.log('🔍 [TEST_1] Testing Live Search capability...')
    const liveSearchPrompt = `Please use your Live Search to find what's currently trending on X in the United States RIGHT NOW. 

Search X's trending topics and give me real data from today, not hypothetical examples.

I need actual trending hashtags and topics that are live on X in the USA at this moment.

Return as JSON format with topic, description, category, and popularity.`

    const liveSearchTest = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You have access to real-time X data. When asked for trending topics, search X directly and return actual current trends, not hypothetical examples. Use your Live Search capability."
          },
          {
            role: "user",
            content: liveSearchPrompt
          }
        ],
        model: "grok-3-latest",
        stream: false,
        temperature: 0.1
      })
    })

    if (!liveSearchTest.ok) {
      const errorText = await liveSearchTest.text()
      console.log(`❌ [LIVE_SEARCH_FAILED] Status: ${liveSearchTest.status}, Error: ${errorText}`)
      return NextResponse.json({
        error: 'Live Search test failed',
        status: liveSearchTest.status,
        details: errorText
      }, { status: liveSearchTest.status })
    }

    const liveSearchResponse = await liveSearchTest.json()
    console.log('✅ [LIVE_SEARCH_SUCCESS] Got Live Search response!')
    console.log('📊 [LIVE_SEARCH_SEARCHES]', liveSearchResponse.usage?.number_searches || 0)
    console.log('📝 [LIVE_SEARCH_RESPONSE]', JSON.stringify(liveSearchResponse, null, 2))

    // Test 2: Direct search command (from @monitor.md)
    console.log('🔍 [TEST_2] Testing direct search command...')
    const directSearchPrompt = `Search X now: What are the current trending topics and hashtags in the United States? 

I need you to use your real-time X access to find what's actually trending RIGHT NOW, not generate examples.

Look for:
- #hashtags that are trending
- Breaking news topics
- Viral content
- Popular discussions

Give me real data from X's trending section for the USA.`

    const directSearchTest = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: directSearchPrompt
          }
        ],
        model: "grok-3-latest",
        stream: false,
        temperature: 0
      })
    })

    if (!directSearchTest.ok) {
      const errorText = await directSearchTest.text()
      console.log(`❌ [DIRECT_SEARCH_FAILED] Status: ${directSearchTest.status}, Error: ${errorText}`)
      return NextResponse.json({
        liveSearchTest: liveSearchResponse,
        directSearchTest: {
          error: 'Failed to get direct search',
          status: directSearchTest.status,
          details: errorText
        }
      })
    }

    const directSearchResponse = await directSearchTest.json()
    console.log('✅ [DIRECT_SEARCH_SUCCESS] Got direct search response!')
    console.log('📊 [DIRECT_SEARCH_SEARCHES]', directSearchResponse.usage?.number_searches || 0)
    console.log('📝 [DIRECT_SEARCH_RESPONSE]', JSON.stringify(directSearchResponse, null, 2))

    // Test 3: Structured search with tools (from @monitor.md)
    console.log('🔍 [TEST_3] Testing with tools/functions for search...')
    const structuredSearchPrompt = `I need you to perform a live search on X (Twitter) for current trending topics in the United States. This should be real data from X's trending section, not AI-generated examples.

Search query: "trending topics United States X Twitter"

Please find:
1. Current hashtags trending in the USA
2. Topics with high engagement 
3. Breaking news trending on X
4. Viral content in the US

Return as structured JSON with actual data from your X search.`

    const structuredSearchTest = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: structuredSearchPrompt
          }
        ],
        model: "grok-3-latest",
        stream: false,
        temperature: 0.1,
        // Enable tools if available
        tools: [
          {
            type: "function",
            function: {
              name: "search_x_trends",
              description: "Search current trending topics on X"
            }
          }
        ]
      })
    })

    if (!structuredSearchTest.ok) {
      const errorText = await structuredSearchTest.text()
      console.log(`❌ [STRUCTURED_SEARCH_FAILED] Status: ${structuredSearchTest.status}, Error: ${errorText}`)
      return NextResponse.json({
        liveSearchTest: liveSearchResponse,
        directSearchTest: directSearchResponse,
        structuredSearchTest: {
          error: 'Failed to get structured search',
          status: structuredSearchTest.status,
          details: errorText
        }
      })
    }

    const structuredSearchResponse = await structuredSearchTest.json()
    console.log('✅ [STRUCTURED_SEARCH_SUCCESS] Got structured search response!')
    console.log('📊 [STRUCTURED_SEARCH_SEARCHES]', structuredSearchResponse.usage?.number_searches || 0)
    console.log('📝 [STRUCTURED_SEARCH_RESPONSE]', JSON.stringify(structuredSearchResponse, null, 2))

    // Summary of all search counts
    const totalSearches = (liveSearchResponse.usage?.number_searches || 0) + 
                         (directSearchResponse.usage?.number_searches || 0) + 
                         (structuredSearchResponse.usage?.number_searches || 0)

    console.log(`📊 [SEARCH_SUMMARY] Total searches performed: ${totalSearches}`)
    
    if (totalSearches > 0) {
      console.log('🎉 [SUCCESS] Grok performed actual searches! We found the right prompts!')
    } else {
      console.log('⚠️ [NO_SEARCHES] Still getting 0 searches. May need different approach.')
    }

    // Return comprehensive test results
    return NextResponse.json({
      success: true,
      searchSummary: {
        totalSearchesPerformed: totalSearches,
        searchCapabilityDetected: totalSearches > 0
      },
      tests: {
        liveSearchTest: {
          status: 'success',
          searches: liveSearchResponse.usage?.number_searches || 0,
          response: liveSearchResponse
        },
        directSearchTest: {
          status: 'success', 
          searches: directSearchResponse.usage?.number_searches || 0,
          response: directSearchResponse
        },
        structuredSearchTest: {
          status: 'success',
          searches: structuredSearchResponse.usage?.number_searches || 0,
          response: structuredSearchResponse
        }
      },
      conclusion: totalSearches > 0 ? 
        'Found working prompts for Grok Live Search!' : 
        'Grok may not have Live Search capability with current API access',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [GROK_TEST_V2_ERROR]', error)
    return NextResponse.json({
      error: 'Failed to test Grok API with explicit search prompts',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 