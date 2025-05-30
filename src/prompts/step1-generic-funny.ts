export const createGenericFunnyPrompt = (userPrompt: string): string => {
    return `Transform this into a hilarious, relatable image concept: "${userPrompt}".
  
  STEP 1: Find the core human experience
  - What specific moment/situation does this describe?
  - When do people actually experience this feeling?
  - What's the social/emotional dynamic?
  
  STEP 2: Visualize the perfect comedic moment
  - Show someone LIVING this experience 
  - Add ONE perfect exaggerated detail (facial expression, body language, contrast)
  - Focus on human reactions and emotions
  
  EXAMPLES OF GOOD TRANSFORMATION:
  ❌ "Math is a superpower" → literal superhero with calculator
  ✅ "Math is a superpower" → person confidently calculating tip while friends panic with phone calculators
  
  ❌ "Monday morning" → generic tired face
  ✅ "Monday morning" → person trying to put cereal in coffee maker
  
  COMEDY RULES:
  - Show the MOMENT, not the concept
  - One perfect detail beats chaos
  - Focus on expressions and body language
  - Make it instantly relatable
  - Ask: "Would I tag a friend in this?"
  
  Transform "${userPrompt}" into one specific, relatable moment with perfect comedic timing:`
  }