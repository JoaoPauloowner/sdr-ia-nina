import { getDatabase } from '../database/supabase.js';
import { CaseSucesso } from '../types/index.js';

export class KnowledgeService {
  async getCaseBySegment(segment?: string): Promise<CaseSucesso | null> {
    const db = getDatabase();
    if (!segment) {
      const all = await db.cases.listAll();
      return all[0] || null;
    }
    return db.cases.getBySegment(segment);
  }

  async getFormattedCaseSnippet(segment?: string): Promise<string> {
    const caseData = await this.getCaseBySegment(segment);
    if (!caseData) return '';
    return `Inclusive, no seu segmento, ajudamos a ${caseData.nome_cliente} a alcançar: ${caseData.metrica_chave}. ${caseData.resumo_case}`;
  }

  async listAll(): Promise<CaseSucesso[]> {
    const db = getDatabase();
    return db.cases.listAll();
  }

  async addCase(data: Partial<CaseSucesso>): Promise<CaseSucesso> {
    const db = getDatabase();
    return db.cases.insert(data);
  }
}

export const knowledgeService = new KnowledgeService();
