
import React, { Fragment } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Download, Layers } from "lucide-react";
import { Lead } from '@/types';
import { PipelineStage } from '@/types/pipeline';
import { usePipelines } from '@/hooks/usePipelines';

interface BulkActionsBarProps {
  selectedLeads: string[];
  leads: Lead[];
  onDeleteSelected: () => void;
  onUpdateStage: (stage: PipelineStage) => void;
  onExportCSV: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedLeads,
  leads,
  onDeleteSelected,
  onUpdateStage,
  onExportCSV
}) => {
  const { pipelines } = usePipelines();

  if (selectedLeads.length === 0) return null;

  return (
    <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex flex-wrap items-center justify-between gap-4">
      <span className="text-sm font-medium">
        {selectedLeads.length} lead(s) selecionado(s)
      </span>
      <div className="flex flex-wrap gap-2 items-center">
        <Select
          onValueChange={(stageId) => {
            const stage = pipelines.flatMap(p => p.stages || []).find(s => s.id === stageId);
            if (stage) onUpdateStage(stage);
          }}
        >
          <SelectTrigger className="h-9 w-52">
            <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Mover para etapa..." />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((pipeline) => (
              <Fragment key={pipeline.id}>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b bg-muted/40">
                  {pipeline.name}
                </div>
                {(pipeline.stages || []).map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                      {stage.name}
                    </div>
                  </SelectItem>
                ))}
              </Fragment>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={onExportCSV}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteSelected}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsBar;
