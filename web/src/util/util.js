const CURRENCY_FORMAT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function formatCurrency(currency) {
    if (typeof currency === 'string')
        currency = parseFloat(currency);
    return CURRENCY_FORMAT.format(currency);
}

/**
 * Formats a number.
 * @param {number} number A number to be formatted
 * @param {number} places At most this many decimal places will be included in the output
 * @returns {string} A string representation of the number
 */
function formatNumber(number, places = 2) {
    return parseFloat(number.toFixed(places)).toString();
}

/**
 * Summarizes a list of names.
 * For instance, if `names` is ["Jacob", "John", "Jack"], returns "Jacob, John, and 1 other"
 * @param {string[]} names A list of names to be summarized
 * @param {number} maxNames The maximum number of names from `names` that will be included.
 *  If zero or negative, includes all names.
 */
function summarizeNames(names, maxNames = 2) {
    if (names.length === 0) return '';
    if (names.length === 1) return names[0];

    const numShow = maxNames > 0 ? Math.min(names.length, maxNames) : names.length;
    const numExcluded = names.length - numShow;

    let summary = '';
    if (numExcluded > 0) {
        for (let i = 0; i < numShow; i++) {
            summary += names[i];
            if (i < numShow - 1) summary += ', ';
        }
        return `${summary} and ${numExcluded} other${numExcluded > 1 ? 's' : ''}`;
    }

    for (let i = 0; i < numShow - 1; i++) {
        summary += names[i];
        if (i < numShow - 2) summary += ', ';
    }
    return `${summary} and ${names[numShow - 1]}`;
}

/**
 * Given someone's name, returns a badge representing them.
 * @param {string} name A person's name
 * @returns A <span/> element
 */
function getBadge(name) {
    name = name.trim();
    function getColor() {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) ^ ((hash << 5) + hash);
        }
        return `hsl(${hash % 360}, 50%, 70%)`;
    }

    function getInitials() {
        const seperators = [' ', '-'];
        let initials = '';
        let add = true;
        for (let i = 0; i < name.length - 1; i++) {
            if (seperators.indexOf(name.charAt(i)) >= 0) add = true;
            else {
                if (add) initials += name.charAt(i).toLocaleUpperCase();
                add = false;
            }
        }
        return initials;
    }

    return <span className='badge' style={{ backgroundColor: getColor() }} key={name}>{getInitials()}</span>;
}

export { formatCurrency, formatNumber, summarizeNames, getBadge };