import * as option from 'fp-ts/lib/Option';
import * as t from 'io-ts';

import Option = option.Option;

const parseNumber = (s: string): Option<number> => {
    const n = parseFloat(s);
    return isNaN(n) ? option.zero() : option.some(n);
};
export const NumberFromString = t.prism(t.string, parseNumber, 'NumberFromString');
