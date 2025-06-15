
import React from 'react';
import DocumentCard from './DocumentCard';
import EmptyDocumentsState from './EmptyDocumentsState';

interface SearchFilters {
  query: string;
  type: string;
  status: string;
  dateRange: string;
}

interface DocumentsListProps {
  documents: any[];
  searchFilters: SearchFilters;
  onPreview: (document: any) => void;
  onDownload: (document: any) => void;
  isLoadingPreview: boolean;
  selectedDocumentId?: number | string;
}

const DocumentsList: React.FC<DocumentsListProps> = ({
  documents,
  searchFilters,
  onPreview,
  onDownload,
  isLoadingPreview,
  selectedDocumentId
}) => {
  if (documents.length === 0) {
    return <EmptyDocumentsState searchFilters={searchFilters} />;
  }

  return (
    <div className="grid gap-3">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onPreview={onPreview}
          onDownload={onDownload}
          isLoadingPreview={isLoadingPreview}
          selectedDocumentId={selectedDocumentId}
        />
      ))}
    </div>
  );
};

export default DocumentsList;
