import AnimateHeight from "react-animate-height";

export default function Show({when, ...props}) {
    return (
        <AnimateHeight height={when ? 'auto' : 0} {...props}>
            {props.children}
        </AnimateHeight>
    );
}