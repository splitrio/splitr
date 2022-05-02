import moment from 'moment';
import * as Yup from 'yup';

const currency = message => Yup.number()
    .test({
        message: message,
        test: (value, { originalValue }) => {
            if (typeof originalValue === 'string')
                return /^\s*\$?(?:\d+)((\d{1,3})*([, ]\d{3})*)(\.\d*)?\s*$/.test(originalValue);
            return true;
        }
    })
    .transform((value, originalValue) => {
        if (typeof originalValue === 'string') {
            const num = originalValue.trim().replace('$', '').replace(',', '');
            const val = parseFloat(num);
            if (!val) return 0;
            return Math.ceil(val * 100) / 100;
        }
        return value;
    })
    .positive('Must be positive!');

const name = Yup.string()
    .min(3, 'Too short!')
    .max(50, 'Too long!')
    .required('Required!')
    .default("");

const percentageAmount = () => {
    const pa = Yup.object({
        type: Yup.string(),
        value: Yup.number().typeError('Enter a number!').transform(number => isNaN(number) ? 0 : number)
    });
    
    return pa.when('type', {
        is: 'multiple',
        then: schema => schema.shape({
            type: Yup.reach(pa, 'type').oneOf(['percentage', 'amount']),
            value: Yup.reach(pa, 'value').min(0, 'Must be between 0 and 100!')
            .when('type', {
                is: 'percentage',
                then: schema => schema.max(100, 'Must be between 0 and 100!')
            })
        })
    });
}

const ItemSchema = Yup.object({
    name: name,
    quantity: Yup.number().required('Required!'),
    price: currency('Not a valid price!').required('Required!')
});

const ExpenseSchema = Yup.object({
    name: name,
    date: Yup.date().default(() => new Date()).max(new Date(), "Expenses can't be in the future!"),
    split: Yup.string().oneOf(['proportionally', 'equally', 'individually']).default('proportionally'),
    type: Yup.string().oneOf(['single', 'multiple']).default('single'),
    amount: currency('Not a valid amount!')
        .when('type', {
            is: 'single',
            then: schema => schema.required('Required!')
        }),
    items: Yup.array(ItemSchema).default([])
        .when('type', {
            is: 'multiple',
            then: schema => schema.min(1, 'Need at least one item!')
        }),
    tax: percentageAmount().default({ type: 'percentage', value: 10.25 }),
    tip: percentageAmount().default({ type: 'percentage', value: undefined })
});

const DefaultExpense = ExpenseSchema.cast({});
DefaultExpense.date = moment(DefaultExpense.date).format("YYYY-MM-DD");
DefaultExpense.amount = '';
Object.freeze(DefaultExpense);

const DefaultItem = ItemSchema.cast({});
DefaultItem.quantity = 1;
DefaultItem.price = '';
Object.freeze(DefaultItem);

export { ItemSchema, ExpenseSchema, DefaultExpense, DefaultItem };