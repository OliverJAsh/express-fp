import { BadRequest, JsValue, jsValueWriteable, Result } from 'express-result-types/target/result';
import * as option from 'fp-ts/lib/Option';
import * as t from 'io-ts';

import Option = option.Option;

import { formatValidationErrors } from './other';

export const validationErrorsToBadRequest = (context: string) => (
    validationErrors: t.ValidationError[],
): Result =>
    BadRequest.apply(
        new JsValue([
            `Validation errors for ${context}: ${formatValidationErrors(validationErrors).join(
                ', ',
            )}`,
        ]),
        jsValueWriteable,
    );

const parseNumber = (s: string): Option<number> => {
    const n = parseFloat(s);
    return isNaN(n) ? option.zero() : option.some(n);
};
export const NumberFromString = t.prism(t.string, parseNumber, 'NumberFromString');
