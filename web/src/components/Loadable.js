import { useCallback, useEffect, useState } from 'react';
import LoadingBlock from './LoadingBlock';

const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 8, 8, 0.055)',
    borderRadius: '10px'
}

const contentStyle = {
    margin: '0 auto'
}

export default function Loadable({ fetch, height='200px', children }) {
    // If content is:
    //  * undefined: content is loading
    //  * null: content failed to load
    const [content, setContent] = useState(undefined);
    const [retried, setRetried] = useState(false);

    const fetchContent = useCallback(() => {
        if (!fetch) return;
        setContent(undefined);
        Promise.resolve(fetch())
            .then(content => setContent(content))
            .catch(() => setContent(null));
    }, [fetch]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    if (content === undefined) return <LoadingBlock style={{ height: height }} />;
    if (content === null)
        return (
            <div style={{height: height, ...containerStyle}}>
                <small style={contentStyle}>
                    {retried ? (
                        <>
                            😭 Hmm. That still didn't work.{' '}
                            <span onClick={() => window.location.reload()} className='link secondary'>
                                Reload page?
                            </span>
                        </>
                    ) : (
                        <>
                            😞 Oops. That didn't load.{' '}
                            <span
                                onClick={() => {
                                    setRetried(true);
                                    fetchContent();
                                }}
                                className='link secondary'>
                                Try again?
                            </span>
                        </>
                    )}
                </small>
            </div>
        );

    if (typeof children === 'function') return children(content);
    return children;
}
