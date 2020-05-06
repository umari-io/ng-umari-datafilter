import { UdfAggregation } from './udf-aggregation';
import { Page } from './page';

/**
 * Objeto de retorno de um request à um endpoint findAll() do pacote Udf, contendo: 
 * 
 * - pagination: Page<T> (página requisitada)
 * - aggregations?: UdfAggregation[] (resultado das agregações requisitadas)
 * 
 */
export class UdfPage<T> {
  /** Objeto padrão de paginação */
  pagination: Page<T>;
  /** Objeto com o resultado das agregações requisitadas à um endpoint findAll() do pacote Udf */
  aggregations?: UdfAggregation[];
}
