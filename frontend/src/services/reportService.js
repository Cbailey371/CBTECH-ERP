import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getHeaders = (token) => ({
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

export const getReportSchema = async (token, entity) => {
    try {
        const response = await axios.get(`${API_URL}/reports/schema/${entity}`, getHeaders(token));
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error fetching report schema:', error);
        return { success: false, message: 'Error fetching schema' };
    }
};

export const getReportPreview = async (token, config) => {
    try {
        const response = await axios.post(`${API_URL}/reports/generate`, config, getHeaders(token));
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error('Error generating report preview:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Error generating report'
        };
    }
};

export const exportReport = async (token, config, format = 'excel') => {
    try {
        const response = await axios.post(
            `${API_URL}/reports/export`,
            { ...config, format },
            {
                ...getHeaders(token),
                responseType: 'arraybuffer' // Important for binary data
            }
        );

        // Create blob and download
        const type = format === 'excel'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv';

        const blob = new Blob([response.data], { type });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `report-${config.entity}-${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`;

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 1000);

        return { success: true };

    } catch (error) {
        console.error('Error exporting report:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Error exporting report'
        };
    }
};
