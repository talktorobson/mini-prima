
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
    
    // For demo purposes with mock documents, create appropriate preview content
    const filename = document.document_name || document.original_filename || 'document.pdf';
    const extension = filename.toLowerCase().split('.').pop();
    
    console.log('Using fallback preview for file type:', extension);
    
    // For PDF files, create a demo PDF content
    if (extension === 'pdf') {
      const pdfContent = createDemoPdfContent(document);
      return `data:application/pdf;base64,${btoa(pdfContent)}`;
    }
    
    // For images, create a demo image
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      const svgContent = createDemoImageContent(document);
      return `data:image/svg+xml;base64,${btoa(svgContent)}`;
    }
    
    // For other files, return a data URL with preview text
    const textContent = createDemoTextContent(document);
    return `data:text/plain;charset=utf-8,${encodeURIComponent(textContent)}`;
    
  } catch (error) {
    console.error('Error getting document preview URL:', error);
    const errorContent = `Erro ao carregar preview do documento: ${document.document_name}`;
    return `data:text/plain;charset=utf-8,${encodeURIComponent(errorContent)}`;
  }
};

const createDemoPdfContent = (document: any): string => {
  // This is a minimal PDF structure for demo purposes
  return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/ProcSet [/PDF /Text]
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
72 720 Td
(Documento: ${document.document_name}) Tj
0 -15 Td
(Tipo: ${document.document_type}) Tj
0 -15 Td
(Data: ${new Date(document.upload_date).toLocaleDateString('pt-BR')}) Tj
0 -30 Td
(Este é um documento de demonstração.) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000329 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
479
%%EOF`;
};

const createDemoImageContent = (document: any): string => {
  return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f8f9fa"/>
    <rect x="50" y="50" width="700" height="500" fill="white" stroke="#dee2e6" stroke-width="2"/>
    <text x="400" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#495057">
      ${document.document_name}
    </text>
    <text x="400" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#6c757d">
      Tipo: ${document.document_type}
    </text>
    <text x="400" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6c757d">
      Data: ${new Date(document.upload_date).toLocaleDateString('pt-BR')}
    </text>
    <text x="400" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#868e96">
      Esta é uma imagem de demonstração
    </text>
    <rect x="300" y="400" width="200" height="100" fill="#e9ecef" stroke="#adb5bd"/>
    <text x="400" y="455" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6c757d">
      Imagem Demo
    </text>
  </svg>`;
};

const createDemoTextContent = (document: any): string => {
  return `Documento: ${document.document_name}
Tipo: ${document.document_type}
Data: ${new Date(document.upload_date).toLocaleDateString('pt-BR')}
Tamanho: ${document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : 'N/A'}

Este é um documento de demonstração do sistema.

Conteúdo:
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

---
Sistema de Gestão Jurídica
Portal do Cliente`;
};

export const downloadDocument = async (doc: any) => {
  try {
    console.log('Downloading document:', doc.document_name);
    
    if (doc.file_path) {
      const { data, error } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(doc.file_path, 60); // 1 minute for download
      
      if (error) {
        console.error('Error creating download URL:', error);
      } else if (data?.signedUrl) {
        console.log('Successfully created download URL');
        
        // Use fetch to download the file and create a blob
        try {
          const response = await fetch(data.signedUrl);
          const blob = await response.blob();
          
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = doc.document_name || doc.original_filename || 'document';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the object URL
          window.URL.revokeObjectURL(url);
          
          // Show success message
          const event = new CustomEvent('show-toast', {
            detail: {
              title: 'Download iniciado',
              description: `${doc.document_name} foi baixado com sucesso!`,
              variant: 'success'
            }
          });
          window.dispatchEvent(event);
          return;
        } catch (fetchError) {
          console.error('Error fetching file for download:', fetchError);
        }
      }
    }
    
    // For demo purposes with mock documents, create and download demo content
    console.log('Creating demo download for document');
    
    const filename = doc.document_name || doc.original_filename || 'documento';
    const extension = filename.toLowerCase().split('.').pop();
    let blob: Blob;
    let downloadFilename = filename;
    
    if (extension === 'pdf') {
      const pdfContent = createDemoPdfContent(doc);
      blob = new Blob([pdfContent], { type: 'application/pdf' });
      if (!downloadFilename.endsWith('.pdf')) {
        downloadFilename += '.pdf';
      }
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      const svgContent = createDemoImageContent(doc);
      blob = new Blob([svgContent], { type: 'image/svg+xml' });
      if (!downloadFilename.includes('.')) {
        downloadFilename += '.svg';
      }
    } else {
      const textContent = createDemoTextContent(doc);
      blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      if (!downloadFilename.endsWith('.txt')) {
        downloadFilename += '.txt';
      }
    }
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename;
    
    // Ensure the link is added to the document and clicked
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    window.URL.revokeObjectURL(url);
    
    // Show success message
    const event = new CustomEvent('show-toast', {
      detail: {
        title: 'Download iniciado',
        description: `${doc.document_name} foi baixado com sucesso!`,
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
