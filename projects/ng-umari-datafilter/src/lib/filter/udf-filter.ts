import * as _ from 'lodash';

import { UdfDisjunction } from './udf-disjunction';
import { UdfConjunction } from './udf-conjunction';
import { UdfFilterable } from './udf-filterable';
import { UdfPredicate } from './udf-predicate';

export enum Value {
  NOW = '@now',
  NULL = '@null',
  NOT_NULL = '@notnull'
}

export function not(predicate: any[]): any[] {
  return ['!', predicate];
}

export function and(...predicates: any[][]): any[] {
  return filterLogicalBuilder('and', predicates);
}

export function or(...predicates: any[][]): any[] {
  return filterLogicalBuilder('or', predicates);
}

function filterLogicalBuilder(logicalOperator: 'and' | 'or', predicates: any[][]): any[] {
  if (!predicates) return this;
  if (predicates.length === 1) return predicates[0];
  let filters = [];
  predicates.forEach(predicate => filters.push(predicate, logicalOperator));
  filters.pop();
  return filters;
}

/**
 * Constrói um UdfFilterable a partir de um array de filtros
 * 
 * @param filter
 */
export function toFilterable(filters: any[]): UdfFilterable {
  if(!filters) return;
  return parser4(parser3(parser2(parser1(filters))));
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
 * Constrói um ou mais novos predicados com comparador 'greater than'
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function gt(fields: string | string[], values: any | any[]): any[] {
  return buildExpression(fields, '>', values);
}

/**
 * Constrói um ou mais novos predicados com comparador 'greater than or equals to'
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function ge(fields: string | string[], values: any | any[]): any[] {
  return buildExpression(fields, '>=', values);
}

/**
 * Constrói um ou mais novos predicados com comparador 'less than'
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function lt(fields: string | string[], values: any | any[]): any[] {
  return buildExpression(fields, '<', values);
}

/**
 * Constrói um ou mais novos predicados com comparador 'less than or equals to'
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
 * Constrói um ou mais novos predicados com comparador 'equals to' e valor NULL
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function isblank(fields: string | string[]): any[] {
  return buildExpression(fields, '=', Value.NULL);
}

/**
 * Constrói um ou mais novos predicados com comparador 'not equals to' e valor NULL
 * 
 * @param fields atributo ou lista de atributos para a comparação
 * @param values valor ou lista de valores para a comparação
 */
export function isnotblank(fields: string | string[]): any[] {
  return buildExpression(fields, '<>', Value.NULL);
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
    if (isBlankOrNotBlank(operator)) newFilter.push([field, operator], 'or')
    else values.forEach(value => newFilter.push([field, operator, value], 'or'));
  });
  newFilter.pop();
  return newFilter;
}

//===============================================================================
// FUNCOES DE PARSER QUE TRANSFORMAM UM ARRAY DE FILTROS EM UM OBJETO FILTERABLE
//===============================================================================

function parser1(v: any[]): any[] {
  return v.map((ele) => {
    if (Array.isArray(ele)) return parser1(ele);
    if (_.isNull(ele)) return "@null";
    return ele;
  });
}

/**
 * Aplica o teorema de 'de morgan'.
 * 
 * @param v 
 * @param inverse 
 */
function parser2(v: any[], inverse: boolean = false): any[] {
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
}

/**
 * Trasnforma os predicatos de array para UdfPredicate
 * 
 * @param v 
 */
function parser3(v: any[]): any[] {
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
function parser4(v: any[], udfFilterable: UdfFilterable = new UdfConjunction()): UdfFilterable {
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

//=======================================
// OUTRAS FUNCOES E VARIAVEIS AUXILIARES
//=======================================

let inputComparisonOperators = ['=', '<>', '>', '>=', '<', '<=', 'contains', 'notcontains', 'isblank', 'isnotblank'];
let comparisonOperators = [['=', '<>', '>', '<', '>=', '<=', 'contains', 'notcontains', '@null', '@notnull'], ['<>', '=', '<=', '>=', '<', '>', 'notcontains', 'contains', '@notnull', '@null']];
let logicalOperators = [['and', 'or'], ['or', 'and']];
function isSimplePredicate(p: UdfPredicate | any[]): boolean { return p instanceof UdfPredicate; };
function hasAndOperator(arr: any[]): boolean { return _.includes(arr, 'and'); };
function isComparisonOperator(op: string): boolean { return !_.isEmpty(_.intersection([op], comparisonOperators[0])); };
function isLogicalOperator(op: string): boolean { return !_.isEmpty(_.intersection([op], logicalOperators[0])); };
function getComparisonOperator(op: string, inverse: boolean = false): string { return inverse ? comparisonOperators[1][comparisonOperators[0].indexOf(op)] : op; };
function getLogicalOperator(op: string, inverse: boolean = false): string { return inverse ? logicalOperators[1][logicalOperators[0].indexOf(op)] : op; };
function toAray(x: any): any[] { if (!(x instanceof Array)) return [x]; return x; }
function checkOperator(operator: string) { if (!inputComparisonOperators.includes(operator)) throw new Error(`${operator} não é um comparador válido.`); }
function isBlankOrNotBlank(operator: string) { return operator === 'isblank' || operator === 'isnotblank'; }