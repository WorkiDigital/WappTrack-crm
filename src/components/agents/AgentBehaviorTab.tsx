import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AgentWithRelations } from '@/types/agent';
import { agentService } from '@/services/agentService';
import { toast } from "sonner";
import { Save } from 'lucide-react';

interface AgentBehaviorTabProps {
    agent: AgentWithRelations;
    onUpdate: () => void;
}

export const AgentBehaviorTab = ({ agent, onUpdate }: AgentBehaviorTabProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: agent.name || '',
        persona_name: agent.persona_name || '',
        function: agent.function || '',
        behavior_rules: agent.behavior_rules || '',
    });

    // Sincronizar o formulário quando o agente muda
    useEffect(() => {
        setFormData({
            name: agent.name || '',
            persona_name: agent.persona_name || '',
            function: agent.function || '',
            behavior_rules: agent.behavior_rules || '',
        });
    }, [agent.id, agent.name, agent.persona_name, agent.function, agent.behavior_rules]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await agentService.updateAgent(agent.id, formData);
            toast.success('Agente atualizado com sucesso');
            onUpdate();
        } catch (error: any) {
            console.error('Error updating agent:', error);
            toast.error(error?.message || 'Erro ao atualizar agente');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle>Comportamento do Agente</CardTitle>
                    <CardDescription>Defina a identidade e as regras de atuação do seu agente.</CardDescription>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="agent-name">Nome do Agente (Interno)</Label>
                    <Input
                        id="agent-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: SDR Atendimento"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="persona-name">Nome da Persona (Como ele se apresenta)</Label>
                    <Input
                        id="persona-name"
                        value={formData.persona_name}
                        onChange={(e) => setFormData({ ...formData, persona_name: e.target.value })}
                        placeholder="Ex: Bryan"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="function">Função Principal</Label>
                    <Textarea
                        id="function"
                        value={formData.function}
                        onChange={(e) => setFormData({ ...formData, function: e.target.value })}
                        placeholder="Ex: Qualificar leads e agendar reuniões de consultoria."
                        className="min-h-[80px]"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="behavior-rules">Diretrizes de Comportamento</Label>
                    <Textarea
                        id="behavior-rules"
                        value={formData.behavior_rules}
                        onChange={(e) => setFormData({ ...formData, behavior_rules: e.target.value })}
                        placeholder="Ex: Sempre seja cordial. Use emojis moderadamente. Se o lead perguntar sobre preços, diga que o consultor explicará na reunião."
                        className="min-h-[150px]"
                    />
                </div>
            </CardContent>
        </Card>
    );
};
