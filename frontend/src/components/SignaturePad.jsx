import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button, Box, Typography, TextField } from '@mui/material';
import { Eraser, Save, X } from 'lucide-react';

const SignaturePad = ({ onSave, onCancel }) => {
    const sigCanvas = useRef(null);
    const [recipientName, setRecipientName] = useState('');

    const clear = () => {
        sigCanvas.current.clear();
    };

    const handleSave = () => {
        if (sigCanvas.current.isEmpty()) {
            alert('Por favor, firme antes de guardar.');
            return;
        }
        
        const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        onSave({ signature: signatureData, recipientName });
    };

    return (
        <Box sx={{ 
            p: 3, 
            bgcolor: 'background.paper', 
            borderRadius: 2, 
            boxShadow: 24,
            maxWidth: 500,
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Firma de Entrega</Typography>
                <Button onClick={onCancel} color="inherit" size="small">
                    <X size={20} />
                </Button>
            </Box>

            <TextField
                label="Nombre de quien recibe"
                variant="outlined"
                fullWidth
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Escriba su nombre completo"
            />

            <Typography variant="caption" color="text.secondary">
                Firme en el recuadro gris:
            </Typography>

            <Box sx={{ 
                border: '1px solid #ccc', 
                borderRadius: 1, 
                bgcolor: '#f5f5f5',
                touchAction: 'none' // Prevents scrolling while signing
            }}>
                <SignatureCanvas 
                    ref={sigCanvas}
                    penColor='black'
                    canvasProps={{
                        width: 450, 
                        height: 200, 
                        className: 'sigCanvas',
                        style: { width: '100%', height: '200px' }
                    }}
                />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<Eraser size={18} />}
                    onClick={clear}
                >
                    Limpiar
                </Button>
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<Save size={18} />}
                    onClick={handleSave}
                >
                    Guardar Firma
                </Button>
            </Box>
        </Box>
    );
};

export default SignaturePad;
