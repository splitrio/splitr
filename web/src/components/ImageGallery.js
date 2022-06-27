import './ImageGallery.scss';

import { FiX, FiTrash, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { RiImageAddFill } from 'react-icons/ri';
import { useEffect, useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFormikContext } from 'formik';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import get from 'lodash/get';

import { Storage } from 'aws-amplify';

function Image({ src, keys, open }) {
    const [url, setUrl] = useState(src);

    useEffect(() => {
        async function resolveUrl() {
            if (!keys || src.startsWith('blob')) return;
            try {
                setUrl(await Storage.get(src, { level: 'protected' }));
            } catch (e) {
                console.log(`Failed to resolve pre-signed image URL: ${e}`);
            }
        }
        resolveUrl();
    }, [src, keys]);

    return (
        <div className='image-container click' onClick={() => open(url)}>
            <img src={url} alt='' />
        </div>
    );
}

function AddImageButton({ addImage }) {
    const fileInput = useRef();
    return (
        <div
            className='image-container'
            onClick={() => {
                if (!fileInput.current) return;
                fileInput.current.click();
            }}>
            <div className='add-image-button click'>
                <RiImageAddFill />
                <input
                    type='file'
                    name='image'
                    accept='image/*'
                    ref={fileInput}
                    style={{ display: 'none' }}
                    onChange={e => {
                        const target = e.target;
                        if (!target.files || !target.files[0]) return;
                        addImage(URL.createObjectURL(target.files[0]));
                    }}
                />
            </div>
        </div>
    );
}

function Lightbox({ src, close, removeImage, editable }) {
    const [zoomed, toggleZoomed] = useReducer(zoomed => !zoomed, false);

    useEffect(() => {
        const targetElement = document.querySelector('#lightbox');
        disableBodyScroll(targetElement);
        return () => enableBodyScroll(targetElement);
    });

    return (
        <motion.div
            id='lightbox'
            className='lightbox'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <div className='lightbox-background' onClick={close} />
            <div className='lightbox-nav'>
                <nav className='container-fluid'>
                    <ul></ul>
                    <ul>
                        <li className='click' onClick={toggleZoomed}>
                            {zoomed ? <FiZoomOut /> : <FiZoomIn />}
                        </li>
                        {editable && (
                            <li className='click' onClick={removeImage}>
                                <FiTrash />
                            </li>
                        )}
                        <li className='click' onClick={close}>
                            <FiX />
                        </li>
                    </ul>
                </nav>
            </div>
            <div className='lightbox-image-container'>
                <img src={src} className={`${zoomed ? 'lightbox-image-zoomed' : ''}`} alt='' />
            </div>
        </motion.div>
    );
}

export default function ImageGallery({ images, form = false, keys = true, name, label = 'Images' }) {
    const [selected, setSelected] = useState(null);

    // TODO: Shows warning in console when form is false. Way to fix?
    const formik = useFormikContext();

    const getImages = () => {
        if (form) return get(formik.values, name);
        return images;
    };

    const addImage = image => {
        const current = get(formik.values, name);
        current.push(image);
        formik.setFieldValue(name, current);
    };

    const removeImageAndCloseLightbox = index => {
        const current = get(formik.values, name);
        current.splice(index, 1);
        formik.setFieldValue(name, current);
        setSelected(null);
    };

    const actualImages = getImages();

    return (
        <div className='form-group'>
            {form && actualImages.length === 0 && <label htmlFor={name}>{label}</label>}
            <div className='image-gallery'>
                {actualImages.map((image, index) => (
                    <Image key={image} keys={keys} src={image} open={src => setSelected([index, src])} />
                ))}
                {form && <AddImageButton addImage={addImage} />}
                <AnimatePresence>
                    {selected !== null && (
                        <Lightbox
                            src={selected[1]}
                            editable={form}
                            close={() => setSelected(null)}
                            removeImage={() => removeImageAndCloseLightbox(selected[0])}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
