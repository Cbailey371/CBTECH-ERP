/**
 * Utilities for FEPA Tax Calculations (Panama)
 */

/**
 * Calculates tax breakdown for a list of items.
 * Supports standard ITBMS rates: 7%, 10%, 15%.
 * @param {Array} items - Array of items with { price, quantity, taxRate (e.g., 0.07) }
 * @returns {Object} { totalTaxable, totalTax, breakdown: { '0.07': { taxable, tax } } }
 */
const calculateTaxes = (items) => {
    const breakdown = {};
    let totalTaxable = 0;
    let totalTax = 0;
    let totalAmount = 0;

    items.forEach(item => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        const rate = parseFloat(item.taxRate) || 0;

        // Ensure rate is standard (approximate matching could be added if needed)
        const rateKey = rate.toFixed(2); // "0.07", "0.00"

        const lineAmount = qty * price;
        const lineTax = lineAmount * rate;

        if (!breakdown[rateKey]) {
            breakdown[rateKey] = {
                taxable: 0,
                tax: 0
            };
        }

        breakdown[rateKey].taxable += lineAmount;
        breakdown[rateKey].tax += lineTax;

        totalTaxable += lineAmount;
        totalTax += lineTax;
        totalAmount += (lineAmount + lineTax);
    });

    // Formatting decimals
    totalTaxable = parseFloat(totalTaxable.toFixed(2));
    totalTax = parseFloat(totalTax.toFixed(2));
    totalAmount = parseFloat(totalAmount.toFixed(2));

    Object.keys(breakdown).forEach(k => {
        breakdown[k].taxable = parseFloat(breakdown[k].taxable.toFixed(2));
        breakdown[k].tax = parseFloat(breakdown[k].tax.toFixed(2));
    });

    return {
        totalTaxable,
        totalTax,
        totalAmount,
        breakdown
    };
};

/**
 * Calculates the Check Digit (DV) for RUC (Natural or Juridical Person).
 * Note: DGI Panama uses a specific Modulo 11 algorithm.
 * This is a placeholder for the actual complex algorithm.
 * @param {string} ruc 
 * @returns {string} DV
 */
const calculateDV = (ruc) => {
    // TODO: Implement full DGI Modulo 11 algorithm
    // For now, return existing DV or validation logic
    return "";
};

module.exports = {
    calculateTaxes,
    calculateDV
};
