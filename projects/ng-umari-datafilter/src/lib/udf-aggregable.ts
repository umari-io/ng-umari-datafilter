/**
 * Informação das agregações à serem feitas, oriundo do LoadOptions (parâmetro do load de um UdfStore)
 * 
 * - selector: string (coluna de agregação)
 * - operation: 'count' | 'sum' | 'max' | 'min' | 'avg' (operador de agregação)
 * 
 */
export class UdfAggregable {
  /** Coluna de agregação da Entidade de trabalho */
  selector: string;
  /** Operação de agregação à ser desempenhada na coluna da Entidade de trabalho  */
  operation: 'count' | 'sum' | 'max' | 'min' | 'avg';
}
