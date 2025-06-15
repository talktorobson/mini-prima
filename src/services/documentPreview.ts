
import { supabase } from '@/integrations/supabase/client';

export const getDocumentPreviewUrl = async (document: any): Promise<string> => {
  try {
    // If the document has a file_path, get the signed URL from Supabase storage
    if (document.file_path) {
      const { data } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry
      
      if (data?.signedUrl) {
        return data.signedUrl;
      }
    }
    
    // Fallback: generate a placeholder URL for demo purposes
    const filename = document.document_name || document.original_filename || 'document.pdf';
    const extension = filename.toLowerCase().split('.').pop();
    
    // For demo purposes, return a placeholder PDF URL
    if (extension === 'pdf') {
      return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    }
    
    // For images, return a placeholder image
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return 'https://via.placeholder.com/800x600/f0f0f0/666666?text=Document+Preview';
    }
    
    // For other files, return a generic placeholder
    return 'https://via.placeholder.com/800x600/f0f0f0/666666?text=Preview+Not+Available';
  } catch (error) {
    console.error('Error getting document preview URL:', error);
    return 'https://via.placeholder.com/800x600/f0f0f0/666666?text=Error+Loading+Preview';
  }
};

export const downloadDocument = async (document: any) => {
  try {
    console.log('Downloading document:', document.document_name);
    
    if (document.file_path) {
      const { data } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(document.file_path, 60); // 1 minute for download
      
      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = document.document_name || document.original_filename || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
    }
    
    // Fallback for demo purposes
    alert('Documento baixado com sucesso!');
  } catch (error) {
    console.error('Error downloading document:', error);
    alert('Erro ao baixar documento. Tente novamente.');
  }
};
