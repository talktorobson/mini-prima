
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  previewUrl: string;
  onDownload: () => void;
}

const DocumentPreviewModal = ({ isOpen, onClose, document, previewUrl, onDownload }: DocumentPreviewModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-800 border-slate-700">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-white text-lg">
            {document?.document_name}
          </DialogTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="w-full h-[70vh] bg-white rounded">
          <iframe
            src={previewUrl}
            className="w-full h-full rounded"
            title={`Preview of ${document?.document_name}`}
            style={{ border: 'none' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
