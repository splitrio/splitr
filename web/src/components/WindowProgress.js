import './WindowProgress.scss';

export default function WindowProgress({ value, max, visible = true }) {
    return (
        <div className='window-progress' style={{opacity: visible ? 1 : 0}}>
            <div className='window-progress-bar' style={{width: `${100 * (value / max)}%`}}/>
        </div>
    );
}
