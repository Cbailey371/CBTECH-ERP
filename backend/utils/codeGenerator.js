const { Op } = require('sequelize');

/**
 * Generates a sequential code for an entity.
 * @param {Model} model - The Sequelize model.
 * @param {string} prefix - The prefix for the code (e.g., 'CONT', 'PROV').
 * @param {object} whereClause - Additional where clause to scope the search (e.g., { companyId }).
 * @param {number} padding - Number of digits for the numeric part (default 3).
 * @param {boolean} includeYear - Whether to include the current year in the code (default false).
 * @returns {Promise<string>} The generated code.
 */
const generateCode = async (model, prefix, whereClause = {}, padding = 3, includeYear = false) => {
    const year = new Date().getFullYear();
    let codePrefix = prefix;

    if (includeYear) {
        codePrefix = `${prefix}-${year}`;
    }

    // Buscar el último registro que coincida con el prefijo
    const lastRecord = await model.findOne({
        where: {
            ...whereClause,
            code: {
                [Op.like]: `${codePrefix}-%`
            }
        },
        order: [['code', 'DESC']],
        attributes: ['code']
    });

    let nextNumber = 1;

    if (lastRecord && lastRecord.code) {
        // Extraer la parte numérica del final
        const match = lastRecord.code.match(/(\d+)$/);
        if (match) {
            nextNumber = parseInt(match[1]) + 1;
        }
    }

    // Formatear el nuevo código
    return `${codePrefix}-${String(nextNumber).padStart(padding, '0')}`;
};

module.exports = { generateCode };
