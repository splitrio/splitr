import LabelInput from "./LabelInput";
import { summarizeNames } from "../../util/util";

export default function UserSelect({ users, ...props }) {
    return <LabelInput
        as='select'
        multiple
        renderLabel={({ options }) => summarizeNames(options.map(o => o.value ? users.find(u => u.user === o.value).firstName : o.text))}
        {...props}>
        {users.map(user => (
            <option key={user.user} value={user.user}>
                {user.firstName} {user.lastName}
            </option>
        ))}
    </LabelInput>
}