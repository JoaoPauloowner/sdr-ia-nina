import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabaseForTesting } from '../src/database/supabase.js';

describe('Adaptador de Banco de Dados (Supabase / In-Memory)', () => {
  let db = resetDatabaseForTesting();

  beforeEach(() => {
    db = resetDatabaseForTesting();
  });

  it('deve inserir e buscar um lead por ID e por Telefone', async () => {
    const lead = await db.leads.insert({
      nome: 'Carlos Silva',
      telefone: '+5511988887777',
      empresa: 'Silva Imóveis',
      setor: 'imobiliario'
    });

    expect(lead.id).toBeDefined();
    expect(lead.nome).toBe('Carlos Silva');

    const buscadoPorId = await db.leads.getById(lead.id);
    expect(buscadoPorId).not.toBeNull();
    expect(buscadoPorId?.empresa).toBe('Silva Imóveis');

    const buscadoPorTelefone = await db.leads.getByPhone('+5511988887777');
    expect(buscadoPorTelefone?.id).toBe(lead.id);
  });

  it('deve atualizar o status de um lead corretamente', async () => {
    const lead = await db.leads.insert({
      nome: 'Mariana Costa',
      telefone: '+5521977776666',
      status: 'agendado'
    });

    const atualizado = await db.leads.update(lead.id, { status: 'confirmado' });
    expect(atualizado?.status).toBe('confirmado');
  });

  it('deve retornar cases de sucesso padrão pelo segmento do lead', async () => {
    const caseImob = await db.cases.getBySegment('imobiliario');
    expect(caseImob).not.toBeNull();
    expect(caseImob?.nome_cliente).toBe('Imob Prime');

    const caseSaude = await db.cases.getBySegment('saude');
    expect(caseSaude).not.toBeNull();
    expect(caseSaude?.metrica_chave).toContain('70%');
  });

  it('deve registrar e listar interações do lead', async () => {
    const lead = await db.leads.insert({
      nome: 'Teste Interação',
      telefone: '+5531999990000'
    });

    await db.interacoes.insert({
      lead_id: lead.id,
      direcao: 'saida',
      canal: 'whatsapp',
      conteudo: 'Olá Teste, sua reunião está confirmada!'
    });

    const interacoes = await db.interacoes.listByLeadId(lead.id);
    expect(interacoes.length).toBe(1);
    expect(interacoes[0].conteudo).toContain('sua reunião está confirmada');
  });
});
