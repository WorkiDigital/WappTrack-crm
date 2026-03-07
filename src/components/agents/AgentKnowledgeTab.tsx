import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, BookOpen, Plus, Trash2, Link as LinkIcon, Unlink } from 'lucide-react';
import { AgentWithRelations, KnowledgeBase } from '@/types/agent';
import { agentService } from '@/services/agentService';
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from '@/integrations/supabase/client';

interface AgentKnowledgeTabProps {
    agent: AgentWithRelations;
    onUpdate: () => void;
}

export const AgentKnowledgeTab = ({ agent, onUpdate }: AgentKnowledgeTabProps) => {
    const [allKBs, setAllKBs] = useState<KnowledgeBase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newKB, setNewKB] = useState({ name: '', content: '' });
    const [isAdding, setIsAdding] = useState(false);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const kbs = await agentService.getKnowledgeBases();
            setAllKBs(kbs as KnowledgeBase[]);
        } catch (error) {
            toast.error('Erro ao carregar bases de conhecimento');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Limpar os campos quando o agente muda
    useEffect(() => {
        setNewKB({ name: '', content: '' });
        setIsAdding(false);
    }, [agent.id]);

    const handleCreateKB = async () => {
        if (!newKB.name || !newKB.content) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            // Use a placeholder if user is not found, to allow public saving
            const userId = user?.id || '00000000-0000-0000-0000-000000000000';

            const created = await agentService.createKnowledgeBase({
                name: newKB.name,
                content: newKB.content,
                user_id: userId
            });
            await agentService.linkKnowledgeBase(agent.id, created.id);
            toast.success('Base de conhecimento criada e vinculada');
            setNewKB({ name: '', content: '' });
            setIsAdding(false);
            fetchData();
            onUpdate();
        } catch (error) {
            toast.error('Erro ao criar base');
        }
    };

    const handleToggleLink = async (kbId: string, isLinked: boolean) => {
        try {
            if (isLinked) {
                await agentService.unlinkKnowledgeBase(agent.id, kbId);
                toast.info('Vínculo removido');
            } else {
                await agentService.linkKnowledgeBase(agent.id, kbId);
                toast.success('Vínculo estabelecido');
            }
            onUpdate();
        } catch (error) {
            toast.error('Erro ao alterar vínculo');
        }
    };

    const handleDeleteKB = async (id: string) => {
        if (!confirm('Tem certeza? Isso removerá esta base de conhecimento para TODOS os agentes.')) return;
        try {
            await agentService.deleteKnowledgeBase(id);
            toast.success('Base apagada');
            fetchData();
            onUpdate();
        } catch (error) {
            toast.error('Erro ao apagar base');
        }
    };

    // Helper to check if a KB is linked to the current agent
    const isKBLinked = (kbId: string) => {
        return agent.agent_knowledge_bases?.some(akb => akb.knowledge_base_id === kbId);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" /> Bibliotecas de Conhecimento
                        </CardTitle>
                        <CardDescription>Gerencie documentos e informações compartilhadas entre seus agentes.</CardDescription>
                    </div>
                    <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "ghost" : "outline"} size="sm">
                        {isAdding ? "Cancelar" : <><Plus className="mr-2 h-4 w-4" /> Nova Biblioteca</>}
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {isAdding && (
                            <div className="grid gap-4 p-4 border rounded-xl bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-top-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="kbname">Nome da Biblioteca</Label>
                                    <Input
                                        id="kbname"
                                        placeholder="Ex: Tabela de Preços 2024"
                                        value={newKB.name}
                                        onChange={(e) => setNewKB({ ...newKB, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="kbcontent">Conteúdo / Texto</Label>
                                    <Textarea
                                        id="kbcontent"
                                        placeholder="Descreva aqui as informações..."
                                        className="min-h-[200px]"
                                        value={newKB.content}
                                        onChange={(e) => setNewKB({ ...newKB, content: e.target.value })}
                                    />
                                </div>
                                <Button onClick={handleCreateKB} className="w-fit ml-auto">Criar e Vincular</Button>
                            </div>
                        )}

                        <div className="grid gap-4">
                            {allKBs.map(kb => (
                                <div key={kb.id} className="flex flex-col gap-3 p-4 border rounded-xl bg-card hover:border-primary/30 transition-all shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <BookOpen className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold">{kb.name}</h4>
                                                <p className="text-xs text-muted-foreground">{kb.content.length} caracteres</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={isKBLinked(kb.id) ? "default" : "outline"}
                                                size="sm"
                                                className="h-8"
                                                onClick={() => handleToggleLink(kb.id, !!isKBLinked(kb.id))}
                                            >
                                                {isKBLinked(kb.id) ? (
                                                    <><LinkIcon className="mr-2 h-3 w-3" /> Vinculado</>
                                                ) : (
                                                    <><Unlink className="mr-2 h-3 w-3" /> Vincular</>
                                                )}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteKB(kb.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="px-2">
                                        <p className="text-sm text-muted-foreground line-clamp-2 italic bg-muted/30 p-2 rounded-md">
                                            "{kb.content.substring(0, 200)}..."
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {allKBs.length === 0 && !isAdding && (
                                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
                                    <p className="text-muted-foreground">Nenhuma biblioteca de conhecimento cadastrada.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
};
