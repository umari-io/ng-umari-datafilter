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
 * - filters: any[] (filtro em formato de array)
 * 
 * ---
 * Métodos
 * 
 * - and(predicate: any[]): UdfFilter (Adiciona à um filtro já existente um novo predicado unindo por E lógico)
 * - or(predicate: any[]): UdfFilter (Adiciona à um filtro já existente um novo predicado unindo por OU lógico)
 * 
 */
export class UdfFilter {
  filters: any[];

  /**
   * Adiciona à um filtro já existente um novo predicado unindo por E lógico
   * 
   * @param predicate predicado à ser adicionado
   */
  and(predicate: any[]): UdfFilter {
    if (!predicate) return this;
    this.filters = filterLogicalBuilder(predicate, 'and', this.filters);
    return this;
  }

  /**
   * Adiciona à um filtro já existente um novo predicado unindo por OU lógico
   * 
   * @param predicate predicado à ser adicionado
   */
  or(predicate: any[]): UdfFilter {
    if (!predicate) return this;
    this.filters = filterLogicalBuilder(predicate, 'or', this.filters);
    return this;
  }

}

/**
 * Constrói um UdfFilter a partir de um array de filtros
 * 
 * @param filters
 */
export function of(filters: any[]): UdfFilter {
  let udfFilter = new UdfFilter();
  udfFilter.filters = filters;
  return udfFilter;
}

/**
 * Constrói um UdfFilterable a partir de um UdfFilter
 * 
 * @param filter
 */
export function toFilterable(filter: UdfFilter): UdfFilterable {
  if(!filter || !filter.filters) return;
  return parser4(parser3(parser2(parser1(filter.filters))));
}

/**
 * Constrói um ou mais novos predicados com comparador 'equals to'
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function eq(fields: string | string[], values: any | any[]): any[] {
  return buildExpression(fields, '=', values);
}

/**
 * Constrói um ou mais novos predicados com comparador 'not equals to'
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function ne(fields: string | string[], values: any | any[]): any[] {
  return buildExpression(fields, '<>', values);
}

/**
 * Constrói um ou mais novos predicados com comparador 'greater then'
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function gt(fields: string | string[], values: any | any[]): any[] {
  return buildExpression(fields, '>', values);
}

/**
 * Constrói um ou mais novos predicados com comparador 'greater then or equals to'
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function ge(fields: string | string[], values: any | any[]): any[] {
  return buildExpression(fields, '>=', values);
}

/**
 * Constrói um ou mais novos predicados com comparador 'less then'
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function lt(fields: string | string[], values: any | any[]): any[] {
  return buildExpression(fields, '<', values);
}

/**
 * Constrói um ou mais novos predicados com comparador 'less then or equals to'
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function le(fields: string | string[], values: any | any[]): any[] {
  return buildExpression(fields, '<=', values);
}

/**
 * Constrói um ou mais novos predicados com comparador 'contains'
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function contains(fields: string | string[], values: any | any[]): any[] {
  return buildExpression(fields, 'contains', values);
}

/**
 * Constrói um ou mais novos predicados com comparador 'not contains'
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function notcontains(fields: string | string[], values: any | any[]): any[] {
  return buildExpression(fields, 'notcontains', values);
}

/**
 * Constrói um ou mais novos predicados com comparador 'equals to' e valor 'null'
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function isblank(fields: string | string[]): any[] {
  return buildExpression(fields, '=', '@null');
}

/**
 * Constrói um ou mais novos predicados com comparador 'not equals to' e valor 'null'
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function isnotblank(fields: string | string[]): any[] {
  return buildExpression(fields, '<>', '@null');
}

/**
 * Constrói um ou mais novos predicados
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param comparisonOperator operação de comparação
 * @param values valor ou lista de valores para a comparação
 */
function buildExpression(
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
