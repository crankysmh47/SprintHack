-- Add is_trap column to rumors table
ALTER TABLE rumors 
ADD COLUMN is_trap BOOLEAN DEFAULT FALSE;

-- Add is_banned column to users table
ALTER TABLE users 
ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;

-- Optional: Create an index on is_trap for performance if filtering becomes heavy (though likely fine for now)
CREATE INDEX idx_rumors_is_trap ON rumors(is_trap);
