import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, FileText, MessageCircle, Percent } from 'lucide-react';
import { SubscriptionPlan } from '@/lib/subscriptionService';

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  onSelectPlan?: (planId: string) => void;
  showPricing?: boolean;
}

const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  isCurrentPlan = false,
  onSelectPlan,
  showPricing = true
}) => {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-blue-500';
      case 'professional': return 'bg-purple-500';
      case 'enterprise': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'labor_law': return '⚖️';
      case 'corporate_law': return '🏢';
      case 'full_service': return '🎯';
      default: return '📋';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const yearlySavings = plan.yearly_price 
    ? ((plan.monthly_price * 12) - plan.yearly_price) 
    : 0;

  return (
    <Card className={`relative h-full transition-all duration-200 hover:shadow-lg ${
      isCurrentPlan ? 'ring-2 ring-red-500 bg-red-50' : ''
    }`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-red-500 text-white">Plano Atual</Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span className="text-2xl">{getCategoryIcon(plan.category)}</span>
          <Badge variant="secondary" className={`${getTierColor(plan.tier)} text-white`}>
            {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
          </Badge>
        </div>
        
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-sm">{plan.description}</CardDescription>
        
        {showPricing && (
          <div className="mt-4 space-y-2">
            <div className="text-3xl font-bold text-red-600">
              {formatPrice(plan.monthly_price)}
              <span className="text-base font-normal text-gray-500">/mês</span>
            </div>
            
            {plan.yearly_price && yearlySavings > 0 && (
              <div className="text-sm text-green-600">
                <span className="font-semibold">{formatPrice(plan.yearly_price)}/ano</span>
                <br />
                <span className="text-xs">Economize {formatPrice(yearlySavings)} por ano</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quotas */}
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-blue-500" />
            <span>{plan.consulting_hours_quota}h de consultoria/mês</span>
          </div>
          
          <div className="flex items-center text-sm">
            <FileText className="h-4 w-4 mr-2 text-purple-500" />
            <span>{plan.document_review_quota} análises de documentos/mês</span>
          </div>
          
          <div className="flex items-center text-sm">
            <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
            <span>{plan.legal_questions_quota} perguntas jurídicas/mês</span>
          </div>
          
          {plan.litigation_discount_percentage > 0 && (
            <div className="flex items-center text-sm">
              <Percent className="h-4 w-4 mr-2 text-red-500" />
              <span className="font-semibold text-red-600">
                {plan.litigation_discount_percentage}% desconto em litígios
              </span>
            </div>
          )}
        </div>

        {/* Features */}
        {plan.features && Object.keys(plan.features).length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-semibold text-sm text-gray-700">Recursos Inclusos:</h4>
            <div className="space-y-2">
              {Object.entries(plan.features).map(([key, value]) => {
                if (value === true) {
                  const featureNames: Record<string, string> = {
                    compliance_alerts: 'Alertas de Compliance',
                    basic_templates: 'Templates Básicos',
                    premium_templates: 'Templates Premium',
                    email_support: 'Suporte por Email',
                    priority_support: 'Suporte Prioritário',
                    monthly_reports: 'Relatórios Mensais',
                    contract_templates: 'Templates de Contratos',
                    basic_compliance: 'Compliance Básico',
                    advanced_templates: 'Templates Avançados',
                    compliance_monitoring: 'Monitoramento de Compliance',
                    legal_updates: 'Atualizações Jurídicas',
                    full_legal_support: 'Suporte Jurídico Completo',
                    dedicated_lawyer: 'Advogado Dedicado',
                    '24h_support': 'Suporte 24h',
                    custom_contracts: 'Contratos Personalizados',
                    litigation_support: 'Suporte em Litígios'
                  };
                  
                  return (
                    <div key={key} className="flex items-center text-sm">
                      <Check className="h-3 w-3 mr-2 text-green-500" />
                      <span>{featureNames[key] || key}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* Action Button */}
        {onSelectPlan && !isCurrentPlan && (
          <div className="pt-4">
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={() => onSelectPlan(plan.id)}
            >
              Escolher este Plano
            </Button>
          </div>
        )}

        {isCurrentPlan && (
          <div className="pt-4">
            <Button variant="outline" className="w-full" disabled>
              Plano Ativo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionPlanCard;