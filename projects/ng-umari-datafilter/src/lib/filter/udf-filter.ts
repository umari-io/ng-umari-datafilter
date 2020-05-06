import * as _ from 'lodash';

import { UdfDisjunction } from './udf-disjunction';
import { UdfConjunction } from './udf-conjunction';
import { UdfFilterable } from './udf-filterable';
import { UdfPredicate } from './udf-predicate';

/**
 * Objeto de filtro
 * 
 * ---
 * Atributos
 * 
 * - dxFilter: any[] (filtro dx original)
 * - udfFilterable: UdfFilterable (filtro de uso em endpoints do pacote Udf)
 * 
 * ---
 * Métodos
 * 
 * - of(dxFilter: any[]): UdfFilter (conversão de um filtro dx em um UdfFilter
 * contendo o filtro original e o filterable parseado, pronto para uso em um
 * payload de um endpoint do pacote Udf)
 * 
 */
export class UdfFilter {
  udfFilterable: UdfFilterable;
  dxFilter: any[];

  /**
   * Constrói de maneira estática um UdfFilter a partir de um array de filtro do DevExtreme
   * 
   * @param dxFilter
   */
  static of(dxFilter: any[]): UdfFilter {
    let udfFilter = new UdfFilter();
    udfFilter.dxFilter = dxFilter;
    udfFilter.udfFilterable = parser4(parser3(parser2(parser1(dxFilter))));
    return udfFilter;
  }

  /**
   * Constrói um ou mais novos predicados
   * 
   * @param fields atributo ou lista de atributos para a comparação
   * @param comparisonOperator operação de comparação
   * @param values valor ou lista de valores para a comparação
   */
  static build(
    fields: string | string[],
    comparisonOperator: string,
    values: any | any[]
  ): any[] {
    if ([null, undefined, []].includes(values) && !['isblank', 'isnotblank'].includes(comparisonOperator)) return;
    fields = toAray(fields);
    values = toAray(values);
    checkOperator(comparisonOperator);
    return filterComparisonBuilder(fields, comparisonOperator, values);
  }

  /**
   * Adiciona à um filtro já existente um novo predicado
   * 
   * @param predicate predicado à ser adicionado
   * @param logicalOperator (default = 'and') operador lógico para união do filtro existente ao que está sendo adicionado
   */
  add(
    predicate: any[],
    logicalOperator: 'and' | 'or' = 'and'
  ): UdfFilter {
    if (!predicate) return this;
    this.dxFilter = filterLogicalBuilder(predicate, logicalOperator, this.dxFilter);
    this.udfFilterable = parser4(parser3(parser2(parser1(this.dxFilter))));
    return this;
  }
}

let inputComparisonOperators = ['=', '<>', '>', '>=', '<', '<=', 'contains', 'notcontains', 'isblank', 'isnotblank'];
let comparisonOperators = [['=', '<>', '>', '<', '>=', '<=', 'contains', 'notcontains', '@null', '@notnull'], ['<>', '=', '<=', '>=', '<', '>', 'notcontains', 'contains', '@notnull', '@null']];
let logicalOperators = [['and', 'or'], ['or', 'and']];
let isSimplePredicate = (p: UdfPredicate | any[]): boolean => { return p instanceof UdfPredicate; };
let hasAndOperator = (arr: any[]): boolean => { return _.includes(arr, 'and'); };
let isComparisonOperator = (op: string): boolean => { return !_.isEmpty(_.intersection([op], comparisonOperators[0])); };
let isLogicalOperator = (op: string): boolean => { return !_.isEmpty(_.intersection([op], logicalOperators[0])); };
let getComparisonOperator = (op: string, inverse: boolean = false): string => { return inverse ? comparisonOperators[1][comparisonOperators[0].indexOf(op)] : op; };
let getLogicalOperator = (op: string, inverse: boolean = false): string => { return inverse ? logicalOperators[1][logicalOperators[0].indexOf(op)] : op; };
let toAray = (x: any): any[] => { if (!(x instanceof Array)) return [x]; return x; }
let checkOperator = (operator: string) => { if (!inputComparisonOperators.includes(operator)) throw new Error(`${operator} não é um comparador válido.`); }

/**
 * Constrói um vetor de filtro a partir de uma lista de campos, um operador de comparação e uma lista de valores.
 * 
 * @param fields 
 * @param operator 
 * @param values 
 */
let filterComparisonBuilder = (
  fields: string[],
  operator: string,
  values: any[]
): any[] => {
  let newFilter: any[] = [];
  fields.forEach(field => {
    values.forEach(value => {
      newFilter.push([field, operator, value]);
      newFilter.push('or');
    });
  });
  newFilter.pop();
  return newFilter;
}

/**
 * Constrói um novo vetor de filtro a partir de dois filtros e um operador lógico ('and' ou 'or')
 * 
 * @param left
 * @param operator
 * @param right
 */
let filterLogicalBuilder = (left: any[], operator: 'and' | 'or', right: any[]): any[] => {
  if (!left && !right) return undefined;
  if (!left) return right;
  if (!right) return left;
  return [left, operator, right];
}

let parser1 = (v: any[], inverse: boolean = false): any[] => {
  return v.map((ele) => {
    if (Array.isArray(ele)) return parser1(ele);
    if (_.isNull(ele)) return "@null";
    return ele;
  });
};

/**
 * Aplica o teorema de 'de morgan'.
 * 
 * @param v 
 * @param inverse 
 */
let parser2 = (v: any[], inverse: boolean = false): any[] => {
  return v.map((ele) => {
    if (Array.isArray(ele)) return ele[0] === '!' ? _.compact(parser2(ele, inverse)) : parser2(ele, inverse);
    if (isComparisonOperator(ele)) return getComparisonOperator(ele, inverse);
    if (isLogicalOperator(ele)) return getLogicalOperator(ele, inverse);
    if (ele === '!') {
      inverse = true
      return null;
    };
    return ele;
  });
};

/**
 * Trasnforma os predicatos de array para UdfPredicate
 * 
 * @param v 
 */
let parser3 = (v: any[]): any[] => {
  if (Array.isArray(v) && isComparisonOperator(v[1])) return [new UdfPredicate(v[0], v[1], v[2])];
  return v.map(ele => {
    if (Array.isArray(ele)) {
      if (isComparisonOperator(ele[1])) {
        return new UdfPredicate(ele[0], ele[1], ele[2]);
      }
      return parser3(ele);
    }
    return ele;
  });
}

/**
 * Une os predicados em lógicas booleanas OR (UdfDisjunction) e AND (UdfConjunction) gerando um UdfFilter.
 * 
 * @param v 
 * @param udfFilterable 
 */
let parser4 = (v: any[], udfFilterable: UdfFilterable = new UdfConjunction()): UdfFilterable => {
  udfFilterable = hasAndOperator(v) ? new UdfConjunction() : new UdfDisjunction();
  v.forEach(ele => {
    if (Array.isArray(ele)) {
      if (hasAndOperator(ele)) {
        udfFilterable.predicates.push(parser4(ele, new UdfConjunction()));
        return;
      }
      udfFilterable.predicates.push(parser4(ele, new UdfDisjunction()));
    }
    if (isSimplePredicate(ele)) {
      udfFilterable.predicates.push(ele);
    }
  });
  return udfFilterable;
}
