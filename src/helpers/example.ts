import { BadRequest, JsValue, jsValueWriteable, Result } from 'express-result-types/target/result';
import * as t from 'io-ts';

import { formatValidationErrors } from './other';

export const validationErrorsToBadRequest = (validationErrors: t.ValidationError[]): Result =>
    BadRequest.apply(new JsValue(formatValidationErrors(validationErrors)), jsValueWriteable);
