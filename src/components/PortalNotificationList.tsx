
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, FileText, Scale, DollarSign, MessagesSquare, Info, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  client_id: string;
  action_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  is_read?: boolean;
}

interface PortalNotificationListProps {
  notifications: Notification[];
  onMessageNotificationClick?: () => void; // New prop to handle message notification clicks
}

function getColorByType(type: string) {
  switch (type) {
    case "document":
      return "border-blue-200 bg-blue-50 hover:bg-blue-100";
    case "case_update":
      return "border-green-200 bg-green-50 hover:bg-green-100";
    case "payment":
      return "border-yellow-200 bg-yellow-50 hover:bg-yellow-100";
    case "info":
      return "border-orange-200 bg-orange-50 hover:bg-orange-100";
    case "message":
      return "border-purple-200 bg-purple-50 hover:bg-purple-100";
    default:
      return "border-gray-200 bg-white hover:bg-gray-50";
  }
}

function getIconByType(type: string) {
  switch (type) {
    case "document":
      return <FileText className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />;
    case "case_update":
      return <Scale className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />;
    case "payment":
      return <DollarSign className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />;
    case "info":
      return <Info className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />;
    case "message":
      return <MessagesSquare className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />;
    default:
      return <Bell className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case "document":
      return "Documento";
    case "case_update":
      return "Atualização de Processo";
    case "payment":
      return "Financeiro";
    case "info":
      return "Informação";
    case "message":
      return "Mensagem";
    default:
      return "Notificação";
  }
}

// Helper for "time ago"
function timeAgo(dateStr: string) {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = (now.getTime() - then.getTime()) / 1000; // seconds

  if (diff < 60) return "Agora mesmo";
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `Há ${Math.floor(diff / 86400)} dia${Math.floor(diff / 86400) > 1 ? "s" : ""}`;
  return then.toLocaleDateString("pt-BR");
}

const PortalNotificationList: React.FC<PortalNotificationListProps> = ({
  notifications,
  onMessageNotificationClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleClick = (notif: Notification) => {
    console.log('Notification clicked:', notif);
    
    // Show toast feedback
    toast({
      title: "Abrindo notificação",
      description: `Navegando para ${getTypeLabel(notif.type).toLowerCase()}...`,
    });

    // Special handling for message notifications when already on messages page
    if (notif.type === 'message' && location.pathname === '/portal/messages') {
      console.log('Message notification clicked while on messages page - switching to chat');
      if (onMessageNotificationClick) {
        onMessageNotificationClick();
        toast({
          title: "Chat ativado",
          description: "Mudando para o modo de chat.",
        });
        return;
      }
    }

    // First priority: Use action_url if it exists
    if (notif.action_url) {
      console.log('Navigating to action_url:', notif.action_url);
      navigate(notif.action_url);
      return;
    }
    
    // Second priority: Build route from type and metadata
    switch (notif.type) {
      case 'case_update':
        if (notif.metadata?.case_id) {
          const url = `/portal/cases?open=${notif.metadata.case_id}`;
          console.log('Navigating to case:', url);
          navigate(url);
          return;
        }
        // Fallback to cases page
        console.log('No case_id found, navigating to cases page');
        navigate('/portal/cases');
        return;

      case 'document':
        if (notif.metadata?.document_id) {
          const url = `/portal/documents?open=${notif.metadata.document_id}`;
          console.log('Navigating to document:', url);
          navigate(url);
          return;
        }
        // Fallback to documents page
        console.log('No document_id found, navigating to documents page');
        navigate('/portal/documents');
        return;

      case 'payment':
        if (notif.metadata?.financial_id) {
          const url = `/portal/financial?open=${notif.metadata.financial_id}`;
          console.log('Navigating to financial record:', url);
          navigate(url);
          return;
        }
        // Fallback to financial page for payment notifications
        console.log('No financial_id found, navigating to financial page');
        navigate('/portal/financial');
        return;

      case 'message':
        console.log('Navigating to messages page');
        navigate('/portal/messages');
        return;

      case 'info':
        // For info notifications, try to navigate based on metadata or fallback to portal
        if (notif.metadata?.case_number) {
          console.log('Info notification about case, navigating to cases');
          navigate('/portal/cases');
          return;
        }
        console.log('General info notification, staying on current page');
        toast({
          title: "Informação visualizada",
          description: "Esta é uma notificação informativa.",
        });
        return;

      default:
        console.log('Unknown notification type, navigating to portal');
        navigate('/portal');
        return;
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1">
        {notifications.length === 0 ? (
          <div className="text-center text-gray-500 mt-16 text-lg">Nenhuma notificação até o momento.</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`w-full rounded-lg p-4 border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 block relative ${
                getColorByType(notif.type)
              } ${!notif.is_read ? 'ring-2 ring-blue-200' : ''}`}
              onClick={() => handleClick(notif)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick(notif);
                }
              }}
            >
              {/* Unread indicator */}
              {!notif.is_read && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
              
              <div className="flex items-start space-x-4">
                {getIconByType(notif.type)}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {getTypeLabel(notif.type)}
                        </span>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {notif.title}
                      </h4>
                      <p className="text-sm text-gray-600">{notif.message}</p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap pl-4">
                      {timeAgo(notif.created_at)}
                    </span>
                  </div>
                  
                  {/* Enhanced metadata display */}
                  {notif.metadata && Object.keys(notif.metadata).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200/80">
                      <div className="grid grid-cols-1 gap-2">
                        {notif.metadata.case_number && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600">Processo:</span>
                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 font-mono">
                              #{notif.metadata.case_number}
                            </span>
                          </div>
                        )}
                        {notif.metadata.document_name && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600">Documento:</span>
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 max-w-48 truncate">
                              {notif.metadata.document_name}
                            </span>
                          </div>
                        )}
                        {notif.type === "payment" && notif.metadata.description && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600">Referência:</span>
                            <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                              {notif.metadata.description}
                            </span>
                          </div>
                        )}
                        {notif.metadata.amount && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600">Valor:</span>
                            <span className="text-xs font-mono font-semibold text-gray-800">
                              R$ {notif.metadata.amount}
                            </span>
                          </div>
                        )}
                        
                        {/* Show navigation hint */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-xs font-semibold text-gray-600">Ação:</span>
                          <span className="text-xs text-blue-600 font-medium">
                            {notif.type === 'message' && location.pathname === '/portal/messages' 
                              ? 'Clique para ir ao chat →' 
                              : 'Clique para abrir →'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};

export default PortalNotificationList;
