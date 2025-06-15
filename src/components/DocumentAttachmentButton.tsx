
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip } from 'lucide-react';
import DocumentUploadManager from './DocumentUploadManager';

interface DocumentAttachmentButtonProps {
  caseId?: string;
  caseTitle?: string;
  onUploadComplete?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const DocumentAttachmentButton: React.FC<DocumentAttachmentButtonProps> = ({
  caseId,
  caseTitle,
  onUploadComplete,
  variant = "outline",
  size = "sm",
  className
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleUploadComplete = () => {
    onUploadComplete?.();
    setIsUploadOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsUploadOpen(true)}
      >
        <Paperclip className="h-4 w-4 mr-2" />
        Anexar Documento
      </Button>

      <DocumentUploadManager
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
        preselectedCaseId={caseId}
        preselectedCaseTitle={caseTitle}
      />
    </>
  );
};

export default DocumentAttachmentButton;
