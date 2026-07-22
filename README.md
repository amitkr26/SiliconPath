# BerojgarDegreeWala

**The Ultimate Ecosystem for Semiconductor & Hardware Engineering Professionals**

BerojgarDegreeWala is a comprehensive, all-in-one platform for the hardware engineering industry. It combines an opportunity aggregator, a dedicated professional network, an integrated VLSI Academy, and advanced career tools like a resume builder. It serves as a unified hub for learning, connecting, and advancing your career in semiconductor technology.

## Features

- **Opportunity Aggregator**: Find verified opportunities in VLSI, ASIC design, semiconductor fabrication, embedded systems, RF, and JRF/PhD programs.
- **VLSI Academy**: Master hardware design with structured courses in Digital Design, Analog Design, Verification, and Physical Design.
- **Hardware Network**: A LinkedIn-style professional networking platform exclusively for hardware engineers, complete with a community feed and direct messaging.
- **Career Tools**: Features an AI-powered resume builder, application tracking dashboard, and personalized recommendations.
- **AI Integration**: Ask AI assistant for technical queries and intelligent matching of opportunities based on your profile.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons.
- **Backend & Database**: Supabase (PostgreSQL), Next.js API Routes.
- **Typography**: Inter (Body), Space Grotesk (Display) using CSS variables.
- **Deployment**: Vercel.

## Local Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd berojgardegreewala/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the `frontend` directory based on `.env.example` (if provided). You will need Supabase credentials for the database backend.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Navigate to `http://localhost:3000`.

## Architecture Scope

As the core "living" platform, BerojgarDegreeWala integrates the full suite of features spanning aggregation, networking, and education. It demonstrates a robust, full-stack architecture capable of handling diverse data types, complex user interactions, and sophisticated feature sets within a single, premium application.
