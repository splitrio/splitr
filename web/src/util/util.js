const CURRENCY_FORMAT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function formatCurrency(currency) {
    if (typeof currency === 'string')
        currency = parseFloat(currency);
    return CURRENCY_FORMAT.format(currency);
}

export { formatCurrency };