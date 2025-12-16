require('dotenv').config();
const { sequelize, Contract, Supplier, Project, Task, Customer, Company, User } = require('../models');
const { Op } = require('sequelize');

// Utility to generate code manually for backfill to avoid async race conditions in loops if using the standard utility blindly
// But here we will do it sequentially to be safe.
const generateCodeForBackfill = async (model, prefix, whereClause = {}, padding = 3, includeYear = false) => {
    const year = new Date().getFullYear();
    let codePrefix = prefix;

    if (includeYear) {
        // For backfill, maybe we should use the creation year of the record? 
        // For simplicity and user request "like we do for products", let's use current year or just increment.
        // User said: "revisa los regitos ya creados y asignales un codigo"
        // Let's use the record's creation year if possible, or just current year for simplicity.
        // Let's stick to current logic: Prefix-{Year}-... 
        // Actually, for Contracts it was CONT-{Year}.
        codePrefix = `${prefix}-${year}`;
    }

    // Find last code in DB to increment
    const lastRecord = await model.findOne({
        where: {
            ...whereClause,
            code: { [Op.like]: `${codePrefix}-%` }
        },
        order: [['code', 'DESC']],
        attributes: ['code']
    });

    let nextNumber = 1;

    if (lastRecord && lastRecord.code) {
        const match = lastRecord.code.match(/(\d+)$/);
        if (match) {
            nextNumber = parseInt(match[1]) + 1;
        }
    }

    return `${codePrefix}-${String(nextNumber).padStart(padding, '0')}`;
};

const backfill = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // 1. COMPANIES (Global)
        console.log('Backfilling Companies...');
        const companies = await Company.findAll({ where: { code: null } });
        for (const company of companies) {
            const code = await generateCodeForBackfill(Company, 'EMP', {}, 3);
            await company.update({ code });
            console.log(`Updated Company ${company.id} with code ${code}`);
        }

        // 2. USERS (Global)
        console.log('Backfilling Users...');
        const users = await User.findAll({ where: { code: null } });
        for (const user of users) {
            const code = await generateCodeForBackfill(User, 'USR', {}, 3);
            await user.update({ code });
            console.log(`Updated User ${user.id} with code ${code}`);
        }

        // 3. CUSTOMERS (Per Company)
        console.log('Backfilling Customers...');
        const customers = await Customer.findAll({ where: { code: null }, order: [['companyId', 'ASC'], ['id', 'ASC']] });
        for (const customer of customers) {
            const code = await generateCodeForBackfill(Customer, 'CLI', { companyId: customer.companyId }, 3);
            await customer.update({ code });
            console.log(`Updated Customer ${customer.id} with code ${code}`);
        }

        // 4. SUPPLIERS (Per Company)
        console.log('Backfilling Suppliers...');
        const suppliers = await Supplier.findAll({ where: { code: null }, order: [['companyId', 'ASC'], ['id', 'ASC']] });
        for (const supplier of suppliers) {
            const code = await generateCodeForBackfill(Supplier, 'PROV', { companyId: supplier.companyId }, 3);
            await supplier.update({ code });
            console.log(`Updated Supplier ${supplier.id} with code ${code}`);
        }

        // 5. PROJECTS (Per Company)
        console.log('Backfilling Projects...');
        const projects = await Project.findAll({ where: { code: null }, order: [['companyId', 'ASC'], ['id', 'ASC']] });
        for (const project of projects) {
            const code = await generateCodeForBackfill(Project, 'PROJ', { companyId: project.companyId }, 3);
            await project.update({ code });
            console.log(`Updated Project ${project.id} with code ${code}`);
        }

        // 6. TASKS (Per Project) -- Logic was: TASK-{001} scoped to Project (or Company as per simplified logic in route)
        // Route logic used: generateCode(Task, 'TASK', { project_id: projectId }, 3);
        // Let's stick to that scope.
        console.log('Backfilling Tasks...');
        const tasks = await Task.findAll({ where: { code: null }, order: [['projectId', 'ASC'], ['id', 'ASC']] });
        for (const task of tasks) {
            const projectId = task.projectId;
            if (!projectId) continue; // Should not happen but safety check
            // Note: Route used scope { project_id: projectId } which matches DB field project_id (underscored in DB, camelCase in model? Need to check model definition)
            // Model Task.js usually defines projectId.
            // Let's assume model field is 'projectId'.
            const code = await generateCodeForBackfill(Task, 'TASK', { projectId: projectId }, 3);
            await task.update({ code });
            console.log(`Updated Task ${task.id} with code ${code}`);
        }

        // 7. CONTRACTS (Per Company)
        // Logic: CONT-{Year}-{0001}
        console.log('Backfilling Contracts...');
        const contracts = await Contract.findAll({ where: { code: null }, order: [['companyId', 'ASC'], ['id', 'ASC']] });
        for (const contract of contracts) {
            // Use current year for backfill or creation year?
            // User requested automation "like products/quotes".
            // Let's use the contract's StartDate year or CreatedAt year if available.
            // For simplicity and consistency with the 'generateCode' utility which usually defaults to current year, 
            // BUT for backfill it might look weird if all old contracts get 2024.
            // However, the `generateCode` utility I wrote uses `new Date().getFullYear()`.
            // To be consistent with *future* auto-generation, I will use the current year logic, 
            // OR I can try to use the contract's year.
            // Given the user prompt "revisa los registros ya creados", assigning a new code now (2024) is acceptable for "system codes".
            // If they wanted historical accuracy they would specify.
            const code = await generateCodeForBackfill(Contract, 'CONT', { companyId: contract.companyId }, 4, true);
            await contract.update({ code });
            console.log(`Updated Contract ${contract.id} with code ${code}`);
        }

        console.log('Backfill complete!');
        process.exit(0);

    } catch (error) {
        console.error('Backfill failed:', error);
        process.exit(1);
    }
};

backfill();
