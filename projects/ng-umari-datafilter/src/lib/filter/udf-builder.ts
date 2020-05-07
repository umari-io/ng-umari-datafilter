import * as _ from 'lodash';

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

//=======================================
// OUTRAS FUNCOES E VARIAVEIS AUXILIARES
//=======================================

let inputComparisonOperators = ['=', '<>', '>', '>=', '<', '<=', 'contains', 'notcontains', 'isblank', 'isnotblank'];
function toAray(x: any): any[] { if (!(x instanceof Array)) return [x]; return x; }
function checkOperator(operator: string) { if (!inputComparisonOperators.includes(operator)) throw new Error(`${operator} não é um comparador válido.`); }
function isBlankOrNotBlank(operator: string) { return operator === 'isblank' || operator === 'isnotblank'; }