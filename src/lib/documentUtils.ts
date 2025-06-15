
/**
 * Helper function to get display label for document type
 * Translates specific document types to Portuguese while keeping others unchanged
 */
export function getDocumentTypeDisplayLabel(docType: string): string {
  if (docType === 'General Document') return 'Documento Escritório';
  if (docType === 'Case Document') return 'Documento Processo';
  return docType; // Return original type for other cases
}
