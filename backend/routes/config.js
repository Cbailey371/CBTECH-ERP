const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Archivo donde se almacenará la configuración SMTP
const CONFIG_FILE = path.join(__dirname, '../config/smtp-config.json');

// Obtener configuración SMTP
router.get('/smtp', authenticateToken, requirePermission('config.manage'), async (req, res) => {
  try {
    const configExists = await fs.access(CONFIG_FILE).then(() => true).catch(() => false);
    
    if (!configExists) {
      // Configuración por defecto
      const defaultConfig = {
        host: '',
        port: 587,
        secure: false,
        auth: {
          user: '',
          pass: ''
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        fromEmail: '',
        fromName: '',
        timeout: 10000,
        maxConnections: 5,
        maxMessages: 100
      };
      return res.json(defaultConfig);
    }

    const configData = await fs.readFile(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configData);
    
    // No enviar la contraseña al frontend por seguridad
    const safeConfig = {
      ...config,
      auth: {
        ...config.auth,
        pass: config.auth.pass ? '••••••••' : ''
      }
    };
    
    res.json(safeConfig);
  } catch (error) {
    console.error('Error getting SMTP configuration:', error);
    res.status(500).json({ message: 'Error al obtener la configuración SMTP' });
  }
});

// Guardar configuración SMTP
router.post('/smtp', authenticateToken, requirePermission('config.manage'), async (req, res) => {
  try {
    const config = req.body;
    
    // Validaciones básicas
    if (!config.host || !config.port || !config.auth.user) {
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios: host, port, user' 
      });
    }

    // Si la contraseña es la máscara, no actualizar
    let finalConfig = { ...config };
    if (config.auth.pass === '••••••••') {
      try {
        const existingData = await fs.readFile(CONFIG_FILE, 'utf8');
        const existingConfig = JSON.parse(existingData);
        finalConfig.auth.pass = existingConfig.auth.pass;
      } catch (error) {
        // Si no existe archivo previo, requerir contraseña
        return res.status(400).json({ 
          message: 'Se requiere especificar una contraseña' 
        });
      }
    }

    // Crear directorio config si no existe
    const configDir = path.dirname(CONFIG_FILE);
    await fs.mkdir(configDir, { recursive: true });

    // Guardar configuración
    await fs.writeFile(CONFIG_FILE, JSON.stringify(finalConfig, null, 2));
    
    res.json({ message: 'Configuración SMTP guardada exitosamente' });
  } catch (error) {
    console.error('Error saving SMTP configuration:', error);
    res.status(500).json({ message: 'Error al guardar la configuración SMTP' });
  }
});

// Probar configuración SMTP
router.post('/smtp/test', authenticateToken, requirePermission('config.manage'), async (req, res) => {
  try {
    const { config, testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ message: 'Email de prueba requerido' });
    }

    // Si la contraseña es la máscara, obtener la real del archivo
    let testConfig = { ...config };
    if (config.auth.pass === '••••••••') {
      try {
        const existingData = await fs.readFile(CONFIG_FILE, 'utf8');
        const existingConfig = JSON.parse(existingData);
        testConfig.auth.pass = existingConfig.auth.pass;
      } catch (error) {
        return res.status(400).json({ 
          message: 'No se encontró configuración guardada previamente' 
        });
      }
    }

    // Crear transporter
    const transporter = nodemailer.createTransport({
      host: testConfig.host,
      port: testConfig.port,
      secure: testConfig.secure,
      auth: {
        user: testConfig.auth.user,
        pass: testConfig.auth.pass
      },
      tls: testConfig.tls,
      connectionTimeout: testConfig.timeout,
      greetingTimeout: testConfig.timeout,
      socketTimeout: testConfig.timeout
    });

    // Verificar conexión
    await transporter.verify();

    // Enviar email de prueba
    const mailOptions = {
      from: `"${testConfig.fromName || 'Sistema ERP'}" <${testConfig.fromEmail || testConfig.auth.user}>`,
      to: testEmail,
      subject: 'Prueba de Configuración SMTP - Sistema ERP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Prueba de Configuración SMTP</h2>
          <p>¡Felicitaciones! La configuración SMTP ha sido exitosa.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalles de la configuración:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Servidor:</strong> ${testConfig.host}</li>
              <li><strong>Puerto:</strong> ${testConfig.port}</li>
              <li><strong>Seguridad:</strong> ${testConfig.secure ? 'SSL/TLS' : 'STARTTLS'}</li>
              <li><strong>Usuario:</strong> ${testConfig.auth.user}</li>
            </ul>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Este es un mensaje de prueba generado automáticamente por el Sistema ERP.
            <br>
            Fecha y hora: ${new Date().toLocaleString('es-ES')}
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.json({ 
      message: 'Conexión SMTP exitosa. Email de prueba enviado correctamente.',
      success: true 
    });

  } catch (error) {
    console.error('Error testing SMTP configuration:', error);
    
    let errorMessage = 'Error en la configuración SMTP';
    
    // Personalizar mensajes de error comunes
    if (error.code === 'EAUTH') {
      errorMessage = 'Error de autenticación. Verificar usuario y contraseña.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Error de conexión. Verificar servidor y puerto.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Timeout de conexión. Verificar configuración de red.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Servidor SMTP no encontrado. Verificar el host.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(400).json({ 
      message: errorMessage,
      success: false,
      code: error.code
    });
  }
});

// Función auxiliar para enviar emails desde otras partes del sistema
const sendEmail = async (to, subject, html, text = null) => {
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configData);
    
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass
      },
      tls: config.tls,
      connectionTimeout: config.timeout,
      greetingTimeout: config.timeout,
      socketTimeout: config.timeout
    });

    const mailOptions = {
      from: `"${config.fromName || 'Sistema ERP'}" <${config.fromEmail || config.auth.user}>`,
      to,
      subject,
      html,
      text
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Obtener estado del servicio de email
router.get('/smtp/status', authenticateToken, async (req, res) => {
  try {
    const configExists = await fs.access(CONFIG_FILE).then(() => true).catch(() => false);
    
    if (!configExists) {
      return res.json({ 
        configured: false, 
        message: 'SMTP no configurado' 
      });
    }

    const configData = await fs.readFile(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configData);
    
    const configured = !!(config.host && config.port && config.auth.user && config.auth.pass);
    
    res.json({ 
      configured,
      host: config.host,
      user: config.auth.user,
      message: configured ? 'SMTP configurado' : 'Configuración SMTP incompleta'
    });
    
  } catch (error) {
    console.error('Error getting SMTP status:', error);
    res.status(500).json({ message: 'Error al obtener el estado SMTP' });
  }
});

module.exports = { router, sendEmail };
