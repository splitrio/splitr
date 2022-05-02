import { Field } from "formik";
import AnimateHeight from "react-animate-height";

export default function Switch({ name, label, showTooltip, tooltip }) {
    return (
        <fieldset>
            <label htmlFor={name}>
                <Field type='checkbox' role='switch' name={name} /> 
                {label}
            </label>
            <AnimateHeight className="" height={showTooltip ? 'auto' : 0}>
                <small>{tooltip}</small>
            </AnimateHeight>
        </fieldset>
    );
}