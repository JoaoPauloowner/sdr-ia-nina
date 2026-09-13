import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabaseForTesting } from '../src/database/supabase.js';
import { knowledgeService } from '../src/services/knowledgeService.js';

describe('Base de Conhecimento RAG de Cases (knowledgeService)', () => {
  beforeEach(() => {
    resetDatabaseForTesting();
  });

  it('deve buscar case relevante pelo nicho ou segmento do lead', async () => {
    const caseSaude = await knowledgeService.getCaseBySegment('saúde e estética');
    expect(caseSaude).not.toBeNull();
    expect(caseSaude?.segmento).toBe('saude');
    expect(caseSaude?.metrica_chave).toContain('70%');
  });

  it('deve retornar case padrão ou similar quando segmento for genérico', async () => {
    const caseGenerico = await knowledgeService.getCaseBySegment('consultoria');
    expect(caseGenerico).not.toBeNull();
  });

  it('deve formatar o case para citação natural na mensagem da Nina', async () => {
    const snippet = await knowledgeService.getFormattedCaseSnippet('b2b_saas');
    expect(snippet).toContain('TechFlow');
  });
});
