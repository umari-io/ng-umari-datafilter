import { UdfAggregable } from './udf-aggregable';
import { UdfFilterable } from './udf-filterable';

/**
 * Objeto usado como body no request umari-datafilter, contendo:
 * 
 * - filterable?: UdfFilterable (filtro a ser usado)
 * - aggregables?: UdfAggregable[] (agregações a serem feitas)
 * 
 */
export class UdfRequest {
  /** Informação do filtro que será usado em uma consulta */
  filterable?: UdfFilterable;
  /** Informação das agregações que devem ser feitas em uma consulta */
  aggregables?: UdfAggregable[];
}
