/**
 * Message Encryption Manager Component
 * 
 * Admin utility for managing message encryption migration and status
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Info,
  Play,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { migrateExistingMessages, checkMigrationStatus, testEncryption } from '@/services/messageMigrationService';

interface MigrationStatus {
  total: number;
  encrypted: number;
  unencrypted: number;
  encryptionPercentage: number;
}

const MessageEncryptionManager: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    total: 0,
    encrypted: 0,
    unencrypted: 0,
    encryptionPercentage: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    migratedCount: number;
    errors: string[];
  } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadMigrationStatus();
  }, []);

  const loadMigrationStatus = async () => {
    try {
      setIsLoading(true);
      const status = await checkMigrationStatus();
      setMigrationStatus(status);
    } catch (error) {
      console.error('Error loading migration status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar status da criptografia',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEncryption = async () => {
    try {
      setIsLoading(true);
      const success = await testEncryption();
      
      if (success) {
        toast({
          title: 'Teste bem-sucedido',
          description: 'Sistema de criptografia funcionando corretamente'
        });
      } else {
        toast({
          title: 'Teste falhou',
          description: 'Problema com o sistema de criptografia',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro no teste',
        description: 'Erro ao testar criptografia',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigration = async () => {
    if (migrationStatus.unencrypted === 0) {
      toast({
        title: 'Migração desnecessária',
        description: 'Todas as mensagens já estão criptografadas'
      });
      return;
    }

    const confirmed = window.confirm(
      `Deseja criptografar ${migrationStatus.unencrypted} mensagens não criptografadas? Esta operação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      setIsMigrating(true);
      setMigrationResult(null);
      
      const result = await migrateExistingMessages();
      setMigrationResult(result);
      
      if (result.success) {
        toast({
          title: 'Migração concluída',
          description: `${result.migratedCount} mensagens criptografadas com sucesso`
        });
        // Refresh status
        await loadMigrationStatus();
      } else {
        toast({
          title: 'Migração com problemas',
          description: `${result.migratedCount} mensagens migradas, ${result.errors.length} erros`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro na migração',
        description: 'Erro durante a migração das mensagens',
        variant: 'destructive'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const getSecurityStatus = () => {
    if (migrationStatus.encryptionPercentage === 100) {
      return { level: 'secure', color: 'text-green-600', icon: CheckCircle };
    } else if (migrationStatus.encryptionPercentage >= 80) {
      return { level: 'mostly-secure', color: 'text-yellow-600', icon: AlertCircle };
    } else {
      return { level: 'needs-attention', color: 'text-red-600', icon: AlertCircle };
    }
  };

  const securityStatus = getSecurityStatus();
  const StatusIcon = securityStatus.icon;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>Criptografia de Mensagens Legais</CardTitle>
          </div>
          <CardDescription>
            Sistema de criptografia para confidencialidade advogado-cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-6 w-6 ${securityStatus.color}`} />
              <div>
                <h3 className="font-medium">Status de Segurança</h3>
                <p className="text-sm text-gray-600">
                  {migrationStatus.encrypted} de {migrationStatus.total} mensagens criptografadas
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge 
                variant={migrationStatus.encryptionPercentage === 100 ? 'default' : 'secondary'}
                className="text-lg px-3 py-1"
              >
                {migrationStatus.encryptionPercentage}%
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso da Criptografia</span>
              <span>{migrationStatus.encrypted}/{migrationStatus.total}</span>
            </div>
            <Progress value={migrationStatus.encryptionPercentage} className="w-full" />
          </div>

          {/* Migration Status Alert */}
          {migrationStatus.unencrypted > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{migrationStatus.unencrypted} mensagens</strong> ainda não estão criptografadas e 
                precisam ser migradas para garantir a confidencialidade legal.
              </AlertDescription>
            </Alert>
          )}

          {migrationStatus.encryptionPercentage === 100 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                🎉 <strong>Todas as mensagens estão criptografadas!</strong> Sua comunicação legal 
                está totalmente protegida.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={loadMigrationStatus} disabled={isLoading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar Status
            </Button>
            
            <Button onClick={handleTestEncryption} disabled={isLoading} variant="outline">
              <Info className="h-4 w-4 mr-2" />
              Testar Criptografia
            </Button>

            {migrationStatus.unencrypted > 0 && (
              <Button 
                onClick={handleMigration} 
                disabled={isMigrating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Lock className={`h-4 w-4 mr-2 ${isMigrating ? 'animate-pulse' : ''}`} />
                {isMigrating ? 'Criptografando...' : `Criptografar ${migrationStatus.unencrypted} Mensagens`}
              </Button>
            )}
          </div>

          {/* Migration Results */}
          {migrationResult && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Resultado da Migração</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Mensagens migradas:</span>
                    <Badge variant="outline">{migrationResult.migratedCount}</Badge>
                  </div>
                  {migrationResult.errors.length > 0 && (
                    <div>
                      <span className="text-red-600">Erros ({migrationResult.errors.length}):</span>
                      <ul className="list-disc list-inside text-xs text-gray-600 mt-1 max-h-20 overflow-y-auto">
                        {migrationResult.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {migrationResult.errors.length > 5 && (
                          <li>... e mais {migrationResult.errors.length - 5} erros</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Sobre a Criptografia</p>
                  <p>
                    As mensagens são criptografadas usando AES-256-GCM para garantir a 
                    confidencialidade advogado-cliente e conformidade com normas de proteção de dados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageEncryptionManager;