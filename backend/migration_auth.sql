-- SQL Migration for Roaming Identity
-- Run this in your Supabase SQL Editor

-- 1. Add fields to 'users' table
ALTER TABLE users 
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN password_hash TEXT, -- Stored by backend (optional if we only trust key)
ADD COLUMN public_key TEXT,    -- The Identity
ADD COLUMN encrypted_priv_key JSONB; -- { salt, iv, cipherText }

-- 2. Index for fast login
CREATE INDEX idx_users_username ON users(username);

-- 3. Trust Score (if not already there)
ALTER TABLE users 
ADD COLUMN trust_score FLOAT DEFAULT 0.1;
