# Financial Planning Assistance

AI-powered financial advisor assistant platform with integrated back office operations, financial planning, CRM, marketing, and communications.

## Features

- **Back Office Operations** - Calendar management, meeting scheduling, document management, compliance auditing
- **Financial Planning** - Portfolio management, financial plan creation, goal tracking, Monte Carlo simulations
- **CRM** - Client profiles, interaction tracking, relationship management, segmentation
- **Marketing** - Campaign management, automation workflows, performance analytics
- **Communications** - Event scheduling, reminders, multi-channel notifications, annual calendar planning
- **AI/Automation** - Intelligent recommendations, automated plan generation, meeting summarization, predictive analytics

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS, Recharts
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Caching**: Redis
- **Jobs**: Bull/BullMQ
- **AI**: OpenAI/Claude APIs

## Project Structure

```
├── packages/
│   ├── backend/          # Express API server
│   ├── frontend/         # Next.js web application
│   └── shared/           # Shared types and utilities
├── docs/                 # Documentation
├── docker-compose.yml    # Local development environment
└── README.md
```

## Setup & Development

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or pnpm

### Installation

1. Clone the repository and navigate to the project directory:
```bash
cd financial-planning-assistance
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration (especially Supabase credentials and JWT secret)

4. Start local development environment:
```bash
docker-compose up -d
```

5. Install dependencies:
```bash
npm install
# or
pnpm install
```

6. Initialize the database (if not auto-initialized by Docker):
```bash
# Using Supabase CLI or direct connection
psql -U postgres -d financial_planning -f packages/backend/src/db/schema.sql
```

### Running the Application

**Development Mode:**

In separate terminals:

```bash
# Backend (from root)
npm run dev --workspace=@financial-planning/backend

# Frontend (from root)
npm run dev --workspace=@financial-planning/frontend
```

Or from package directories:

```bash
# Backend
cd packages/backend
npm run dev

# Frontend
cd packages/frontend
npm run dev
```

**Access the Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database Manager (Adminer): http://localhost:8080

### API Endpoints (Phase 1)

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh authentication token

#### Health
- `GET /health` - Health check
- `GET /api/health` - API health check with environment

### Database

The database schema includes:
- Users & Organizations (multi-tenancy)
- Clients & Contacts
- Portfolios & Asset Allocations
- Financial Plans & Goals
- Meetings & Events
- Interactions & Activities
- Campaigns & Segments
- Documents & Tasks
- Audit Logs

See `packages/backend/src/db/schema.sql` for complete schema.

## Implementation Phases

### Phase 1: Foundation (Current) ✅
- Project structure & build pipeline
- Database schema & authentication
- Basic API skeleton
- Admin user management

### Phase 2: CRM Foundation (Next)
- Client management
- Interaction tracking
- Segmentation
- CRM dashboard

### Phase 3: Back Office Operations
- Calendar management with sync
- Meeting scheduling
- Administrative tasks
- Document management

### Phase 4: Financial Planning
- Portfolio management
- Plan creation & tracking
- Simulations & reporting

### Phase 5: Communications
- Event management
- Reminders & notifications
- Annual calendar planning

### Phase 6: Marketing
- Campaign management
- Automation workflows
- Analytics

### Phase 7: AI/Automation
- Intelligent recommendations
- Automated plan generation
- Predictive analytics

### Phase 8: Optimization & Polish
- Performance tuning
- Security hardening
- Advanced features

## Development Guidelines

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Follow existing patterns

### Git Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit with clear messages
3. Push to branch and create pull request

### Testing
```bash
npm test --workspaces
```

### Building
```bash
npm run build --workspaces
```

## Environment Variables

Key environment variables (see `.env.example` for full list):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase API key
- `JWT_SECRET` - Secret key for JWT tokens
- `REDIS_URL` - Redis connection URL
- `CORS_ORIGIN` - Frontend URL for CORS

## Documentation

- [Architecture Overview](docs/architecture.md) - System design and components
- [Database Schema](docs/database-schema.md) - Data models and relationships
- [API Specification](docs/api-spec.md) - Endpoint documentation
- [Deployment Guide](docs/deployment.md) - Production deployment steps

## Contributing

1. Follow the code style guidelines
2. Write clear commit messages
3. Update documentation as needed
4. Test your changes before submitting PR

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review similar implementations in codebase

## License

Proprietary - Financial Advisor Assistant Platform
