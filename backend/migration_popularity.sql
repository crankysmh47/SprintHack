-- Add vote_count to rumors for sorting
ALTER TABLE rumors ADD COLUMN IF NOT EXISTS vote_count INT DEFAULT 0;

-- Optional: Update existing counts
UPDATE rumors r
SET vote_count = (SELECT COUNT(*) FROM votes v WHERE v.rumor_id = r.id);

-- Trigger to maintain vote_count
CREATE OR REPLACE FUNCTION update_vote_count() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE rumors SET vote_count = vote_count + 1 WHERE id = NEW.rumor_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE rumors SET vote_count = vote_count - 1 WHERE id = OLD.rumor_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_vote_count ON votes;
CREATE TRIGGER trg_update_vote_count
AFTER INSERT OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION update_vote_count();
