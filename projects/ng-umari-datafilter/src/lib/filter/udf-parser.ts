// import * as _ from 'lodash';

import { UdfDisjunction } from './udf-disjunction';
import { UdfConjunction } from './udf-conjunction';
import { UdfFilterable } from './udf-filterable';
import { UdfPredicate } from './udf-predicate';

const isEmpty = obj => [Object, Array].includes((obj || {}).constructor) && !Object.entries((obj || {})).length;

function intersection(arrays: any[]): any[] {
  return arrays.reduce(function (a, b) {
    return a.filter(function (value) {
      return b.includes(value);
    });
  })
}

/**
 * Constrói um UdfFilterable a partir de um array de filtros
 * 
 * @param filter
 */
export function toFilterable(filters: any[]): UdfFilterable {
  if (!filters) return;
  return parser4(parser3(parser2(parser1(filters))));
}

//===============================================================================
// FUNCOES DE PARSER QUE TRANSFORMAM UM ARRAY DE FILTROS EM UM OBJETO FILTERABLE
//===============================================================================

function parser1(v: any[]): any[] {
  return v.map((ele) => {
    if (Array.isArray(ele)) return parser1(ele);
    if (ele === null) return "@null";
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
    if (Array.isArray(ele)) return ele[0] === '!' ? parser2(ele, inverse).filter(Boolean) : parser2(ele, inverse);
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

let comparisonOperators = [['=', '<>', '>', '<', '>=', '<=', 'contains', 'notcontains', '@null', '@notnull'], ['<>', '=', '<=', '>=', '<', '>', 'notcontains', 'contains', '@notnull', '@null']];

let logicalOperators = [['and', 'or'], ['or', 'and']];

function isSimplePredicate(p: UdfPredicate | any[]): boolean {
  return p instanceof UdfPredicate;
}

function hasAndOperator(arr: any[]): boolean {
  return arr.includes('and');
}

function isComparisonOperator(op: string): boolean {
  return !isEmpty(intersection([[op], comparisonOperators[0]]));
}

function isLogicalOperator(op: string): boolean {
  return !isEmpty(intersection([[op], logicalOperators[0]]));
}

function getComparisonOperator(op: string, inverse: boolean = false): string {
  return inverse ? comparisonOperators[1][comparisonOperators[0].indexOf(op)] : op;
}

function getLogicalOperator(op: string, inverse: boolean = false): string {
  return inverse ? logicalOperators[1][logicalOperators[0].indexOf(op)] : op;
}