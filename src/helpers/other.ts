import * as array from 'fp-ts/lib/Array';
import * as option from 'fp-ts/lib/Option';
import * as t from 'io-ts';
import { formatValidationError } from 'io-ts-reporters/target/src';

import Option = option.Option;

const formatValidationErrorAll = (validationErrors: t.ValidationError[]) =>
    array.catOptions(validationErrors.map(formatValidationError));

export const formatValidationErrors = (context: string) => (
    validationErrors: t.ValidationError[],
) => `Validation errors for ${context}: ${formatValidationErrorAll(validationErrors).join(', ')}`;

export class SafeMutableMap<K, V> {
    map: Map<K, V>;
    constructor(entries?: [K, V][]) {
        this.map = new Map(entries);
    }

    get(key: K): Option<V> {
        return option.fromNullable(this.map.get(key));
    }
}
