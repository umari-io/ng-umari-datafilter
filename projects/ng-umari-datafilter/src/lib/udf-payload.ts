import { UdfAggregable } from './udf-aggregable';
import { UdfFilterable } from './filter/udf-filterable';

/**
 * Payload usado como body no request de load do UdfStore, ou na
 * chamada de um endpoint findAll() do pacore Udf, contendo:
 * 
 * - filterable?: UdfFilterable (filtro que será usado)
 * - aggregables?: UdfAggregable[] (agregações que devem ser feitas)
 * 
 */
export class UdfPayload {
  /** Informação do filtro que será usado em uma consulta */
  filterable?: UdfFilterable;
  /** Informação das agregações que devem ser feitas em uma consulta */
  aggregables?: UdfAggregable[];
}
