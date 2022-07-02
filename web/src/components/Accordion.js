import { useFormikContext } from 'formik';
import { createContext, useCallback, useContext, useEffect, useId, useReducer, useState } from 'react';
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

export function Accordion({ children }) {
    const [current, setCurrent] = useState(null);
    const [layout, setLayout] = useState(new Map());

    const toggle = useCallback((id, open) => {
        setCurrent(current => {
            if (open !== undefined) {
                if (current !== id && open) return id;
                if (current === id && !open) return null;
                return current;
            }

            // `open` not passed as an argument: toggle accordion
            if (current === id) return null;
            return id;
        });
    }, []);

    const toggleName = useCallback(
        (name, open) => {
            if (!layout.has(name)) return;
            toggle(layout.get(name).id, open);
        },
        [layout, toggle]
    );

    const register = useCallback((name, id, fields = []) => {
        setLayout(current => {
            current.set(name, {
                id,
                fields,
            });
            return current;
        });
    }, []);

    const unregister = useCallback(name => {
        setLayout(current => {
            current.delete(name);
            return current;
        });
    }, []);

    const context = Object.freeze({
        register,
        unregister,
        toggle,
        toggleName,
        current,
        layout,
    });

    return <AccordionContext.Provider value={context}>{children}</AccordionContext.Provider>;
}

export function AccordionItem({ name, label, open = false, fields = [], children }) {
    const { toggle, current, layout, register, unregister } = useContext(AccordionContext);
    const [uuid] = useState(useId());
    const expanded = uuid === current;

    const [mounted, onMounted] = useReducer(() => true, false);
    useEffect(() => {
        // Ensure on mount logic only occures once
        if (mounted) return;
        onMounted();

        // Register this accordion
        register(name, uuid, fields);

        // if `open` prop was passed `true`, open this accordion item by default
        if (open) toggle(uuid, true);
    }, [mounted, open, toggle, uuid, fields, name, register]);
    useEffect(() => () => unregister(name), [unregister, name]);

    // Listen for formik submit and expand on error
    const formik = useFormikContext();
    useEffect(() => {
        if (!formik || !formik.isSubmitting) return;
        const [[accordionName] = ['']] = Array.from(layout).filter(([name, info]) => info.fields.some(field => field in formik.errors));
        if (accordionName === name) toggle(uuid, true);
    }, [formik, expanded, layout, name, toggle, uuid]);

    return (
        <div className='accordion-item'>
            <AccordionHeader label={label} expanded={expanded} onClick={() => toggle(uuid)} />
            <Show when={expanded}>{children}</Show>
        </div>
    );
}

export function AccordionLink({ to, children }) {
    const { toggleName } = useContext(AccordionContext);
    return <span className='accordion-link click' onClick={() => toggleName(to)}>{children}</span>;
}
