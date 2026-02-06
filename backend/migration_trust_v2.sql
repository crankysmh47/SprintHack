-- 🔐 TRUST SYSTEM V2 MIGRATION
-- Run this in Supabase SQL Editor to upgrade your database to the "Professional" tier.

-- 1. Enable Crypto Extension
create extension if not exists "pgcrypto";

-- 2. Upgrade Users Table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_votes_cast INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS correct_votes INT DEFAULT 0;

-- 3. Create Invites Table
CREATE TABLE IF NOT EXISTS invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID REFERENCES users(id),
    invitee_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Upgrade Votes Table (Weighted Voting)
ALTER TABLE votes 
ADD COLUMN IF NOT EXISTS vote_weight FLOAT DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS was_correct BOOLEAN,
ADD COLUMN IF NOT EXISTS prediction FLOAT; -- Ensure this exists

-- 5. Upgrade Rumors Table
ALTER TABLE rumors
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE;

-- ==========================================
-- 🧠 THE BRAIN: AUTOMATIC TRUST TRIGGERS
-- ==========================================

-- Function: Recalculate Trust Score
CREATE OR REPLACE FUNCTION recalc_trust_score() RETURNS TRIGGER AS $$
DECLARE
    new_trust FLOAT;
    user_record RECORD;
BEGIN
    -- We assume 'NEW' is the updated ROW in users table, 
    -- but usually we trigger this from the VOTES table update.
    -- Let's define the trigger on VOTES (after update of was_correct).
    
    -- This function will be called for each USER involved.
    -- But since we can't easily iterate, let's make a specific function called by the Rumor Verification Trigger.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGER: On Rumor Verification -> Validate Votes -> Update Users
CREATE OR REPLACE FUNCTION on_rumor_verification() RETURNS TRIGGER AS $$
BEGIN
    -- Only run if verified_result is CHANGED and NOT NULL
    IF NEW.verified_result IS NOT NULL AND (OLD.verified_result IS NULL OR OLD.verified_result != NEW.verified_result) THEN
        
        -- A. Mark all votes as Correct/Incorrect
        UPDATE votes 
        SET was_correct = (vote = NEW.verified_result)
        WHERE rumor_id = NEW.id;

        -- B. Update User Stats (Aggregate)
        -- We do this by recalculating stats for all users who voted on this rumor
        UPDATE users u
        SET 
            total_votes_cast = (SELECT COUNT(*) FROM votes v WHERE v.user_id = u.id AND v.was_correct IS NOT NULL),
            correct_votes = (SELECT COUNT(*) FROM votes v WHERE v.user_id = u.id AND v.was_correct = TRUE)
        WHERE u.id IN (SELECT user_id FROM votes WHERE rumor_id = NEW.id);

        -- C. Update Trust Scores
        -- Formula: 0.3 * (0.5) + 0.7 * (correct / total)
        -- We default total to 1 to avoid division by zero (logic handled in CASE)
        UPDATE users u
        SET trust_score = 
            CASE 
                WHEN total_votes_cast > 0 THEN 
                    (0.3 * 0.5) + (0.7 * (CAST(correct_votes AS FLOAT) / total_votes_cast))
                ELSE 
                    0.5
            END
        WHERE u.id IN (SELECT user_id FROM votes WHERE rumor_id = NEW.id);

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind Trigger to Rumors Table
DROP TRIGGER IF EXISTS trg_verify_rumor ON rumors;
CREATE TRIGGER trg_verify_rumor
AFTER UPDATE OF verified_result ON rumors
FOR EACH ROW
EXECUTE FUNCTION on_rumor_verification();

-- 7. SEED DATA (Genesis User)
-- We need at least one user to invite others!
INSERT INTO users (username, password_hash, trust_score, invite_code)
VALUES 
    ('genesis', 'genesis_hash_placeholder', 1.0, 'GENESIS')
ON CONFLICT (username) DO NOTHING;

