# Promteplat - Prompt Platform

A Next.js-based platform for creating, browsing, and managing AI prompts , AI HumanizeText and RephrasePrompt.

## Project Structure

```
promteplat/
│
├── app/                            # Next.js App Router directory (page & layout files)
│   ├── ai/                         # AI UI flows (humanizer, rephraser, etc.)
│   │   ├── humanizer/
│   │   │   └── page.jsx            # Humanizer UI
│   │   └── rephraser/
│   │       └── page.jsx            # Rephraser UI
│   │
│   ├── api/                        # Route handlers (serverless functions)
│   │   ├── ai/                     # AI-related API endpoints
│   │   │   ├── humanizer/
│   │   │   │   └── route.js        # Humanize text endpoint
│   │   │   ├── rephraser/
│   │   │   │   └── route.js        # Prompt rephrasing endpoint
│   │   │   └── tokens/
│   │   │       ├── balance.js      # Fetch token balance
│   │   │       └── deduct.js       # Deduct tokens for AI usage
│   │   ├── auth/                   # Authentication routes (placeholder)
│   │   ├── categories/
│   │   │   └── route.js            # List categories
│   │   ├── prompts/                # Prompt CRUD and listings
│   │   │   ├── [id]/
│   │   │   │   ├── like/
│   │   │   │   │   └── route.js    # Toggle like/unlike
│   │   │   │   └── route.js        # Prompt detail/update/delete
│   │   │   ├── liked/
│   │   │   │   └── route.js        # Liked prompts for current user
│   │   │   ├── mine/
│   │   │   │   └── route.js        # Prompts created by current user
│   │   │   ├── new/
│   │   │   │   └── route.js        # Create prompt
│   │   │   ├── privateprompt/
│   │   │   │   └── route.js        # Private prompts listing
│   │   │   ├── publicprompt/
│   │   │   │   └── route.js        # Public prompts listing
│   │   │   └── route.js            # Prompts index
│   │   ├── subscription/           # Subscription API endpoints
│   │   │   ├── create-order/
│   │   │   │   └── route.js        # Create order
│   │   │   ├── create-subscription/
│   │   │   │   └── route.js        # Create subscription
│   │   │   ├── plans/
│   │   │   │   └── route.js        # Get subscription plans
│   │   │   ├── verify-payment/
│   │   │   │   └── route.js        # Verify payment
│   │   │   └── webhook/
│   │   │       └── route.js        # Payment webhook handler
│   │   ├── upload/
│   │   │   └── route.js            # Media upload (Cloudinary)
│   │   └── user/                   # User account endpoints
│   │       ├── login/
│   │       │   └── route.js
│   │       ├── logout/
│   │       │   └── route.js
│   │       ├── me/
│   │       │   └── route.js
│   │       ├── send_register_otp/
│   │       │   └── route.js
│   │       ├── update-profile/
│   │       │   └── route.js
│   │       └── verify_register_otp/
│   │           └── route.js
│   │
│   ├── application/                # Application layer (use cases, adapters)
│   │   ├── adapters/
│   │   │   ├── openaiAdapter.js
│   │   │   └── razorpayClient.js
│   │   └── usecases/
│   │       ├── HumanizeText.js
│   │       ├── ManageSubscription.js
│   │       └── RephrasePrompt.js
│   │
│   ├── create-prompt/              # Create prompt flow
│   │   ├── page.jsx
│   │   └── submitprompt/
│   │       └── page.jsx
│   │
│   ├── dashboard/
│   │   └── page.jsx                # Admin/user dashboard shell
│   │
│   ├── domain/                     # Domain entities/services
│   │   ├── entities/
│   │   │   ├── Subscription.js
│   │   │   ├── TokenBalance.js
│   │   │   └── Transaction.js
│   │   └── services/
│   │       ├── subscriptionService.js
│   │       ├── tokenService.js
│   │       └── transactionService.js
│   │
│   ├── infrastructure/             # Infrastructure adapters
│   │   ├── openai/
│   │   │   └── gptClient.js
│   │   ├── payments/
│   │   │   └── razorpay.js
│   │   └── persistence/
│   │       ├── subscriptionRepo.js
│   │       ├── tokenRepo.js
│   │       └── transactionRepo.js
│   │
│   ├── legal/
│   │   └── page.jsx                # Legal/terms content
│   │
│   ├── loading.jsx                 # Global loading UI
│   ├── myprompt/                   # User prompt management views
│   │   ├── likeprompt/
│   │   │   └── page.jsx
│   │   ├── page.jsx
│   │   ├── privateprompt/
│   │   │   └── page.jsx
│   │   └── publicprompt/
│   │       └── page.jsx
│   │
│   ├── page.jsx                    # Home page
│   ├── public-prompts/
│   │   └── page.jsx                # Browse public prompts
│   ├── subscription/
│   │   └── page.jsx                # Subscription management UI
│   │
│   ├── user/                       # User-facing pages
│   │   ├── login/
│   │   │   └── page.jsx
│   │   ├── profile/
│   │   │   └── page.jsx
│   │   └── register/
│   │       └── page.jsx
│   │
│   └── layout.jsx                  # Root layout component
│
├── components/                     # React components
│   ├── ai/                         # Components for AI workflows
│   │   ├── AIActionButton.jsx
│   │   ├── DualView.jsx
│   │   ├── LivePreview.jsx
│   │   └── TokenUsage.jsx
│   │
│   ├── shared/                     # Shared/common components
│   │   ├── Footer.jsx
│   │   ├── Navbar.jsx
│   │   └── Provider.jsx
│   │
│   ├── subscription/               # Subscription UI widgets
│   │   ├── PlanCard.jsx
│   │   ├── RazorpayButton.jsx
│   │   └── TokenHistoryTable.jsx
│   │
│   ├── ui/                         # Marketing UI components
│   │   ├── Features.jsx
│   │   ├── Herosection.jsx
│   │   └── Trendingprompts.jsx
│   │
│   ├── DataState.jsx               # Loading/empty/error UI helper
│   ├── LikeButton.jsx              # Like/unlike button
│   ├── PromptDetailModal.jsx       # Prompt detail modal (normalized filename)
│   ├── PromptGrid.jsx              # Prompt grid layout
│   ├── ShareMenu.jsx               # Share menu component
│   ├── Toolbar.jsx                 # Toolbar actions
│   └── PromptCard.jsx              # Prompt cards (normalized filename)
│
├── hooks/                          # Custom React hooks
│   ├── useAuth.js
│   └── useDebounce.js
│
├── utils/                          # Small utilities used across the app
│   ├── formatDate.js
│   └── validators.js
│
├── data/                           # Static data files
│   └── categories.json             # Categories data
│
├── lib/                            # Utility libraries and helpers
│   ├── auth.js
│   ├── authHelper.js
│   ├── cloudinary.js
│   ├── dbconnect.js
│   ├── openaiClient.js             # OpenAI client wrapper
│   ├── promptApi.js
│   ├── razorpayClient.js           # Razorpay server client
│   ├── sendotp.js
│   └── tokenHelper.js              # Token balance helper utilities
│
├── models/                         # Mongoose data models
│   ├── bookmark.js                 # Bookmark model
│   ├── collection.js               # Collection model
│   ├── like.js                     # Like model (user-prompt relationship)
│   ├── otp.js                      # OTP model for email verification
│   ├── prompt.js                   # Prompt model (title, content, media, visibility, likes)
│   ├── subscription.js             # Subscription records
│   ├── tokenBalance.js             # Token balance documents
│   ├── transaction.js              # Token transactions
│   └── user.js                     # User model
│
├── public/                         # Static assets
│   └── promptlogo.png              # Application logo
│
├── styles/                         # Global styles
│   └── globals.css                 # Global CSS styles
│
├── config/                         # Configuration files and env templates
│   └── example.env
│
├── scripts/                        # Local scripts (db seed, migrations, etc.)
│   └── seed.js
│
├── tests/                          # Test suites (unit/integration)
│   └── components/
│
├── .gitignore                      # Git ignore rules
├── eslint.config.mjs               # ESLint configuration
├── jsconfig.json                   # JavaScript/TypeScript configuration
├── next.config.mjs                 # Next.js configuration
├── package.json                    # Project dependencies and scripts
├── package-lock.json               # Dependency lock file
├── postcss.config.mjs              # PostCSS configuration
└── README.md                       # Project documentation
```

## Technology Stack

- **Framework**: Next.js 15.5.2 (App Router)
- **Runtime**: React 19.1.0
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js, JWT, bcryptjs
- **File Upload**: Cloudinary, Multer, Formidable
- **Email**: Nodemailer
- **AI Integration**: OpenAI API (GPT models)
- **Payment Processing**: Razorpay
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React, React Icons

## Key Features

- **User Authentication**
  - Login/Logout with JWT tokens
  - Registration with OTP email verification
  - User profile management

- **Prompt Management**
  - Create prompts with title, category, content, and media
  - Public/Private visibility control
  - Edit and delete prompts (with soft delete support)
  - Media uploads (images/videos) via Cloudinary
  - Category-based organization

- **Prompt Discovery**
  - Browse public prompts with search and filtering
  - Sort by recent or most liked
  - Category filtering
  - Pagination support

- **Like System**
  - Toggle like/unlike functionality
  - One like per user per prompt (enforced)
  - Real-time like count updates
  - Visual feedback for liked prompts

- **User Features**
  - View own prompts (all/public/private)
  - View liked prompts
  - Bookmarking system
  - Collections support
  - Share prompts via ShareMenu

- **Media Handling**
  - Cloudinary integration for image/video uploads
  - Multiple media files per prompt
  - Automatic media cleanup on prompt deletion

- **AI Tools**
  - Text humanizer to make AI-generated content more natural
  - Prompt rephraser to improve and optimize prompts
  - Real-time preview of AI-generated content
  - Token-based usage tracking and management

- **Subscription & Payments**
  - Multiple subscription plans
  - Razorpay payment integration
  - Token balance management
  - Transaction history tracking
  - Payment webhook handling
  - Subscription management dashboard

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (create `.env.local`):
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # Authentication
   JWT_SECRET=your_jwt_secret_key
   
   # Cloudinary (for media uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Email (for OTP)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # OpenAI (for AI tools)
   OPENAI_API_KEY=your_openai_api_key
   
   # Razorpay (for payments)
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   npm start
   ```
