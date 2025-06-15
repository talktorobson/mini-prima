
import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, FileText, Scale, DollarSign } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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

function getColorByType(type: string) {
  switch (type) {
    case "document":
    case "document_upload":
    case "document_update":
      return "border-blue-200 bg-blue-50";
    case "case_update":
    case "case":
      return "border-green-200 bg-green-50";
    case "financial":
    case "financial_record":
      return "border-yellow-200 bg-yellow-50";
    case "reminder":
      return "border-orange-200 bg-orange-50";
    default:
      return "border-gray-200 bg-white";
  }
}

function getIconByType(type: string) {
  switch (type) {
    case "document":
    case "document_upload":
    case "document_update":
      return <FileText className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />;
    case "case_update":
    case "case":
      return <Scale className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />;
    case "financial":
    case "financial_record":
      return <DollarSign className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />;
    case "reminder":
      return <Bell className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />;
    default:
      return <Bell className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />;
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

const PortalNotificationList: React.FC<{ notifications: Notification[] }> = ({
  notifications,
}) => {
  const navigate = useNavigate();

  const handleClick = (notif: Notification) => {
    // Try to route to action_url if set, else build a route from metadata/type
    if (notif.action_url) {
      navigate(notif.action_url);
      return;
    }
    // fallback by type/metadata
    if (notif.type.startsWith("case") && notif.metadata?.case_id) {
      navigate(`/portal/cases?open=${notif.metadata.case_id}`);
    } else if (notif.type.startsWith("document") && notif.metadata?.document_id) {
      navigate(`/portal/documents?open=${notif.metadata.document_id}`);
    } else if (
      (notif.type.startsWith("financial") || notif.type === "financial_record") &&
      notif.metadata?.financial_id
    ) {
      navigate(`/portal/financial?open=${notif.metadata.financial_id}`);
    }
    // else: do nothing
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center text-gray-500 mt-16 text-lg">Nenhuma notificação até o momento.</div>
        ) : (
          notifications.map((notif) => (
            <button
              key={notif.id}
              className={`w-full text-left rounded-lg p-4 border transition cursor-pointer hover:shadow-md focus:outline-none block ${
                getColorByType(notif.type)
              }`}
              onClick={() => handleClick(notif)}
              tabIndex={0}
            >
              <div className="flex items-start space-x-3">
                {getIconByType(notif.type)}
                <div className="flex-1">
                  <div className="flex items-baseline">
                    <h4 className="font-medium text-base mr-2">
                      {notif.title}
                    </h4>
                    {notif.type.startsWith("case") && notif.metadata?.case_number && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
                        Processo #{notif.metadata.case_number}
                      </span>
                    )}
                    {notif.type.startsWith("document") && notif.metadata?.document_name && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {notif.metadata.document_name}
                      </span>
                    )}
                    {(notif.type === "financial" || notif.type === "financial_record") && notif.metadata?.description && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                        {notif.metadata.description}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm mt-1">{notif.message}</p>
                  <span className="text-xs text-gray-500">{timeAgo(notif.created_at)}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </ScrollArea>
  );
};

export default PortalNotificationList;

