# SDLC Copilot Backend

This is the backend service for the SDLC Copilot application, providing APIs and database access for managing projects, user stories, test cases, and document storage.

## Database Schema

The database consists of the following tables:

1. `users` - Stores user account information
2. `projects` - Manages projects created by users
3. `documents` - Stores project documents with vector embeddings for semantic search
4. `stories` - Manages user stories within projects
5. `test_cases` - Manages test cases linked to user stories

## Repository Structure

The database access is organized into repositories, each responsible for a specific domain:

- `BaseRepository` - Abstract base class with common CRUD operations
- `UserRepository` - Manages user accounts and authentication
- `ProjectRepository` - Handles project management
- `DocumentRepository` - Manages document storage and vector search
- `StoryRepository` - Manages user stories and their status
- `TestCaseRepository` - Handles test cases and their relationships

The `DatabaseService` provides a unified interface to all repositories.

## Setup

1. Ensure you have Node.js and npm installed
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Running Migrations

To apply the database schema:

1. Install the Supabase CLI: https://supabase.com/docs/guides/cli
2. Log in to your Supabase account:
   ```bash
   npx supabase login
   ```
3. Link your project:
   ```bash
   npx supabase link --project-ref your-project-ref
   ```
4. Apply migrations:
   ```bash
   npx supabase db push
   ```

## Development

- The database schema is defined in `supabase/migrations/`
- Repository interfaces are in `src/repositories/`
- Database service is in `src/services/database.service.ts`

## Testing

Run tests with:

```bash
npm test
```

## Deployment

Deploy your Supabase project and update the environment variables with your production credentials.
