# Khaya - Local Workers & Materials Marketplace

A professional marketplace platform connecting buyers in small towns with verified local workers and construction material suppliers.

## Overview

Khaya makes it easy and safe for homeowners to find trusted workers, quality materials, and reliable suppliers all in one place. The platform focuses on small town communities, providing a trusted environment for construction and home improvement projects.

## Features

### For Buyers
- **Post Jobs** - Describe your project and receive competitive bids from verified workers
- **Browse Workers** - Search for skilled professionals by location and trade
- **Find Materials** - Browse quality building materials from local suppliers
- **Review & Rate** - Leave reviews and see ratings to make informed decisions
- **Track Progress** - Monitor job milestones and communicate directly with workers

### For Workers
- **Create Profile** - Showcase your skills, certifications, and past work
- **Bid on Jobs** - Submit competitive quotes for projects in your area
- **Build Trust** - Earn trust scores through positive reviews
- **Get Verified** - Display verification badges to stand out

### For Suppliers
- **List Materials** - Add your products with pricing and stock information
- **Manage Inventory** - Track stock levels and update availability
- **Reach Customers** - Connect with buyers in your local area

## Tech Stack

### Frontend
- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling with custom design system
- **tRPC** - End-to-end type-safe APIs
- **Wouter** - Lightweight routing
- **shadcn/ui** - Beautiful, accessible components

### Backend
- **Node.js/Express** - Server runtime
- **tRPC** - Type-safe API layer
- **Drizzle ORM** - Type-safe database queries
- **MySQL/TiDB** - Relational database
- **Manus OAuth** - Authentication system

### Infrastructure
- **Manus Platform** - Hosting and deployment
- **S3** - File storage for images and documents
- **GitHub** - Version control and collaboration

## Database Schema

The platform uses a comprehensive relational database with the following main tables:

- **users** - User accounts with role-based access (buyer, worker, supplier, admin)
- **profiles** - Extended user information including bio, trade, location, trust scores
- **jobs** - Job postings with budget, location, and status tracking
- **bids** - Worker proposals on jobs with pricing and timeline
- **listings** - Material/supply listings from suppliers
- **reviews** - Ratings and feedback for users
- **milestones** - Job progress tracking with proof of work
- **messages** - Direct communication between users
- **notifications** - System notifications for bids, jobs, and updates

## Design Philosophy

### Trusted & Professional
- Warm terracotta/orange primary color for trust and local feel
- Deep teal secondary color for professionalism
- Warm gold accents for highlights
- Clean, modern typography (Inter + Poppins)

### Mobile-First & Responsive
- Optimized for mobile devices common in small towns
- Progressive enhancement for larger screens
- Touch-friendly interface elements

### User-Centric
- Clear navigation and information hierarchy
- Intuitive search and filtering
- Real-time updates and notifications
- Empty states and helpful error messages

## Getting Started

### Prerequisites
- Node.js 22.x or higher
- pnpm package manager
- MySQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lante007/Khaya.git
cd Khaya
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
# Database connection
DATABASE_URL=mysql://user:password@host:port/database

# Authentication (provided by Manus platform)
JWT_SECRET=your-secret
OAUTH_SERVER_URL=oauth-server-url
VITE_OAUTH_PORTAL_URL=oauth-portal-url

# Other environment variables are automatically injected by Manus
```

4. Run database migrations:
```bash
pnpm db:push
```

5. Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
khaya/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Utilities and tRPC client
│   │   └── index.css      # Global styles and theme
│   └── public/            # Static assets
├── server/                # Backend Express server
│   ├── routers.ts         # tRPC API endpoints
│   ├── db.ts              # Database query functions
│   └── _core/             # Framework core (OAuth, context, etc.)
├── drizzle/               # Database schema and migrations
│   └── schema.ts          # Table definitions
├── shared/                # Shared types and constants
└── storage/               # S3 file storage helpers
```

## API Endpoints

The application uses tRPC for type-safe API communication. Main routers include:

- **auth** - Authentication and session management
- **profile** - User profile CRUD operations
- **job** - Job posting and management
- **bid** - Bidding system
- **listing** - Material listings
- **review** - Rating and review system
- **milestone** - Job progress tracking
- **message** - User messaging
- **notification** - Notification system

## Deployment

### Option 1: Manus Platform (Current)

The application is deployed on the Manus platform with automatic CI/CD:

1. Push code to GitHub
2. Create a checkpoint in Manus dashboard
3. Click "Publish" to deploy

The platform handles:
- SSL certificates
- Database provisioning
- File storage
- OAuth configuration
- Environment variables

### Option 2: AWS Serverless (Production Ready)

Fully serverless architecture for autonomous scaling:

**Quick Deploy:**
```bash
./deploy-aws.sh
```

**Architecture:**
- Frontend: S3 + CloudFront CDN
- Backend: Lambda + API Gateway
- Database: DynamoDB
- Auth: Cognito
- Region: af-south-1 (Johannesburg)

**Cost Estimates:**
- Free Tier: R0/month (first 12 months)
- Production (1,000 users): R250-500/month
- Scale (10,000 users): R800-1,200/month

**Full Documentation:** See [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md)

## Contributing

This is a private project for Auxeira. For questions or issues, please contact the development team.

## License

Proprietary - All rights reserved

## Contact

- **Organization**: Auxeira
- **Website**: https://startupsuccessenabler.com/
- **GitHub**: https://github.com/lante007

---

Built with ❤️ for small town communities
