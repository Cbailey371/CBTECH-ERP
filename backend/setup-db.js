#!/usr/bin/env node

const { execSync } = require('child_process');
const { testConnection } = require('./config/database');

async function setupDatabase() {
  console.log('🚀 Iniciando configuración de la base de datos...\n');

  try {
    // 1. Probar conexión
    console.log('1️⃣  Probando conexión a PostgreSQL...');
    await testConnection();

    // 2. Crear base de datos
    console.log('2️⃣  Creando base de datos...');
    try {
      execSync('npm run db:create', { stdio: 'inherit' });
    } catch (error) {
      console.log('   ℹ️  Base de datos ya existe o error esperado');
    }

    // 3. Ejecutar migraciones
    console.log('3️⃣  Ejecutando migraciones...');
    execSync('npm run db:migrate', { stdio: 'inherit' });

    // 4. Ejecutar seeders
    console.log('4️⃣  Insertando datos iniciales...');
    execSync('npm run db:seed', { stdio: 'inherit' });

    console.log('\n✅ ¡Base de datos configurada exitosamente!');
    console.log('\n📋 Usuarios creados:');
    console.log('   👑 Admin: username: admin, password: admin123');
    console.log('   👤 Usuario: username: usuario, password: admin123');
    console.log('   👔 Manager: username: manager, password: admin123');
    console.log('\n🚀 Ahora puedes ejecutar: npm run dev');

  } catch (error) {
    console.error('❌ Error al configurar la base de datos:', error.message);
    process.exit(1);
  }
}

setupDatabase();