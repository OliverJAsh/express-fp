import { BadRequest, JsValue, jsValueWriteable, Result } from 'express-result-types/target/result';
import * as t from 'io-ts';

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
