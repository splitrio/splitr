import { Field, useFormikContext } from 'formik';
import './Forms.scss';

export function PercentageAmountSelector({ name, label, placeholder }) {
    const { values, touched, errors } = useFormikContext();
    const isError = !!touched[name] && !!errors[name];
    let error = (errors[name] && errors[name].value) || '';
    return (
        <>
            <div className='grid' style={{ gridTemplateColumns: '1fr 2fr' }}>
                <Input as='select' name={`${name}.type`} label={label} isError={isError}>
                    <option value="percentage">Percentage</option>
                    <option value="amount">Flat Amount</option>
                </Input>
                <Input
                    type='number'
                    name={`${name}.value`}
                    label={values[name].type === 'percentage' ? 'Percentage' : 'Amount'}
                    placeholder={placeholder}
                    isError={isError}
                    step='any'
                    inputMode="decimal" pattern="[0-9.]*" />
            </div>
            {isError && <small className='error percentage-amount-error'>{error}</small>}
        </>
    )
}

/**
 * This is seriously fucked up and needs to be changed.
 */

export function Input({ label, name, isError, tooltip, ...props }) {
    return (
        <div className='form-group'>
            <label className={`${isError ? 'error' : ''}`} htmlFor={name}>{label}</label>
            <Field name={name} aria-invalid={isError ? true : ''} {...props}>
                {props.children}
            </Field>
            {tooltip}
        </div>
    );
}

export function LabelInput({ name, ...props }) {
    const { touched, errors } = useFormikContext();
    const isError = !!touched[name] && !!errors[name];
    const error = errors[name];
    return <Input
        name={name}
        isError={isError}
        error={error}
        tooltip={isError ? <small className='error'>{error}</small> : null}
        {...props} />
}