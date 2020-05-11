import { UdfExpression } from '../predicate/udf-expression';

/**
 * Expressão do filtro usada para fazer o request à um endpoint
 * findAll() do pacote Udf, podendo ela ser simples ou complexa
 */
export class UdfFilterable extends UdfExpression {
  predicates: UdfExpression[] = [];
}
