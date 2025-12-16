import React, { useState, useEffect } from 'react';

const ServidorSMTP = () => {
  const [config, setConfig] = useState({
    host: '',
    port: 587,
    secure: false, // true para SSL, false para TLS
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
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [testEmail, setTestEmail] = useState('');

  // Predefined SMTP providers with their configurations
  const providers = [
    {
      name: 'Gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      description: 'Usar contraseña de aplicación'
    },
    {
      name: 'Outlook/Hotmail',
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      description: 'Microsoft 365 / Outlook.com'
    },
    {
      name: 'Yahoo',
      host: 'smtp.mail.yahoo.com',
      port: 587,
      secure: false,
      description: 'Yahoo Mail'
    },
    {
      name: 'SendGrid',
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      description: 'Servicio de correo transaccional'
    },
    {
      name: 'Mailgun',
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      description: 'Servicio de correo transaccional'
    },
    {
      name: 'Personalizado',
      host: '',
      port: 587,
      secure: false,
      description: 'Configuración manual'
    }
  ];

  const [selectedProvider, setSelectedProvider] = useState('Personalizado');

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/config/smtp', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        // Determinar el proveedor basado en el host
        const provider = providers.find(p => p.host === data.host);
        setSelectedProvider(provider ? provider.name : 'Personalizado');
      }
    } catch (error) {
      console.error('Error loading SMTP configuration:', error);
    }
  };

  const handleProviderChange = (providerName) => {
    const provider = providers.find(p => p.name === providerName);
    setSelectedProvider(providerName);

    if (provider && provider.name !== 'Personalizado') {
      setConfig(prev => ({
        ...prev,
        host: provider.host,
        port: provider.port,
        secure: provider.secure
      }));
    }
  };

  const handleConfigChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setConfig(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/config/smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Configuración SMTP guardada exitosamente'
        });
      } else {
        throw new Error('Error al guardar la configuración');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error al guardar la configuración SMTP'
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!testEmail) {
      setMessage({
        type: 'error',
        text: 'Por favor, ingresa un email de prueba'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    setMessage(null);

    try {
      const response = await fetch('/api/config/smtp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          config,
          testEmail
        })
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Conexión SMTP exitosa. Email de prueba enviado.'
        });
      } else {
        setTestResult({
          success: false,
          message: result.message || 'Error en la conexión SMTP'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Error al probar la conexión SMTP'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Configuración SMTP
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Configura el servidor de correo electrónico para el sistema
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg mb-4 transition-all duration-300 ${message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
              }`}
          >
            {message.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Provider Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Proveedor de Correo
            </h3>
            <div className="space-y-2">
              {providers.map((provider) => (
                <button
                  key={provider.name}
                  onClick={() => handleProviderChange(provider.name)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${selectedProvider === provider.name
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {provider.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Configuración del Servidor
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Servidor y Puerto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Servidor SMTP
                </label>
                <input
                  type="text"
                  value={config.host}
                  onChange={(e) => handleConfigChange('host', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="smtp.ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Puerto
                </label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Seguridad */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Conexión
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => handleConfigChange('secure', false)}
                    className={`p-3 rounded-lg border text-center transition-colors duration-200 ${!config.secure
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <div className="font-medium">STARTTLS</div>
                    <div className="text-sm text-gray-500">Puerto 587</div>
                  </button>
                  <button
                    onClick={() => handleConfigChange('secure', true)}
                    className={`p-3 rounded-lg border text-center transition-colors duration-200 ${config.secure
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <div className="font-medium">SSL/TLS</div>
                    <div className="text-sm text-gray-500">Puerto 465</div>
                  </button>
                  <button
                    onClick={() => {
                      handleConfigChange('secure', false);
                      handleConfigChange('port', 25);
                    }}
                    className={`p-3 rounded-lg border text-center transition-colors duration-200 ${!config.secure && config.port === 25
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <div className="font-medium">Sin Cifrado</div>
                    <div className="text-sm text-gray-500">Puerto 25</div>
                  </button>
                </div>
              </div>

              {/* Autenticación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  value={config.auth.user}
                  onChange={(e) => handleConfigChange('auth.user', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={config.auth.pass}
                  onChange={(e) => handleConfigChange('auth.pass', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                />
              </div>

              {/* Información del remitente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email del Remitente
                </label>
                <input
                  type="email"
                  value={config.fromEmail}
                  onChange={(e) => handleConfigChange('fromEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="noreply@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Remitente
                </label>
                <input
                  type="text"
                  value={config.fromName}
                  onChange={(e) => handleConfigChange('fromName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="CBTECH-ERP"
                />
              </div>

              {/* Configuración avanzada */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Configuración Avanzada
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timeout (ms)
                    </label>
                    <input
                      type="number"
                      value={config.timeout}
                      onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max. Conexiones
                    </label>
                    <input
                      type="number"
                      value={config.maxConnections}
                      onChange={(e) => handleConfigChange('maxConnections', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max. Mensajes
                    </label>
                    <input
                      type="number"
                      value={config.maxMessages}
                      onChange={(e) => handleConfigChange('maxMessages', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={saveConfiguration}
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Test Connection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Probar Conexión
        </h3>
        <div className="flex space-x-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email de Prueba
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="test@ejemplo.com"
            />
          </div>
          <button
            onClick={testConnection}
            disabled={testing || !config.host || !config.auth.user}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {testing ? 'Probando...' : 'Probar Conexión'}
          </button>
        </div>

        {testResult && (
          <div
            className={`mt-4 p-4 rounded-lg transition-all duration-300 ${testResult.success
                ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
              }`}
          >
            <div className="flex items-center space-x-2">
              {testResult.success ? (
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span>{testResult.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServidorSMTP;