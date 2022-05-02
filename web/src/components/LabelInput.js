import { Field, useFormikContext } from 'formik';
import AnimateHeight from 'react-animate-height';
import get from 'lodash/get';
import './LabelInput.scss';
import { useRef, useEffect } from 'react';

const tooltipHeight = (tooltip, hasError) => !!tooltip || hasError ? 'auto' : 0;

const renderTooltip = (tooltip, errorMsg) => {
    // User provided a tooltip
    if (!!tooltip) {
        if (typeof tooltip === 'string')
            return <small>{tooltip}</small>
        else return tooltip;
    }

    // No user-provided tooltip, show errors instead
    return <small className='error-color'>{errorMsg}</small>
};

export default function LabelInput({ name, label, tooltip, showErrors = true, ...props }) {
    const { errors, touched } = useFormikContext();
    const error = get(errors, name);
    const touch = get(touched, name);
    const hasError = !!error && !!touch && showErrors;

    // Save the last state of `error` using a reference
    // so that when animating out the error message, the animation is smooth rather than abrupt
    const lastError = useRef();
    useEffect(() => { lastError.current = error; }, [error]);

    return (
        <div className='form-group'>
            <label htmlFor={name}>{label}</label>
            <Field name={name} aria-invalid={hasError ? true : ''} {...props}>
                {props.children}
            </Field>
            <AnimateHeight height={tooltipHeight(tooltip, hasError)} className='tooltip-container'>
                {renderTooltip(tooltip, error || lastError.current)}
            </AnimateHeight>
        </div>
    );
}