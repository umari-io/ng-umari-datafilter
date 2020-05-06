/**
 *
 */
export class Page<T> {
    last: boolean;
    totalElements: number;
    totalPages: number;
    sort: string;
    first: boolean;
    numberOfElements: number;
    size: number;
    number: number;
    content: T[] = [];
}
