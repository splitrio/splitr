import { string, object, date, number, array } from "yup";
import moment from "moment";

const OptionalNumberSchema = (defaultValue = 0) => number().transform(number => isNaN(number) ? defaultValue : number);

const NameSchema = string()
    .min(3, 'Too Short!')
    .max(50, 'Too Long!')
    .required('Required!');

const PercentageAmountSchema = object({
    type: string().oneOf(['percentage', 'amount']),
    value: OptionalNumberSchema().min(0, "Can't be negative!")
        .when('type', {
            is: 'percentage',
            then: schema => schema.min(0, 'Must be between 0 and 100!')
                .max(100, 'Must be between 0 and 100!')
        })
});

const CurrencySchema = OptionalNumberSchema()
    .transform(number => Math.round(number * 100) / 100)
    .min(0, "Can't be negative!");

const ItemSchema = object({
    name: NameSchema,
    quantity: number().positive('Must be positive!').integer('Must be an integer!').required('Required!'),
    price: CurrencySchema.required('Required!')
});

const ExpenseSchema = object({
    name: NameSchema,
    date: date().max(new Date(), "Expenses can't be in the future!"),
    amount: CurrencySchema.when('type',
    {
        is: 'single',
        then: schema => schema.required('Required!')
    }),
    items: array(ItemSchema).when('type',
    {
        is: 'multiple',
        then: schema => schema.min(1, 'Must have at least one item!')
    }),
    tax: PercentageAmountSchema,
    tip: PercentageAmountSchema
});

const DefaultItem = () => ({
    name: '',
    quantity: 1,
    price: ''
});

const DefaultExpense = () => ({
    name: '',
    date: moment().format('YYYY-MM-DD'),
    split: 'proportionally',
    type: 'single',
    amount: '',
    items: [],
    tax: { type: 'percentage', value: 10.15 },
    tip: { type: 'percentage', value: '' },
    isSplit: false
});

export { ItemSchema, ExpenseSchema, DefaultItem, DefaultExpense };