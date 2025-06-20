/**
 * Message Migration Service
 * 
 * Utility to migrate existing plain text messages to encrypted format
 * for enhanced legal confidentiality compliance.
 */

import { supabase } from '@/integrations/supabase/client';
import { encryptMessage, isEncrypted, migrateMessageToEncrypted } from './encryptionService';

interface MessageToMigrate {
  id: string;
  content: string;
}

/**
 * Migrate all unencrypted messages to encrypted format
 * This should be run once when deploying the encryption feature
 */
export const migrateExistingMessages = async (): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> => {
  console.log('🔐 Starting message encryption migration...');
  
  try {
    // Fetch all messages that appear to be unencrypted
    const { data: allMessages, error: fetchError } = await supabase
      .from('portal_messages')
      .select('id, content')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching messages for migration:', fetchError);
      return {
        success: false,
        migratedCount: 0,
        errors: [`Fetch error: ${fetchError.message}`]
      };
    }

    if (!allMessages || allMessages.length === 0) {
      console.log('No messages found to migrate');
      return {
        success: true,
        migratedCount: 0,
        errors: []
      };
    }

    // Filter out messages that are already encrypted
    const unencryptedMessages = allMessages.filter(msg => 
      msg.content && !isEncrypted(msg.content)
    );

    console.log(`Found ${unencryptedMessages.length} unencrypted messages out of ${allMessages.length} total`);

    if (unencryptedMessages.length === 0) {
      console.log('All messages are already encrypted');
      return {
        success: true,
        migratedCount: 0,
        errors: []
      };
    }

    const errors: string[] = [];
    let migratedCount = 0;

    // Process messages in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < unencryptedMessages.length; i += batchSize) {
      const batch = unencryptedMessages.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(unencryptedMessages.length / batchSize)}`);

      // Process each message in the batch
      for (const message of batch) {
        try {
          const encryptedContent = await migrateMessageToEncrypted(message.content);
          
          // Update the message with encrypted content
          const { error: updateError } = await supabase
            .from('portal_messages')
            .update({ content: encryptedContent })
            .eq('id', message.id);

          if (updateError) {
            console.error(`Error updating message ${message.id}:`, updateError);
            errors.push(`Message ${message.id}: ${updateError.message}`);
          } else {
            migratedCount++;
            console.log(`✅ Migrated message ${message.id}`);
          }
        } catch (error) {
          console.error(`Error encrypting message ${message.id}:`, error);
          errors.push(`Message ${message.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Add a small delay between batches to be gentle on the system
      if (i + batchSize < unencryptedMessages.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`🎉 Migration completed: ${migratedCount} messages encrypted`);
    
    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} errors encountered during migration:`, errors);
    }

    return {
      success: errors.length < unencryptedMessages.length / 2, // Success if less than 50% failed
      migratedCount,
      errors
    };

  } catch (error) {
    console.error('Fatal error during message migration:', error);
    return {
      success: false,
      migratedCount: 0,
      errors: [`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
};

/**
 * Check migration status - how many messages are encrypted vs unencrypted
 */
export const checkMigrationStatus = async (): Promise<{
  total: number;
  encrypted: number;
  unencrypted: number;
  encryptionPercentage: number;
}> => {
  try {
    const { data: allMessages, error } = await supabase
      .from('portal_messages')
      .select('content');

    if (error) {
      console.error('Error checking migration status:', error);
      return { total: 0, encrypted: 0, unencrypted: 0, encryptionPercentage: 0 };
    }

    const total = allMessages?.length || 0;
    const encrypted = allMessages?.filter(msg => msg.content && isEncrypted(msg.content)).length || 0;
    const unencrypted = total - encrypted;
    const encryptionPercentage = total > 0 ? Math.round((encrypted / total) * 100) : 0;

    console.log(`📊 Migration Status: ${encrypted}/${total} messages encrypted (${encryptionPercentage}%)`);

    return {
      total,
      encrypted,
      unencrypted,
      encryptionPercentage
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return { total: 0, encrypted: 0, unencrypted: 0, encryptionPercentage: 0 };
  }
};

/**
 * Development utility: Test encryption/decryption with a sample message
 */
export const testEncryption = async (testMessage: string = "Test legal message for confidentiality"): Promise<boolean> => {
  try {
    console.log('🧪 Testing encryption/decryption...');
    
    const encrypted = await encryptMessage(testMessage);
    console.log('Encrypted:', encrypted.substring(0, 50) + '...');
    
    // Note: We can't directly test decryption here since it needs the messages format
    // But we can verify the message was encrypted
    const wasEncrypted = isEncrypted(encrypted);
    
    console.log('✅ Encryption test passed:', wasEncrypted);
    return wasEncrypted;
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    return false;
  }
};