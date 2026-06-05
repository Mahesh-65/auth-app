const express = require('express');
const path = require('path');
const { DefaultAzureCredential } = require('@azure/identity');

const app = express();
const PORT = process.env.PORT || 8080;

// 1. Serve the static frontend SPA
app.use(express.static(path.join(__dirname, 'public')));

// 2. Standard Backend API (Can be used to demonstrate API Protection later)
app.get('/api/data', (req, res) => {
    res.json({
        message: "Hello from the Node.js backend!",
        timestamp: new Date().toISOString()
    });
});

// 3. Managed Identity Demonstration Route
// When you enable System-Assigned Identity on the App Service, hitting this route 
// will prove that the code can authenticate to Azure without any hardcoded secrets.
app.get('/api/managed-identity', async (req, res) => {
    try {
        console.log("Attempting to get token using Managed Identity...");
        
        // DefaultAzureCredential automatically detects the App Service Managed Identity
        const credential = new DefaultAzureCredential();
        
        // Requesting a token for the Azure Resource Manager as an example scope
        const tokenResponse = await credential.getToken("https://management.azure.com/.default");
        
        res.json({
            success: true,
            message: "Successfully acquired token using App Service Managed Identity!",
            tokenPreview: tokenResponse.token.substring(0, 20) + "...", // Truncated for security in demo
            expiresOn: tokenResponse.expiresOnTimestamp
        });
    } catch (error) {
        console.error("Managed Identity Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to get token. Is Managed Identity enabled on the App Service?",
            error: error.message
        });
    }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Test Managed Identity at: http://localhost:${PORT}/api/managed-identity`);
});
