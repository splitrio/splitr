import { string, object, date, array } from "yup";
import { NullableNumber } from "../../../util/schema";
import moment from "moment";
    
const NameSchema = string()
    .min(3, 'Too Short!')
    .max(50, 'Too Long!')
    .required('Required!');

const PercentageAmountSchema = object({
    type: string().oneOf(['percentage', 'amount']),
    value: NullableNumber().positive("Must be positive!")
        .when('type', {
            is: 'percentage',
            then: schema => schema.min(0, 'Must be between 0 and 100!')
                .max(100, 'Must be between 0 and 100!')
        })
});

const CurrencySchema = NullableNumber()
    .transform(number => Math.round(number * 100) / 100)
    .positive("Must be positive!");

const ItemSchema = object({
    name: NameSchema,
    quantity: NullableNumber().positive('Must be positive!').integer('Must be an integer!').required('Required!'),
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
    tip: { type: 'percentage', value: '' }
});

export { ItemSchema, ExpenseSchema, DefaultItem, DefaultExpense };