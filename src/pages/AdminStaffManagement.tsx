
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, UserCheck } from 'lucide-react';
import PermissionManager from '@/components/admin/PermissionManager';
import StaffClientAssignments from '@/components/admin/StaffClientAssignments';
import AdminPermissionGuard from '@/components/admin/AdminPermissionGuard';

const AdminStaffManagement = () => {
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
