-- Fix portal_messages schema for proper conversation threading
-- BUG-MSG-010: Fix conversation grouping and thread management

-- Step 1: Check if thread_id column exists, add if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portal_messages' AND column_name = 'thread_id') THEN
        ALTER TABLE portal_messages ADD COLUMN thread_id UUID;
        RAISE NOTICE 'Added thread_id column to portal_messages';
    ELSE
        RAISE NOTICE 'thread_id column already exists';
    END IF;
END $$;

-- Step 2: Check if content column exists, if not rename message to content
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'portal_messages' AND column_name = 'message') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'portal_messages' AND column_name = 'content') THEN
        ALTER TABLE portal_messages RENAME COLUMN message TO content;
        RAISE NOTICE 'Renamed message column to content';
    ELSE
        RAISE NOTICE 'content column already exists or message column not found';
    END IF;
END $$;

-- Step 3: Generate thread_id values for existing conversations
-- Group messages between same participants into threads
WITH conversation_pairs AS (
    SELECT DISTINCT
        LEAST(sender_id, recipient_id) as participant1,
        GREATEST(sender_id, recipient_id) as participant2
    FROM portal_messages
    WHERE thread_id IS NULL
),
thread_assignments AS (
    SELECT 
        participant1,
        participant2,
        gen_random_uuid() as new_thread_id
    FROM conversation_pairs
)
UPDATE portal_messages 
SET thread_id = ta.new_thread_id
FROM thread_assignments ta
WHERE portal_messages.thread_id IS NULL
  AND (
    (LEAST(portal_messages.sender_id, portal_messages.recipient_id) = ta.participant1 
     AND GREATEST(portal_messages.sender_id, portal_messages.recipient_id) = ta.participant2)
  );

-- Step 4: Set any remaining NULL thread_ids (shouldn't happen, but safety net)
UPDATE portal_messages 
SET thread_id = gen_random_uuid() 
WHERE thread_id IS NULL;

-- Step 5: Make thread_id NOT NULL and add index for performance
ALTER TABLE portal_messages ALTER COLUMN thread_id SET NOT NULL;

-- Step 6: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_portal_messages_thread_id ON portal_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_portal_messages_participant_threads ON portal_messages(thread_id, sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_portal_messages_created_at ON portal_messages(created_at DESC);

-- Step 7: Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add case_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portal_messages' AND column_name = 'case_id') THEN
        ALTER TABLE portal_messages ADD COLUMN case_id UUID REFERENCES cases(id);
        RAISE NOTICE 'Added case_id column';
    END IF;
    
    -- Add attachments if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portal_messages' AND column_name = 'attachments') THEN
        ALTER TABLE portal_messages ADD COLUMN attachments JSONB;
        RAISE NOTICE 'Added attachments column';
    END IF;
    
    -- Add read_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portal_messages' AND column_name = 'read_at') THEN
        ALTER TABLE portal_messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added read_at column';
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portal_messages' AND column_name = 'updated_at') THEN
        ALTER TABLE portal_messages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
    
    -- Add is_archived if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portal_messages' AND column_name = 'is_archived') THEN
        ALTER TABLE portal_messages ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_archived column';
    END IF;
END $$;

-- Step 8: Update the RLS policies to work with the new schema
DROP POLICY IF EXISTS "Users can view their own messages" ON portal_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON portal_messages;
DROP POLICY IF EXISTS "Staff can view messages" ON portal_messages;
DROP POLICY IF EXISTS "Staff can insert messages" ON portal_messages;

-- Create comprehensive RLS policies
CREATE POLICY "Client users can view their own messages" 
  ON portal_messages 
  FOR SELECT 
  USING (
    auth.uid() = (SELECT user_id FROM clients WHERE id = sender_id AND sender_type = 'client') OR
    auth.uid() = (SELECT user_id FROM clients WHERE id = recipient_id AND recipient_type = 'client')
  );

CREATE POLICY "Client users can insert their own messages" 
  ON portal_messages 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM clients WHERE id = sender_id AND sender_type = 'client')
  );

CREATE POLICY "Staff can view assigned client messages" 
  ON portal_messages 
  FOR SELECT 
  USING (
    -- Staff can view messages where they are sender or recipient
    (sender_type = 'staff' AND sender_id = auth.uid()::text) OR
    (recipient_type = 'staff' AND recipient_id = auth.uid()::text) OR
    -- Staff can view messages from their assigned clients
    EXISTS (
      SELECT 1 FROM staff_client_assignments sca 
      WHERE sca.staff_id = auth.uid()::text 
      AND sca.is_active = true 
      AND (sca.client_id = sender_id OR sca.client_id = recipient_id)
    )
  );

CREATE POLICY "Staff can insert messages" 
  ON portal_messages 
  FOR INSERT 
  WITH CHECK (
    sender_type = 'staff' AND sender_id = auth.uid()::text
  );

CREATE POLICY "Staff can update message status" 
  ON portal_messages 
  FOR UPDATE 
  USING (
    -- Staff can update messages where they are recipient (mark as read)
    (recipient_type = 'staff' AND recipient_id = auth.uid()::text) OR
    -- Staff can update messages from their assigned clients
    EXISTS (
      SELECT 1 FROM staff_client_assignments sca 
      WHERE sca.staff_id = auth.uid()::text 
      AND sca.is_active = true 
      AND (sca.client_id = sender_id OR sca.client_id = recipient_id)
    )
  );

-- Add a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_portal_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_portal_messages_updated_at ON portal_messages;
CREATE TRIGGER trigger_portal_messages_updated_at
    BEFORE UPDATE ON portal_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_portal_messages_updated_at();

COMMIT;