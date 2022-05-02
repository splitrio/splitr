import { Field, useFormikContext } from 'formik';
import AnimateHeight from 'react-animate-height';
import get from 'lodash/get';
import './LabelInput.scss';
import useLast from '../hooks/useLast';

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

export default function LabelInput({
    name, 
    label, 
    tooltip, 
    showErrors = true, 
    getError = errors => get(errors, name),
    getTouched = touched => get(touched, name),
    ...props }) {
    const { errors, touched } = useFormikContext();
    const error = getError(errors);
    const lastError = useLast(error);
    const touch = getTouched(touched);
    const hasError = !!error && !!touch;

    return (
        <div className='form-group'>
            <label htmlFor={name} className={hasError ? 'error-color' : ''}>{label}</label>
            <Field name={name} aria-invalid={hasError ? true : ''} {...props}>
                {props.children}
            </Field>
            <AnimateHeight height={tooltipHeight(tooltip, hasError && showErrors)} className='tooltip'>
                {renderTooltip(tooltip, error || lastError)}
            </AnimateHeight>
        </div>
    );
}