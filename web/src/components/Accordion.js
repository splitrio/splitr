import { useFormikContext } from 'formik';
import { createContext, useContext, useEffect, useId, useState } from 'react';
import './Accordion.scss';
import Show from './Show';

const AccordionContext = createContext();

function AccordionHeader({ label, expanded, ...props }) {
    return (
        <div className={`accordion-header ${expanded ? 'accordion-header-expanded' : ''}`} {...props}>
            {label}
        </div>
    );
}

export function Accordion({ layout = {}, children }) {
    const [current, setCurrent] = useState(null);

    function toggle(id) {
        if (current === id) setCurrent(null);
        else setCurrent(id);
    }

    const context = Object.freeze({
        layout,
        toggle,
        current,
    });

    return <AccordionContext.Provider value={context}>{children}</AccordionContext.Provider>;
}

export function AccordionItem({ name, label, open = false, children }) {
    const { toggle, current, layout } = useContext(AccordionContext);
    const [uuid] = useState(useId());
    const expanded = uuid === current;

    // If open is true, expand this accordion on mount
    const [triedOpenOnMount, setTriedOpenOnMount] = useState(false);
    useEffect(() => {
        if (!triedOpenOnMount && open) toggle(uuid);
        setTriedOpenOnMount(true);
    }, [open, toggle, uuid, triedOpenOnMount]);

    // Listen for formik submit and expand on error
    const formik = useFormikContext();
    let isSubmitting = formik ? formik.isSubmitting : false;
    useEffect(() => {
        if (!formik || !isSubmitting) return;
        
        function getLayoutIndexFromFieldName(field) {
            for (let i = 0; i < layout.length; i++) {
                if (layout[i][1].includes(field)) return i;
            }
            return -1;
        }

        const accordionIndices = Object.keys(formik.errors).map(getLayoutIndexFromFieldName).filter(e => e >= 0);
        if (accordionIndices.length === 0) return;
        const minIndex = Math.min.apply(null, accordionIndices);
        if (layout[minIndex][0] === name && !expanded) toggle(uuid);

    }, [isSubmitting, formik, expanded, layout, name, toggle, uuid]);

    return (
        <div className='accordion-item'>
            <AccordionHeader label={label} expanded={expanded} onClick={() => toggle(uuid)} />
            <Show when={expanded}>{children}</Show>
        </div>
    );
}
