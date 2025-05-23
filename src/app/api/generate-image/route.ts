import { GoogleGenAI, Modality } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🎨 [IMAGE_GEN] Starting Gemini 2.0 Flash image generation...')
  
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
    
    console.log(`🔑 [API_KEY] Using NEW @google/genai SDK for image generation`)
    console.log(`🤖 [GEMINI_STATUS] Using Gemini 2.0 Flash Exp Image Generation!`)

    // Initialize the NEW SDK
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    let funnyDescription = ''
    let imageUrl = ''

    try {
      // Step 1: Enhance the prompt for funnier image generation
      console.log('🧠 [GEMINI_TEXT] Enhancing prompt with Gemini 2.0 Flash...')
      
      const enhancePrompt = `Transform this into a hilarious, detailed image prompt for AI image generation: "${prompt}". 
      Make it extremely funny, cartoonish, and whimsical. Add specific visual details like:
      - Absurd expressions and poses
      - Funny clothing or accessories  
      - Ridiculous backgrounds or settings
      - Exaggerated features
      - Comic/cartoon style
      Keep it family-friendly but absolutely hilarious. Return ONLY the enhanced image prompt, no other text.`

      // Use text-only model for prompt enhancement
      const textResponse = await ai.models.generateContent({
        model: process.env.GEMINI_TEXT_GENERATION_MODEL || 'gemini-2.0-flash',
        contents: enhancePrompt
      })

      const enhancedPrompt = textResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || prompt
      console.log(`✨ [ENHANCED_PROMPT] "${enhancedPrompt}"`)

      // Step 2: Generate image using NEW SDK syntax
      console.log('🎨 [GEMINI_IMAGE] Generating image with NEW @google/genai SDK...')
      
      const finalPrompt = enhancedPrompt + ", cartoon style, funny, comedic, family-friendly, high quality, detailed, vibrant colors"
      console.log(`🎯 [FINAL_PROMPT] "${finalPrompt}"`)

      // Using the NEW SDK syntax from debug.md
      const imageResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp-image-generation",
        contents: finalPrompt,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      })

      console.log(`📡 [GEMINI_IMAGE_RESPONSE] Success!`)

      // Handle the response
      const candidates = imageResponse.candidates || []
      console.log(`📊 [CANDIDATES_COUNT] Found ${candidates.length} candidates`)
      
      if (candidates.length > 0) {
        const parts = candidates[0].content?.parts || []
        console.log(`🧩 [PARTS_COUNT] Found ${parts.length} parts`)
        
        for (const part of parts) {
          if (part.inlineData?.data) {
            // Found image data!
            const base64Image = part.inlineData.data
            const mimeType = part.inlineData.mimeType || 'image/png'
            imageUrl = `data:${mimeType};base64,${base64Image}`
            console.log(`🖼️ [IMAGE_GENERATED] Base64 image data received (${base64Image.length} characters)`)
            break
          } else if (part.text) {
            console.log(`📝 [TEXT_PART] "${part.text.slice(0, 100)}..."`)
          }
        }
      }

      if (!imageUrl) {
        // If no image was generated, log the full response for debugging
        console.log('⚠️ [NO_IMAGE] No image data found in response')
        console.log('📊 [FULL_RESPONSE]', JSON.stringify(imageResponse, null, 2))
        
        // Create a colorful placeholder
        const encodedPrompt = encodeURIComponent(enhancedPrompt.slice(0, 100))
        imageUrl = `https://via.placeholder.com/1024x1024/FF6B6B/FFFFFF?text=${encodedPrompt}`
        console.log('🖼️ [PLACEHOLDER] Using placeholder while debugging')
      }

      // Step 3: Generate funny description
      console.log('📝 [GEMINI_DESC] Generating funny description...')
      const descriptionPrompt = `Create a hilarious and witty description for this funny image based on: "${prompt}". 
      The image shows: ${enhancedPrompt}
      Make it extremely entertaining, use emojis, and describe what makes it so funny. 
      Keep it family-friendly but absolutely hilarious. Maximum 2-3 sentences.`
      
      const descResponse = await ai.models.generateContent({
        model: process.env.GEMINI_TEXT_GENERATION_MODEL || 'gemini-2.0-flash',
        contents: descriptionPrompt
      })

      funnyDescription = descResponse.candidates?.[0]?.content?.parts?.[0]?.text || 'Something hilariously funny happened! 😂'
      console.log(`😂 [DESCRIPTION] "${funnyDescription}"`)

    } catch (error) {
      console.error('❌ [GEMINI_ERROR]', error)
      return NextResponse.json(
        { error: 'Failed to generate image with Gemini. Please try again!' },
        { status: 500 }
      )
    }

    console.log('✅ [SUCCESS] Gemini 2.0 Flash generation completed successfully')
    return NextResponse.json({
      imageUrl,
      description: funnyDescription,
      prompt,
      generatedBy: 'Gemini 2.0 Flash Exp (NEW SDK)'
    })

  } catch (error) {
    console.error('❌ [GENERAL_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
} 