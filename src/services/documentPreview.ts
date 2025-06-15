
import { supabase } from '@/integrations/supabase/client';

export const getDocumentPreviewUrl = async (document: any): Promise<string> => {
  try {
    console.log('Getting preview URL for document:', document.document_name);
    
    // If the document has a file_path, get the signed URL from Supabase storage
    if (document.file_path) {
      console.log('Document has file_path:', document.file_path);
      const { data, error } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry
      
      if (error) {
        console.error('Error creating signed URL:', error);
      } else if (data?.signedUrl) {
        console.log('Successfully created signed URL');
        return data.signedUrl;
      }
    }
    
    // For demo purposes with mock documents, create appropriate preview URLs
    const filename = document.document_name || document.original_filename || 'document.pdf';
    const extension = filename.toLowerCase().split('.').pop();
    
    console.log('Using fallback preview for file type:', extension);
    
    // For PDF files, use a working PDF URL
    if (extension === 'pdf') {
      return 'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf';
    }
    
    // For images, return a placeholder image
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return 'https://picsum.photos/800/600?random=' + document.id;
    }
    
    // For ZIP files and other documents
    if (extension === 'zip') {
      return 'https://via.placeholder.com/800x600/e3f2fd/1976d2?text=ZIP+File+Preview+Not+Available';
    }
    
    // For other files, return a generic placeholder
    return 'https://via.placeholder.com/800x600/f5f5f5/666666?text=Preview+Not+Available';
  } catch (error) {
    console.error('Error getting document preview URL:', error);
    return 'https://via.placeholder.com/800x600/ffebee/d32f2f?text=Error+Loading+Preview';
  }
};

export const downloadDocument = async (document: any) => {
  try {
    console.log('Downloading document:', document.document_name);
    
    if (document.file_path) {
      const { data, error } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(document.file_path, 60); // 1 minute for download
      
      if (error) {
        console.error('Error creating download URL:', error);
      } else if (data?.signedUrl) {
        console.log('Successfully created download URL');
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = document.document_name || document.original_filename || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
    }
    
    // For demo purposes with mock documents, simulate download
    console.log('Simulating download for demo document');
    
    // Create a simple text file for demo download
    const content = `Documento: ${document.document_name}\nTipo: ${document.document_type}\nData: ${new Date(document.upload_date).toLocaleDateString('pt-BR')}\n\nEste é um documento de demonstração do sistema.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = document.document_name || 'documento.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    window.URL.revokeObjectURL(url);
    
    // Show success message
    const event = new CustomEvent('show-toast', {
      detail: {
        title: 'Download iniciado',
        description: `${document.document_name} foi baixado com sucesso!`,
        variant: 'success'
      }
    });
    window.dispatchEvent(event);
    
  } catch (error) {
    console.error('Error downloading document:', error);
    
    // Show error message
    const event = new CustomEvent('show-toast', {
      detail: {
        title: 'Erro no download',
        description: 'Não foi possível baixar o documento. Tente novamente.',
        variant: 'destructive'
      }
    });
    window.dispatchEvent(event);
  }
};
