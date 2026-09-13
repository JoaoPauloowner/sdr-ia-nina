import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabaseForTesting } from '../src/database/supabase.js';
import { leadService } from '../src/services/leadService.js';

describe('Serviço de Leads (leadService)', () => {
  beforeEach(() => {
    resetDatabaseForTesting();
  });

  it('deve registrar um novo lead vindo do formulário com DDD extraído', async () => {
    const lead = await leadService.registerLead({
      nome: 'Ana Beatriz',
      telefone: '11987654321',
      email: 'ana@empresa.com',
      empresa: 'Boutique Flor',
      setor: 'varejo'
    });

    expect(lead.id).toBeDefined();
    expect(lead.ddd).toBe('11');
    expect(lead.status).toBe('agendado');
  });

  it('deve registrar abandono de formulário quando lead não conclui agendamento', async () => {
    const lead = await leadService.registerAbandonment({
      nome: 'Roberto Dias',
      telefone: '2199887766'
    });

    expect(lead.status).toBe('abandonou_formulario');
  });

  it('deve atualizar status de confirmação e registrar se respondeu', async () => {
    const lead = await leadService.registerLead({
      nome: 'Carla Souza',
      telefone: '31988887777'
    });

    const atualizado = await leadService.markAsConfirmed(lead.id);
    expect(atualizado?.status).toBe('confirmado');
    expect(atualizado?.respondeu_ultima_mensagem).toBe(true);
  });
});
