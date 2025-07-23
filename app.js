async function splitSeed() {
    try {
        const seedPhrase = document.getElementById('seedInput').value.trim();
        
        // Check word count - only accept 24-word seeds
        const words = seedPhrase.split(/\s+/).filter(word => word.length > 0);
        if (words.length !== 24) {
            showError('splitResult', 'Only 24-word seed phrases are supported. You entered ' + words.length + ' words.');
            return;
        }
        
        // Validate BIP39 seed phrase
        if (!(await bip39.validateMnemonic(seedPhrase))) {
            showError('splitResult', 'Invalid BIP39 seed phrase: "' + seedPhrase + '"');
            return;
        }
        
        // Convert to entropy (hex)
        const entropy = await bip39.mnemonicToEntropy(seedPhrase);
        
        // Split using SSS (2 of 3 threshold) - ensure it's treated as a string
        const shares = secrets.share(entropy.toString(), 3, 2);
        
        // Display the hex shares directly - this is the most reliable approach
        showResult('splitResult', 
            `Share 1:\n${shares[0]}\n\n` +
            `Share 2:\n${shares[1]}\n\n` +
            `Share 3:\n${shares[2]}\n\n` +
            `Note: Copy these hex strings exactly. Use any 2 shares to reconstruct your seed.`
        );
        
    } catch (error) {
        showError('splitResult', 'Error splitting seed: ' + error.message);
    }
}

async function combineShares() {
    try {
        const share1Text = document.getElementById('share1').value.trim();
        const share2Text = document.getElementById('share2').value.trim();
        
        // Validate that inputs are hex strings (should be ~99 characters)
        if (!share1Text.match(/^[0-9a-fA-F]+$/) || !share2Text.match(/^[0-9a-fA-F]+$/)) {
            showError('combineResult', 'Please enter valid hex share strings');
            return;
        }
        
        if (share1Text.length < 90 || share2Text.length < 90) {
            showError('combineResult', 'Share strings appear too short - please check they are complete');
            return;
        }
        
        // Combine using SSS directly with the hex strings
        const reconstructed = secrets.combine([share1Text, share2Text]);
        
        // Convert back to mnemonic
        const reconstructedSeed = await bip39.entropyToMnemonic(reconstructed);
        
        showResult('combineResult', `Reconstructed seed:\n${reconstructedSeed}`);
        
    } catch (error) {
        showError('combineResult', 'Error combining shares: ' + error.message);
    }
}

function showResult(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="result">${message}</div>`;
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="error">${message}</div>`;
}

function clearAll() {
    document.getElementById('seedInput').value = '';
    document.getElementById('share1').value = '';
    document.getElementById('share2').value = '';
    document.getElementById('splitResult').innerHTML = '';
    document.getElementById('combineResult').innerHTML = '';
}

async function saveOffline() {
    try {
        // Fetch all the JavaScript files
        const bip39Response = await fetch('bip39.js');
        const bip39Content = await bip39Response.text();
        
        const secretsResponse = await fetch('secrets.js');
        const secretsContent = await secretsResponse.text();
        
        const appResponse = await fetch('app.js');
        let appContent = await appResponse.text();
        
        // Remove the saveOffline function from the app content to avoid recursion
        appContent = appContent.replace(/async function saveOffline\(\) \{[\s\S]*?\n\}/g, '');
        
        // Create clean HTML by reading the original source
        const originalResponse = await fetch(window.location.href);
        const htmlContent = await originalResponse.text();
        
        // Replace the script tags with inline scripts
        const bundledHTML = htmlContent
            .replace('<script src="bip39.js"></script>', `<script>${bip39Content}</script>`)
            .replace('<script src="secrets.js"></script>', `<script>${secretsContent}</script>`)
            .replace('<script src="app.js"></script>', `<script>${appContent}</script>`);
        
        // Create and download the complete offline file
        const blob = new Blob([bundledHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bip39-sss-tool-complete-offline.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Complete offline file saved! This file contains everything needed and works without internet.');
        
    } catch (error) {
        console.error('Error saving offline file:', error);
        alert('Error saving offline file. Make sure you are running this from a web server (not file://)');
    }
}
