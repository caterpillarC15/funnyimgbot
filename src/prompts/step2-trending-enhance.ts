export const createTrendingEnhancePrompt = (
  genericConcept: string, 
  trendingTopic: string, 
  trendingDescription: string
): string => {
  return `Enhance this funny concept with subtle cultural timing inspired by current trends:

FUNNY CONCEPT: "${genericConcept}"
CURRENT VIBE: ${trendingTopic} - ${trendingDescription}

ENHANCEMENT TECHNIQUES:
- Adjust facial expressions to match current cultural mood
- Add contemporary context through body language
- Update visual contrasts to feel more "now"  
- Enhance timing through modern situational awareness
- Scale elements to reflect current cultural tensions
- Use juxtaposition to capture today's cultural moment

ENHANCEMENT MECHANICS:
✅ Keep the original visual punchline intact
✅ Add subtle contemporary emotional layers
✅ Make expressions feel culturally current
✅ Update context without changing the core joke

❌ Don't add literal trend references or text
❌ Don't change the fundamental comedy concept

Enhanced concept (same joke, more culturally resonant timing):`
} 