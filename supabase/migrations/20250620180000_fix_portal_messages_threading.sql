-- BUG-MSG-010: Fix conversation grouping and thread management
-- Migration to fix portal_messages schema for proper threading

-- Step 1: Add thread_id column if it doesn't exist
ALTER TABLE portal_messages 
ADD COLUMN IF NOT EXISTS thread_id UUID;

-- Step 2: Check if we need to rename 'message' to 'content'
-- If 'message' column exists and 'content' doesn't, rename it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'portal_messages' 
        AND column_name = 'message'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'portal_messages' 
        AND column_name = 'content'
    ) THEN
        ALTER TABLE portal_messages RENAME COLUMN message TO content;
        RAISE NOTICE 'Renamed message column to content for consistency';
    END IF;
END $$;

-- Step 3: Add other missing columns
ALTER TABLE portal_messages 
ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES cases(id),
ADD COLUMN IF NOT EXISTS attachments JSONB,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Step 4: Generate thread_id values for existing conversations
-- This groups messages between the same participants into conversations
UPDATE portal_messages 
SET thread_id = (
    SELECT COALESCE(
        -- Try to find an existing thread_id for this conversation
        (SELECT DISTINCT thread_id 
         FROM portal_messages pm2 
         WHERE pm2.thread_id IS NOT NULL
         AND (
             (pm2.sender_id = portal_messages.sender_id AND pm2.recipient_id = portal_messages.recipient_id) OR
             (pm2.sender_id = portal_messages.recipient_id AND pm2.recipient_id = portal_messages.sender_id)
         )
         LIMIT 1),
        -- If no existing thread, create a deterministic UUID based on participant IDs
        uuid_generate_v5(
            uuid_ns_oid(), 
            LEAST(portal_messages.sender_id, portal_messages.recipient_id) || 
            GREATEST(portal_messages.sender_id, portal_messages.recipient_id)
        )
    )
)
WHERE thread_id IS NULL;

-- Step 5: Make thread_id NOT NULL now that all rows have values
ALTER TABLE portal_messages 
ALTER COLUMN thread_id SET NOT NULL;

-- Step 6: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_portal_messages_thread_id 
ON portal_messages(thread_id);

CREATE INDEX IF NOT EXISTS idx_portal_messages_participants 
ON portal_messages(sender_id, recipient_id);

CREATE INDEX IF NOT EXISTS idx_portal_messages_thread_created 
ON portal_messages(thread_id, created_at DESC);

-- Step 7: Create or replace updated_at trigger
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

-- Step 8: Update RLS policies for better security
DROP POLICY IF EXISTS "Users can view their own messages" ON portal_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON portal_messages;
DROP POLICY IF EXISTS "Staff can view messages" ON portal_messages;
DROP POLICY IF EXISTS "Staff can insert messages" ON portal_messages;

-- Client policies
CREATE POLICY "Clients can view their conversations" 
ON portal_messages FOR SELECT 
USING (
    auth.uid() = (
        SELECT user_id FROM clients 
        WHERE id = sender_id AND sender_type = 'client'
    ) OR
    auth.uid() = (
        SELECT user_id FROM clients 
        WHERE id = recipient_id AND recipient_type = 'client'
    )
);

CREATE POLICY "Clients can send messages" 
ON portal_messages FOR INSERT 
WITH CHECK (
    auth.uid() = (
        SELECT user_id FROM clients 
        WHERE id = sender_id AND sender_type = 'client'
    )
);

-- Staff policies  
CREATE POLICY "Staff can view assigned client messages" 
ON portal_messages FOR SELECT 
USING (
    -- Staff can view messages where they are participants
    (sender_type = 'staff' AND sender_id = auth.uid()::text) OR
    (recipient_type = 'staff' AND recipient_id = auth.uid()::text) OR
    -- Staff can view messages from their assigned clients
    EXISTS (
        SELECT 1 FROM staff_client_assignments sca 
        WHERE sca.staff_id = auth.uid()::text 
        AND sca.is_active = true 
        AND (
            (sender_type = 'client' AND sca.client_id = sender_id) OR
            (recipient_type = 'client' AND sca.client_id = recipient_id)
        )
    )
);

CREATE POLICY "Staff can send messages" 
ON portal_messages FOR INSERT 
WITH CHECK (
    sender_type = 'staff' AND sender_id = auth.uid()::text
);

CREATE POLICY "Staff can update message status" 
ON portal_messages FOR UPDATE 
USING (
    -- Staff can update messages where they are recipient (mark as read)
    (recipient_type = 'staff' AND recipient_id = auth.uid()::text) OR
    -- Staff can update messages from their assigned clients
    EXISTS (
        SELECT 1 FROM staff_client_assignments sca 
        WHERE sca.staff_id = auth.uid()::text 
        AND sca.is_active = true 
        AND (
            (sender_type = 'client' AND sca.client_id = sender_id) OR
            (recipient_type = 'client' AND sca.client_id = recipient_id)
        )
    )
);