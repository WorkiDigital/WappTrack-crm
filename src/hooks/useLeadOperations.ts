import { useState } from 'react';
import { Lead, Campaign } from '@/types';
import { PipelineStage } from '@/types/pipeline';
import { addLead, updateLead, deleteLead } from '@/services/dataService';
import { formatBrazilianPhone, processBrazilianPhone, validateBrazilianPhone } from '@/lib/phoneUtils';
import { correctPhoneNumber, shouldCorrectPhone } from '@/lib/phoneCorrection';
import { useAutoSaleCreation } from './useAutoSaleCreation';
import { toast } from "sonner";

export const useLeadOperations = (leads: Lead[], setLeads: React.Dispatch<React.SetStateAction<Lead[]>>) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [currentLead, setCurrentLead] = useState<Partial<Lead>>({
    name: '',
    phone: '',
    campaign: '',
    status: 'new',
    notes: '',
    first_contact_date: '',
    last_contact_date: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: ''
  });

  // 🆕 HOOK PARA CRIAÇÃO AUTOMÁTICA DE VENDAS
  const { createSaleFromConvertedLead, isCreating: isCreatingSale } = useAutoSaleCreation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentLead({ ...currentLead, [name]: value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatBrazilianPhone(value);
    setCurrentLead({ ...currentLead, phone: formatted });
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentLead({ ...currentLead, [name]: value });
  };

  const handlePipelineStageChange = (stage: PipelineStage) => {
    setCurrentLead(prev => ({
      ...prev,
      pipeline_stage_id: stage.id,
      pipeline_id: stage.pipeline_id,
      status: stage.maps_to_status as Lead['status'],
    }));
  };

  const handleOpenAddDialog = () => {
    setCurrentLead({
      name: '',
      phone: '',
      campaign: '',
      status: 'new',
      notes: '',
      first_contact_date: '',
      last_contact_date: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: ''
    });
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (lead: Lead) => {
    let displayPhone = lead.phone;
    if (lead.phone.startsWith('55')) {
      const phoneWithoutCountryCode = lead.phone.slice(2);
      displayPhone = formatBrazilianPhone(phoneWithoutCountryCode);
    }
    
    setCurrentLead({
      ...lead,
      phone: displayPhone,
      utm_source: lead.utm_source || '',
      utm_medium: lead.utm_medium || '',
      utm_campaign: lead.utm_campaign || '',
      utm_content: lead.utm_content || '',
      utm_term: lead.utm_term || ''
    });
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const handleOpenViewDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailDialogOpen(true);
  };

  const handleSaveFromDetailDialog = async (updatedData: Partial<Lead>) => {
    if (!selectedLead) return;

    try {
      // 🆕 VERIFICAR SE STATUS MUDOU PARA CONVERTIDO
      const wasConverted = selectedLead.status !== 'converted' && updatedData.status === 'converted';
      
      console.log('💾 handleSaveFromDetailDialog - Verificando conversão:', {
        originalStatus: selectedLead.status,
        newStatus: updatedData.status,
        wasConverted
      });

      const updatedLead = await updateLead(selectedLead.id, updatedData);
      setLeads(leads.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
      setSelectedLead(updatedLead);
      toast.success('Lead atualizado com sucesso');

      // 🆕 CRIAR VENDA AUTOMÁTICA SE FOI CONVERTIDO
      if (wasConverted) {
        console.log('🎯 handleSaveFromDetailDialog - Lead convertido, criando venda...');
        try {
          await createSaleFromConvertedLead(updatedLead);
        } catch (saleError) {
          console.error('❌ handleSaveFromDetailDialog - Erro ao criar venda automática:', saleError);
        }
      }

    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Erro ao atualizar lead');
    }
  };

  const handleSaveLead = async () => {
    try {
      if (!currentLead.name || !currentLead.phone || !currentLead.campaign || !currentLead.pipeline_stage_id) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      if (!validateBrazilianPhone(currentLead.phone)) {
        toast.error('Por favor, informe um número válido (DDD + 8 ou 9 dígitos)');
        return;
      }

      let updatedLead: Lead;
      const wasConverted = currentLead.status === 'converted';

      console.log('💾 handleSaveLead - Dados do lead:', {
        mode: dialogMode,
        leadId: currentLead.id,
        currentStatus: currentLead.status,
        wasConverted
      });

      let processedPhone = processBrazilianPhone(currentLead.phone);

      const leadToSave = { ...currentLead, phone: processedPhone };

      if (dialogMode === 'add') {
        console.log('➕ handleSaveLead - Adicionando novo lead...');
        const newLead = await addLead(leadToSave as Omit<Lead, 'id' | 'created_at'>);
        setLeads([newLead, ...leads]);
        updatedLead = newLead;
        toast.success('Lead adicionado com sucesso');

        // 🆕 VERIFICAR SE NOVO LEAD JÁ FOI CRIADO COMO CONVERTIDO
        if (wasConverted) {
          console.log('🎯 handleSaveLead - Novo lead criado como convertido, criando venda...');
          try {
            await createSaleFromConvertedLead(updatedLead);
          } catch (saleError) {
            console.error('❌ handleSaveLead - Erro ao criar venda para novo lead convertido:', saleError);
          }
        }
      } else {
        if (!currentLead.id) {
          console.error('❌ handleSaveLead - ID do lead não encontrado para edição');
          return;
        }
        
        const originalLead = leads.find(lead => lead.id === currentLead.id);
        const statusChangedToConverted = originalLead?.status !== 'converted' && currentLead.status === 'converted';
        
        console.log('📝 handleSaveLead - Editando lead existente:', {
          leadId: currentLead.id,
          originalStatus: originalLead?.status,
          newStatus: currentLead.status,
          statusChangedToConverted
        });
        
        updatedLead = await updateLead(currentLead.id, leadToSave);
        setLeads(leads.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
        toast.success('Lead atualizado com sucesso');
        
        // 🆕 VERIFICAR SE STATUS MUDOU PARA CONVERTIDO
        if (statusChangedToConverted) {
          console.log('🎯 handleSaveLead - Status mudou para convertido, criando venda...');
          try {
            await createSaleFromConvertedLead(updatedLead);
          } catch (saleError) {
            console.error('❌ handleSaveLead - Erro ao criar venda após conversão:', saleError);
          }
        } else {
          console.log('⏭️ handleSaveLead - Status não mudou para convertido, pulando criação de venda');
        }
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('❌ handleSaveLead - Erro geral ao salvar lead:', error);
      toast.error('Erro ao salvar lead');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este lead?')) {
      return;
    }

    try {
      await deleteLead(id);
      setLeads(leads.filter(lead => lead.id !== id));
      toast.success('Lead excluído com sucesso');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao excluir lead');
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(lead => lead.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLeads.length === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir ${selectedLeads.length} lead(s) selecionado(s)?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Excluir todos os leads selecionados
      await Promise.all(selectedLeads.map(id => deleteLead(id)));
      
      // Atualizar a lista removendo os leads excluídos
      setLeads(leads.filter(lead => !selectedLeads.includes(lead.id)));
      
      // Limpar seleção
      setSelectedLeads([]);
      
      toast.success(`${selectedLeads.length} lead(s) excluído(s) com sucesso`);
    } catch (error) {
      console.error('Error deleting selected leads:', error);
      toast.error('Erro ao excluir leads selecionados');
    }
  };

  const openWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    isDetailDialogOpen,
    setIsDetailDialogOpen,
    dialogMode,
    currentLead,
    selectedLead,
    selectedLeads,
    setSelectedLeads, // Expose setter for bulk operations
    handleInputChange,
    handlePhoneChange,
    handleSelectChange,
    handlePipelineStageChange,
    handleOpenAddDialog,
    handleOpenEditDialog,
    handleOpenViewDialog,
    handleSaveLead,
    handleSaveFromDetailDialog,
    handleDeleteLead,
    handleSelectLead,
    handleSelectAll,
    handleDeleteSelected,
    openWhatsApp,
    isCreatingSale // 🆕 EXPOR STATUS DE CRIAÇÃO DE VENDA
  };
};
