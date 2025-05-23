# 🎨 Funny Image Generator

A hilarious AI-powered image generator with a ChatGPT-like interface, built with Next.js 14 and Gemini AI.

## ✨ Features

- 🤖 **ChatGPT-style Interface**: Clean, intuitive chat UI
- 🎨 **AI-Powered Descriptions**: Uses Gemini AI to generate funny descriptions
- 📱 **Responsive Design**: Beautiful on all devices  
- ⚡ **Fast & Modern**: Built with Next.js 14 and TypeScript
- 🎭 **Family-Friendly**: All content is appropriate for all ages
- 🖼️ **Placeholder Images**: Demo images while you set up real image generation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Gemini API key (optional, works without it too!)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd funny-image-generator
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   # Get your API key from: https://makersuite.google.com/app/apikey
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # App configuration
   NEXT_PUBLIC_APP_NAME=Funny Image Generator
   ```

4. **Start the development server**:
   ```bash
   pnpm dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:3000`

## 🛠️ Project Structure

```
funny-image-generator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── generate-image/
│   │   │       └── route.ts          # API endpoint for image generation
│   │   ├── globals.css               # Global styles with Tailwind
│   │   ├── layout.tsx                # Root layout component
│   │   └── page.tsx                  # Main chat interface
├── .cursorrules                      # Cursor IDE rules (enforces pnpm)
├── next.config.js                    # Next.js configuration
├── package.json                      # Dependencies and scripts
├── tailwind.config.js                # Tailwind CSS configuration
└── tsconfig.json                     # TypeScript configuration
```

## 🔧 Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Icons**: Lucide React
- **Package Manager**: pnpm

## 🎯 Usage

1. **Start a conversation**: The bot will greet you
2. **Describe an image**: Type something like "a cat wearing a superhero costume"
3. **Get AI response**: The bot generates a funny description and shows a placeholder image
4. **Have fun**: Try different prompts and enjoy the hilarious descriptions!

## 🔑 Getting Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env.local` file

## 🎨 Customization

### Adding Real Image Generation

Currently, this app uses placeholder images. To add real image generation:

1. **DALL-E API** (OpenAI):
   ```typescript
   // In src/app/api/generate-image/route.ts
   const response = await openai.images.generate({
     prompt: funnyPrompt,
     n: 1,
     size: "512x512",
   });
   ```

2. **Stable Diffusion** (Replicate):
   ```typescript
   const output = await replicate.run(
     "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478",
     { input: { prompt: funnyPrompt } }
   );
   ```

### Styling Changes

- Modify `src/app/globals.css` for global styles
- Update `tailwind.config.js` for custom themes
- Edit component styles in `src/app/page.tsx`

## 📝 Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for beautiful icons

---

Made with ❤️ and lots of laughs! 😄 