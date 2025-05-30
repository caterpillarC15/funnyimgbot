import { GoogleGenAI, Modality } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { createGenericFunnyPrompt } from '@/prompts/step1-generic-funny'
import { createTrendingEnhancePrompt } from '@/prompts/step2-trending-enhance'
import { createImageGenerationPrompt, createFinalDescriptionPrompt } from '@/prompts/step3-image-generation'

export async function POST(request: NextRequest) {
  console.log('🎨 [IMAGE_GEN] Starting 3-step generation pipeline...')
  
  try {
    const { prompt } = await request.json()
    console.log(`📝 [USER_PROMPT] "${prompt}"`)

    if (!prompt) {
      console.log('❌ [ERROR] No prompt provided')
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ [API_KEY_ERROR] Gemini API key is not configured')
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      )
    }
    
    console.log(`🔑 [API_KEY] Using 3-step generation pipeline`)
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    try {
      // STEP 1 & TRENDING: Parallel execution
      console.log('🚀 [STEP_1_PARALLEL] Starting generic concept + trending fetch...')
      
      const [genericConceptResponse, trendingResponse] = await Promise.all([
        // Step 1: Generate generic funny concept
        ai.models.generateContent({
          model: process.env.GEMINI_TEXT_GENERATION_MODEL || 'gemini-2.0-flash',
          contents: createGenericFunnyPrompt(prompt)
        }),
        // Fetch trending data
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/trending`)
      ])

      const genericConcept = genericConceptResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || prompt
      console.log(`✨ [STEP_1_COMPLETE] Generic concept: "${genericConcept}"`)

      // Get trending data
      let trendingData = null
      if (trendingResponse.ok) {
        const data = await trendingResponse.json()
        trendingData = data.trends?.[0] || null
        console.log(`📊 [TRENDING_COMPLETE] Got trending: "${trendingData?.topic || 'none'}"`)
      }

      // STEP 2: Enhance with trending context
      let enhancedConcept = genericConcept
      if (trendingData) {
        console.log('🔥 [STEP_2] Enhancing with trending context...')
        
        const enhanceResponse = await ai.models.generateContent({
          model: process.env.GEMINI_TEXT_GENERATION_MODEL || 'gemini-2.0-flash',
          contents: createTrendingEnhancePrompt(
            genericConcept, 
            trendingData.topic, 
            trendingData.description
          )
        })

        const enhanced = enhanceResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (enhanced && enhanced.length > 10) {
          enhancedConcept = enhanced
          console.log(`✨ [STEP_2_COMPLETE] Enhanced concept: "${enhancedConcept}"`)
        } else {
          console.log(`⚠️ [STEP_2_FALLBACK] Using generic concept`)
        }
      } else {
        console.log(`⚠️ [STEP_2_SKIP] No trending data, using generic concept`)
      }

      // STEP 3: Generate image from enhanced concept
      console.log('🎨 [STEP_3] Generating image from enhanced concept...')
      
      const finalImagePrompt = createImageGenerationPrompt(enhancedConcept)
      console.log(`🎯 [FINAL_PROMPT] "${finalImagePrompt}"`)

      const imageResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp-image-generation",
        contents: finalImagePrompt,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      })

      console.log(`📡 [IMAGE_RESPONSE] Success!`)

      // Extract image data
      let imageUrl = ''
      const candidates = imageResponse.candidates || []
      
      if (candidates.length > 0) {
        const parts = candidates[0].content?.parts || []
        
        for (const part of parts) {
          if (part.inlineData?.data) {
            const base64Image = part.inlineData.data
            const mimeType = part.inlineData.mimeType || 'image/png'
            imageUrl = `data:${mimeType};base64,${base64Image}`
            console.log(`🖼️ [IMAGE_GENERATED] Base64 image data received (${base64Image.length} characters)`)
            break
          }
        }
      }

      if (!imageUrl) {
        console.log('⚠️ [NO_IMAGE] No image data found, using placeholder')
        const encodedPrompt = encodeURIComponent(enhancedConcept.slice(0, 100))
        imageUrl = `https://via.placeholder.com/1024x1024/FF6B6B/FFFFFF?text=${encodedPrompt}`
      }

      // Generate final description
      console.log('📝 [DESCRIPTION] Generating final description...')
      const descriptionResponse = await ai.models.generateContent({
        model: process.env.GEMINI_TEXT_GENERATION_MODEL || 'gemini-2.0-flash',
        contents: createFinalDescriptionPrompt(prompt, enhancedConcept)
      })

      const finalDescription = descriptionResponse.candidates?.[0]?.content?.parts?.[0]?.text || 'Something hilariously funny happened! 😂'
      console.log(`😂 [DESCRIPTION_COMPLETE] "${finalDescription}"`)

      console.log('✅ [SUCCESS] 3-step pipeline completed successfully')
      return NextResponse.json({
        imageUrl,
        description: finalDescription,
        prompt,
        generatedBy: '3-Step Pipeline (Generic → Trending → Image)',
        steps: {
          genericConcept,
          enhancedConcept,
          usedTrending: !!trendingData,
          trendingTopic: trendingData?.topic || null
        }
      })

    } catch (error) {
      console.error('❌ [PIPELINE_ERROR]', error)
      return NextResponse.json(
        { error: 'Failed to generate image with 3-step pipeline. Please try again!' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ [GENERAL_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
} 