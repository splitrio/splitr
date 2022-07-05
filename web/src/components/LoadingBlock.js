export default function LoadingBlock({ height='100%', style, ...props }) {
    return (
        <div style={{ width: '100%', height: height, textAlign: 'center', ...style }} {...props}>
                <span style={{ position: 'relative', top: 'calc(50% - 0.75em)' }} aria-busy={true} />
        </div>
    );
}
