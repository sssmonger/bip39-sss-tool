function splitSeed() {
    try {
        const seedPhrase = document.getElementById('seedInput').value.trim();
        
        // Validate BIP39 seed phrase
        if (!bip39.validateMnemonic(seedPhrase)) {
            showError('splitResult', 'Invalid BIP39 seed phrase');
            return;
        }
        
        // Convert to entropy (hex)
        const entropy = bip39.mnemonicToEntropy(seedPhrase);
        
        // Split using SSS (2 of 3 threshold)
        const shares = secrets.share(entropy, 3, 2);
        
        // Convert shares back to word format - NO PREFIX
        const wordShares = shares.map((share, index) => {
            const shareMnemonic = bip39.entropyToMnemonic(share);
            return shareMnemonic;  // Just the words, no "Share X:" prefix
        });
        
        showResult('splitResult', 
            `Share 1:\n${wordShares[0]}\n\n` +
            `Share 2:\n${wordShares[1]}\n\n` +
            `Share 3:\n${wordShares[2]}`
        );
        
    } catch (error) {
        showError('splitResult', 'Error splitting seed: ' + error.message);
    }
}

function combineShares() {
    try {
        const share1Text = document.getElementById('share1').value.trim();
        const share2Text = document.getElementById('share2').value.trim();
        
        // No need to extract - just validate directly
        if (!bip39.validateMnemonic(share1Text) || !bip39.validateMnemonic(share2Text)) {
            showError('combineResult', 'Invalid share mnemonic');
            return;
        }
        
        // Convert to entropy
        const entropy1 = bip39.mnemonicToEntropy(share1Text);
        const entropy2 = bip39.mnemonicToEntropy(share2Text);
        
        // Combine using SSS
        const reconstructed = secrets.combine([entropy1, entropy2]);
        
        // Convert back to mnemonic
        const reconstructedSeed = bip39.entropyToMnemonic(reconstructed);
        
        showResult('combineResult', `Reconstructed seed:\n${reconstructedSeed}`);
        
    } catch (error) {
        showError('combineResult', 'Error combining shares: ' + error.message);
    }
}
