require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize, Project } = require('../models');

async function debugProjects() {
    try {
        const projects = await Project.findAll();
        console.log('--- ALL PROJECTS IN DB ---');
        console.log(JSON.stringify(projects, null, 2));
    } catch (error) {
        console.error('Error fetching projects:', error);
    } finally {
        await sequelize.close();
    }
}

debugProjects();
