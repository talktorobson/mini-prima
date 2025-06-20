
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, UserCheck, Search, User, Settings } from 'lucide-react';
import PermissionManager from '@/components/admin/PermissionManager';
import StaffClientAssignments from '@/components/admin/StaffClientAssignments';
import AdminPermissionGuard from '@/components/admin/AdminPermissionGuard';
import { staffManagementService, StaffSearchResult } from '@/services/staffManagementService';
import { useToast } from '@/hooks/use-toast';

const AdminStaffManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StaffSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      
      // Use the real search functionality from the service
      const results = await staffManagementService.searchStaffManagementData(term, {
        limit: 15
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching staff management:', error);
      setSearchResults([]);
      toast({
        title: 'Erro na busca',
        description: 'Erro ao pesquisar dados da equipe. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestão da Equipe</h1>
                <p className="text-sm text-gray-600">Gerencie permissões e atribuições da equipe</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <AdminPermissionGuard requiredPermission="system_setup">
          {/* Smart Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Busca Inteligente
              </CardTitle>
              <CardDescription>
                Pesquise rapidamente em funcionários, permissões e atribuições
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="search-input" className="sr-only">
                    Termo de pesquisa
                  </Label>
                  <Input
                    id="search-input"
                    placeholder="Digite para buscar funcionários, permissões ou atribuições..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full"
                    disabled={isSearching}
                  />
                </div>
                {searchTerm && (
                  <Button variant="outline" onClick={clearSearch}>
                    Limpar
                  </Button>
                )}
              </div>
              
              {/* Loading State */}
              {isSearching && (
                <div className="mt-4 text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Pesquisando...</p>
                </div>
              )}

              {/* Search Results */}
              {!isSearching && searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Resultados ({searchResults.length})
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer border"
                        onClick={() => {
                          // In a real implementation, this would navigate to the specific record
                          console.log('Navigate to:', result);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            result.type === 'staff_member' ? 'bg-blue-100' :
                            result.type === 'permission' ? 'bg-green-100' :
                            result.type === 'assignment' ? 'bg-purple-100' :
                            'bg-orange-100'
                          }`}>
                            {result.type === 'staff_member' ? (
                              <User className="w-4 h-4 text-blue-600" />
                            ) : result.type === 'permission' ? (
                              <Shield className="w-4 h-4 text-green-600" />
                            ) : result.type === 'assignment' ? (
                              <UserCheck className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Settings className="w-4 h-4 text-orange-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {result.title}
                            </p>
                            <p className="text-xs text-gray-600">
                              {result.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            result.status === 'active' ? 'default' :
                            result.status === 'enabled' ? 'default' :
                            result.status === 'assigned' ? 'secondary' : 'outline'
                          } className="text-xs">
                            {result.status === 'active' ? 'Ativo' :
                             result.status === 'enabled' ? 'Habilitado' :
                             result.status === 'assigned' ? 'Atribuído' : result.status}
                          </Badge>
                          {result.permissions.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-500">
                                {result.permissions.length} permiss{result.permissions.length === 1 ? 'ão' : 'ões'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!isSearching && searchTerm && searchResults.length === 0 && (
                <div className="mt-4 text-center py-6 text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum resultado encontrado para "{searchTerm}"</p>
                  <p className="text-xs">Tente palavras-chave diferentes</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="permissions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissões de Acesso
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Atribuições Cliente-Funcionário
              </TabsTrigger>
            </TabsList>

            <TabsContent value="permissions">
              <PermissionManager />
            </TabsContent>

            <TabsContent value="assignments">
              <StaffClientAssignments />
            </TabsContent>
          </Tabs>
        </AdminPermissionGuard>
      </main>
    </div>
  );
};

export default AdminStaffManagement;
