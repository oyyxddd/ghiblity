# 🎨 Ghiblity

> Transform your photos into magical Studio Ghibli-style artwork with AI

![Ghiblity Logo](./public/images/ghiblity-logo.png)

## ✨ Features

- 🪄 **AI-Powered Magic**: Transform any photo into Studio Ghibli-style art using OpenAI's vision models
- ⚡ **Instant Generation**: Get your artwork in 30-60 seconds
- 💳 **Simple Payment**: One-time $0.99 payment via Stripe
- 📱 **Responsive Design**: Works perfectly on all devices
- 🔒 **Privacy First**: Your photos are processed securely and never stored

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/oyyxddd/ghiblity.git
cd ghiblity
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Add your OpenAI API key to `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

4. **Run the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4 Vision API
- **Payment**: Stripe
- **Deployment**: Vercel

## 📁 Project Structure

```
ghiblity/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # Reusable components
├── public/               # Static assets
│   └── images/           # Logo and example images
├── lib/                  # Utility functions (cleaned)
└── README.md
```

## 🌟 How It Works

1. **Upload**: Drag & drop, click, or paste your photo
2. **Pay**: Secure $0.99 payment via Stripe 
3. **Generate**: AI transforms your photo into Ghibli-style art
4. **Download**: Get your high-quality artwork as `Ghiblity_MMDDHHNN.png`

## 📝 License

MIT License - feel free to use this project for your own purposes!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, reach out to: oyyxdd@gmail.com

---

Made with ❤️ and a touch of Studio Ghibli magic
