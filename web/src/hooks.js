import { useRef, useEffect } from 'react'

const SITE_SUFFIX = "• splitr";

/**
 * Sets the document page title.
 * @param {*} title The page's title
 * @param {*} revertOnUmount If true, resets the page title to its original title when this component unmounts. Defaults to true.
 */
export function useTitle(title, revertOnUmount = true) {
    const defaultTitle = useRef(document.title);

    useEffect(() => {
        document.title = `${title} ${SITE_SUFFIX}`;
    }, [title]);

    useEffect(() => () => {
        if (revertOnUmount) {
            document.title = defaultTitle.current;
        }
    }, [revertOnUmount]);
};