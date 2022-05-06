import { Field, useFormikContext } from 'formik';
import AnimateHeight from 'react-animate-height';
import get from 'lodash/get';
import './LabelInput.scss';
import useLast from '../../hooks/useLast';
import { useState } from 'react';

export default function LabelInput({
    name,
    label,
    tooltip,
    showTooltipOnFocus = false,
    showErrors = true,
    getError = errors => get(errors, name),
    getTouched = touched => get(touched, name),
    ...props }) {
    const { errors, touched } = useFormikContext();
    const error = getError(errors);
    const lastError = useLast(error);
    const touch = getTouched(touched);
    const hasError = !!error && !!touch;

    const [focused, setFocused] = useState(false);

    function onFocus() {
        setFocused(true);
        if (props.onFocus) props.onFocus();
    }

    function onBlur() {
        // Need a small delay to allow `touched` to be set by Formik
        // Without this, there would be some glitchy UI behaviour
        setTimeout(() => setFocused(false), 1); 
        if (props.onBlur) props.onBlur();
    }

    function shouldShowTooltip () {
        if (showErrors && hasError) return true; 
        if (showTooltipOnFocus)
            return focused && !!tooltip;
        else return !!tooltip;
    }

    function renderTooltip() {
        const errorTooltip = <small className='error-color'>{error || lastError}</small>;

        // If there is an error, always render that before any optional user-specified tooltip
        if (hasError) return errorTooltip;

        // No error but user provided a tooltip
        if (!!tooltip) {
            if (typeof tooltip === 'string')
                return <small>{tooltip}</small>
            else return tooltip;
        }

        // There is no error or tooltip.
        // If hasError just became false, then we still want to render the error as its height goes to zero
        // Hence we return the error tooltip element again.
        return errorTooltip;
    };

    return (
        <div className='form-group'>
            <label htmlFor={name} className={hasError ? 'error-color' : ''}>{label}</label>
            <div onFocus={onFocus} onBlur={onBlur}>
                <Field name={name} aria-invalid={hasError ? true : ''} {...props}>
                    {props.children}
                </Field>
            </div>
            <AnimateHeight height={shouldShowTooltip() ? 'auto' : 0} className='tooltip'>
                {renderTooltip()}
            </AnimateHeight>
        </div>
    );
}