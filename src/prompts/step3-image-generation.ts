export const createImageGenerationPrompt = (enhancedConcept: string): string => {
  return `${enhancedConcept}, cartoon style, funny, comedic, family-friendly, high quality, detailed, vibrant colors`
}

export const createFinalDescriptionPrompt = (
  userPrompt: string,
  enhancedConcept: string
): string => {
  return `Create a punchy, shareable description for this funny image:

CONCEPT: "${enhancedConcept}"

EXAMPLES OF GREAT DESCRIPTIONS:
- "When you're trying to adult but have no idea what you're doing 😅🤷‍♀️"
- "This is me every Monday morning ☕😴"
- "POV: You thought you had your life together 💀"

PRINCIPLES:
✅ Relatable "this is me" moments
✅ Perfect emoji usage (2-3 max)
✅ Makes people think "OMG same"

Focus on the MAIN funny feeling this image captures:

Description:`
} 