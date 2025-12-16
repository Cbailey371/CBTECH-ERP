import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const RolesManagerTest = () => {
  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Gestión de Roles - Componente de Prueba
        </Typography>
        <Typography variant="body1">
          Este es un componente de prueba para verificar que el sistema funciona correctamente.
        </Typography>
      </Paper>
    </Box>
  );
};

export default RolesManagerTest;