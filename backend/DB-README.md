# PostgreSQL with pgvector Setup

This directory contains the configuration for running PostgreSQL with pgvector extension using Podman.

## Prerequisites

- Podman installed on your system
- Git (for cloning the pgvector repository)

## Setup Instructions

1. **Build the custom PostgreSQL image with pgvector**:
   ```bash
   podman build -t sdlc-postgres -f Dockerfile.postgres .
   ```

2. **Start the database container**:
   ```bash
   podman-compose -f docker-compose.db.yml up -d
   ```
   
   Or without podman-compose:
   ```bash
   podman run --name sdlc-postgres \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=sdlc_copilot \
     -p 5432:5432 \
     -v ./docker-entrypoint-initdb.d:/docker-entrypoint-initdb.d \
     -d sdlc-postgres
   ```

3. **Verify the installation**:
   ```bash
   podman exec -it sdlc-postgres psql -U postgres -d sdlc_copilot -c "\dx"
   ```
   You should see `pgvector` in the list of installed extensions.

4. **Connect to the database**:
   ```bash
   podman exec -it sdlc-postgres psql -U postgres -d sdlc_copilot
   ```

## Environment Variables

Update your `.env` file with the following database connection string:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sdlc_copilot
```

## Database Schema

The initialization script will create the following tables:

1. `users` - User accounts
2. `projects` - Project information
3. `documents` - Documents with vector embeddings
4. `stories` - User stories
5. `test_cases` - Test cases for stories

## Stopping the Database

To stop the database container:

```bash
podman stop sdlc-postgres
```

To remove the container (data will be preserved in the volume):

```bash
podman rm sdlc-postgres
```

## Data Persistence

Data is persisted in a named volume called `postgres_data`. To completely remove the database data:

```bash
podman volume rm sdlc_copilot_postgres_data
```
