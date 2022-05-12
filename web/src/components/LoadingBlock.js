export default function LoadingBlock({ style, ...props }) {
    return (
        <div style={{ width: '100%', height: '100%', textAlign: 'center', ...style }} {...props}>
                <span style={{ position: 'relative', top: 'calc(50% - 0.75em)' }} aria-busy={true} />
        </div>
    );
}
