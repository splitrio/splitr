import { number } from "yup";

const NullableNumber = () => number().transform((value, original) => {
    if (typeof original === 'string' && original === '') return null;
    return value;
})
    .nullable()
    .typeError('Not a number!')
    .transform((value, originalValue) => (/\s/.test(originalValue) ? NaN : value));

export { NullableNumber };