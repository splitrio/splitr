import { useTitle } from "../hooks"

export default function Dashboard() {
    useTitle("Welcome");
    return (
        <>
            <hgroup>
                <h1 className="title">Welcome to splitr</h1>
                <h2>Tap below to enter an expense</h2>
            </hgroup>
        </>
    )
}