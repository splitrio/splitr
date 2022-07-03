import { string, object, date, array } from 'yup';
import { NullableNumber } from '../../../util/schema';
import moment from 'moment';

const NameSchema = string().min(3, 'Too Short!').max(50, 'Too Long!').required('Required!');

const PercentageAmountSchema = object({
    type: string().oneOf(['percentage', 'amount']),
    value: NullableNumber()
        .positive('Must be positive!')
        .when('type', {
            is: 'percentage',
            then: schema => schema.min(0, 'Must be between 0 and 100!').max(100, 'Must be between 0 and 100!'),
        })
        .default(null),
});

const CurrencySchema = NullableNumber()
    .transform(number => Math.round(number * 100) / 100)
    .positive('Must be positive!');

const EndOfDay = () => {
    const date = new Date();
    date.setHours(23, 59, 59);
    return date;
};

const ItemSchema = object({
    name: NameSchema,
    quantity: NullableNumber().positive('Must be positive!').integer('Must be an integer!').required('Required!'),
    price: CurrencySchema.required('Required!'),
});

const WeightSchema = object({
    user: string(),
    weight: NullableNumber().positive('Must be positive!').required('Required!'),
});

const ExpenseSchema = object({
    name: NameSchema,
    date: date().max(EndOfDay(), "Expenses can't be in the future!").required('Required!'),
    amount: CurrencySchema.when('type', {
        is: 'single',
        then: schema => schema.required('Required!'),
    }),
    items: array(ItemSchema).when('type', {
        is: 'multiple',
        then: schema => schema.min(1, 'Must have at least one item!'),
    }),
    tax: PercentageAmountSchema,
    tip: PercentageAmountSchema,
    users: array(string()).optional().default([]),
    notes: string().nullable().transform(s => (/^\s*$/.test(s) ? null : s.trim())),
    images: array(string().required()),
});

const DefaultItem = () => ({
    name: '',
    quantity: 1,
    price: '',
});

const DefaultWeight = userId => ({
    user: userId,
    weight: 1,
});

const DefaultExpense = () => ({
    name: '',
    date: moment().format('YYYY-MM-DD'),
    split: 'proportionally',
    type: 'single',
    amount: '',
    items: [],
    tax: { type: 'percentage', value: 10.25 },
    tip: { type: 'percentage', value: '' },
    users: [],
    weights: [],
    notes: '',
    images: [],
});

export { ItemSchema, WeightSchema, ExpenseSchema, DefaultItem, DefaultWeight, DefaultExpense };
