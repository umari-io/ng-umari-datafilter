import { UdfExpression } from './udf-expression';

export class UdfPredicate extends UdfExpression {
  constructor(
    private dataField: string,
    op: string,
    private value: any) {
    super()
    this.type = op;
  }
}
