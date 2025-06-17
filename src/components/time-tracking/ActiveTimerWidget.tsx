import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Square, Pause, Play, Edit3 } from 'lucide-react';
import { TimerSession, timeTrackingService } from '@/services/timeTrackingService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ActiveTimerWidgetProps {
  timer: TimerSession;
  onStop: (description?: string) => Promise<void>;
}

export function ActiveTimerWidget({ timer, onStop }: ActiveTimerWidgetProps) {
  const [currentElapsed, setCurrentElapsed] = useState(timer.elapsed_minutes);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [finalDescription, setFinalDescription] = useState(timer.description);
  const [stopping, setStopping] = useState(false);

  // Update elapsed time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const startedAt = new Date(timer.started_at);
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60));
      setCurrentElapsed(elapsed);
    }, 60000);

    return () => clearInterval(interval);
  }, [timer.started_at]);

  const handleStop = async () => {
    setStopping(true);
    try {
      await onStop(finalDescription);
      setShowStopDialog(false);
    } catch (error) {
      console.error('Error stopping timer:', error);
    } finally {
      setStopping(false);
    }
  };

  const formatElapsedTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const estimatedAmount = (currentElapsed / 60) * timer.hourly_rate;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Timer Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full">
                <Clock className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Timer Ativo
                </h3>
                <p className="text-sm text-blue-700">
                  Iniciado às {new Date(timer.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-900">
                {formatElapsedTime(currentElapsed)}
              </div>
              <div className="text-sm text-blue-700">
                {timeTrackingService.formatCurrency(estimatedAmount)}
              </div>
            </div>
          </div>

          {/* Timer Details */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                {timeTrackingService.getTaskTypes().find(t => t.value === timer.task_type)?.label || timer.task_type}
              </Badge>
              {timer.client && (
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  {timer.client.company_name}
                </Badge>
              )}
              {timer.case && (
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  {timer.case.case_number}
                </Badge>
              )}
            </div>

            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                {timer.description}
              </p>
            </div>

            <div className="flex items-center justify-between text-sm text-blue-700">
              <span>Valor por hora: {timeTrackingService.formatCurrency(timer.hourly_rate)}</span>
              <span>Tempo decorrido: {formatElapsedTime(currentElapsed)}</span>
            </div>
          </div>

          {/* Timer Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-blue-200">
            <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
              <DialogTrigger asChild>
                <Button variant="default" className="bg-red-500 hover:bg-red-600">
                  <Square className="h-4 w-4 mr-2" />
                  Parar Timer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Finalizar Registro de Tempo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Tempo decorrido:</span>
                      <span className="text-lg font-bold">{formatElapsedTime(currentElapsed)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Valor estimado:</span>
                      <span className="text-lg font-bold text-green-600">
                        {timeTrackingService.formatCurrency(estimatedAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Descrição Final (opcional - edite se necessário):
                    </label>
                    <Textarea
                      value={finalDescription}
                      onChange={(e) => setFinalDescription(e.target.value)}
                      placeholder="Descreva as atividades realizadas..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowStopDialog(false)}
                      disabled={stopping}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleStop}
                      disabled={stopping}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {stopping ? 'Parando...' : 'Finalizar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}