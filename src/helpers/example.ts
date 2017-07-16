import { BadRequest, HttpEntity, Result } from 'express-result-types/target/result';
import * as t from 'io-ts';

import { formatValidationErrors } from './other';

export const validationErrorsToBadRequest = (validationErrors: t.ValidationError[]): Result =>
    BadRequest.apply(
        new HttpEntity(
            JSON.stringify(formatValidationErrors(validationErrors)),
            'application/json',
        ),
    );
