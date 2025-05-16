#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable pgvector extension
    CREATE EXTENSION IF NOT EXISTS vector;
    
    -- Create users table
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create projects table
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        jira_id TEXT,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create documents table with vector support
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id),
        name TEXT NOT NULL,
        content TEXT,
        embedding VECTOR(1536),
        metadata JSONB,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create stories table
    CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id),
        title TEXT NOT NULL,
        description TEXT,
        acceptance_criteria TEXT[],
        status TEXT CHECK (status IN ('draft', 'in_review', 'approved', 'in_progress', 'done')),
        priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        jira_id TEXT,
        story_points INTEGER,
        business_value TEXT,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create test_cases table
    CREATE TABLE IF NOT EXISTS test_cases (
        id TEXT PRIMARY KEY,
        story_id TEXT REFERENCES stories(id),
        title TEXT NOT NULL,
        description TEXT,
        steps JSONB[],
        expected_result TEXT,
        status TEXT CHECK (status IN ('draft', 'in_review', 'approved', 'in_progress', 'done')),
        priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        jira_id TEXT,
        preconditions TEXT,
        postconditions TEXT,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
EOSQL
