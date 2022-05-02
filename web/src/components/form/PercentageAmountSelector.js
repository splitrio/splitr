import LabelInput from "./LabelInput";
import useLast from '../../hooks/useLast';
import get from 'lodash/get';
import { useFormikContext } from "formik";
import AnimateHeight from "react-animate-height";

export default function PercentageAmountSelector({ name, label, placeholder }) {
    const { values, touched, errors } = useFormikContext();
    const typePath = `${name}.type`;
    const valuePath = `${name}.value`;
    const error = get(errors, typePath) || get(errors, valuePath);
    const lastError = useLast(error);
    const isTouched = !!get(touched, typePath) || !!get(touched, valuePath);
    const hasError = !!error && isTouched;

    return (
        <>
            <div className="grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
                <LabelInput
                    as='select'
                    name={typePath}
                    label={label}
                    showErrors={false}
                    getError={() => error}
                    getTouched={() => isTouched}>
                    <option value="percentage">Percentage</option>
                    <option value="amount">Flat Amount</option>
                </LabelInput>
                <LabelInput
                    type='string'
                    name={valuePath}
                    label={get(values, typePath) === 'percentage' ? 'Percentage' : 'Amount'}
                    placeholder={placeholder}
                    showErrors={false}
                    getError={() => error}
                    getTouched={() => isTouched}
                    inputMode="decimal" pattern="[0-9.]*" />
            </div>
            <AnimateHeight className="tooltip" height={hasError ? 'auto' : 0}>
                <small className="error-color">{error || lastError}</small>
            </AnimateHeight>
        </>
    )
}