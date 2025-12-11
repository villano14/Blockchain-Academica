document.addEventListener('DOMContentLoaded', () => {
    // Navegación simple
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);

            // Actualizar clases activas
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === targetId) {
                    s.classList.add('active');
                }
            });
        });
    });

    // --- Módulo 1: Hashing ---
    const hashInput = document.getElementById('hash-input');
    const hashOutput = document.getElementById('hash-output');
    const bitsGrid = document.getElementById('bits-grid');
    const changedBitsCount = document.getElementById('changed-bits-count');
    const moduleHashing = document.getElementById('module-hashing');

    // Inicializar Grid de Bits (256 bits)
    let previousBits = new Array(256).fill('0');

    function initBitGrid() {
        if (!bitsGrid) return;
        bitsGrid.innerHTML = '';
        for (let i = 0; i < 256; i++) {
            const bit = document.createElement('div');
            bit.className = 'bit';
            bitsGrid.appendChild(bit);
        }
    }
    initBitGrid();

    // Matrix Rain Effect (Simplificado para coexistir)
    if (moduleHashing) {
        const canvas = document.createElement('canvas');
        canvas.classList.add('matrix-canvas');
        moduleHashing.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            canvas.width = moduleHashing.offsetWidth;
            canvas.height = moduleHashing.offsetHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const chars = '0123456789ABCDEF';
        const drops = [];
        const fontSize = 14;

        function initRain() {
            const columns = canvas.width / fontSize;
            drops.length = 0;
            for (let i = 0; i < columns; i++) {
                drops[i] = 1;
            }
        }
        initRain();

        function drawRain() {
            ctx.fillStyle = 'rgba(10, 14, 23, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00f2ff';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        let rainInterval;

        function hexToBinary(hex) {
            return hex.split('').map(char =>
                parseInt(char, 16).toString(2).padStart(4, '0')
            ).join('');
        }

        async function updateHash(text) {
            if (!text) {
                hashOutput.textContent = '...';
                clearInterval(rainInterval);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            if (!rainInterval) {
                initRain();
                rainInterval = setInterval(drawRain, 50);
            }

            const msgBuffer = new TextEncoder().encode(text);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            hashOutput.textContent = hashHex;

            // Actualizar Bits y Efecto Avalancha
            const currentBits = hexToBinary(hashHex).split('');
            const bitElements = bitsGrid.children;
            let changes = 0;

            currentBits.forEach((bit, index) => {
                if (bitElements[index]) {
                    const el = bitElements[index];
                    const isOne = bit === '1';

                    // Estado base
                    if (isOne) {
                        el.classList.add('active');
                    } else {
                        el.classList.remove('active');
                    }

                    // Detectar cambio
                    if (bit !== previousBits[index]) {
                        changes++;
                        el.classList.remove('changed');
                        void el.offsetWidth; // Trigger reflow
                        el.classList.add('changed');
                    }
                }
            });

            previousBits = currentBits;
            changedBitsCount.textContent = changes;

            clearTimeout(window.rainTimeout);
            window.rainTimeout = setTimeout(() => {
                clearInterval(rainInterval);
                rainInterval = null;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }, 500);
        }

        if (hashInput) {
            hashInput.addEventListener('input', (e) => {
                updateHash(e.target.value);
            });
        }
    }

    // --- Módulo 2: Blockchain Global (Interactivo) ---
    // Helper function for SHA256 hashing
    async function sha256(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    class GlobalBlockchain {
        constructor() {
            this.chain = [];
            this.difficulty = 2;
            this.init();
        }

        async init() {
            const genesisBlock = await this.createGenesisBlock();
            this.chain.push(genesisBlock);
            this.render();
        }

        async createGenesisBlock() {
            const timestamp = new Date().toLocaleTimeString();
            const data = "Genesis Block";
            const prevHash = "0";
            let nonce = 0;
            let hash = await this.calculateHash(0, prevHash, timestamp, data, nonce);

            // Mine the Genesis Block so it is valid by default
            while (hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
                nonce++;
                hash = await this.calculateHash(0, prevHash, timestamp, data, nonce);
            }

            return {
                index: 0,
                timestamp,
                data,
                previousHash: prevHash,
                hash,
                nonce
            };
        }

        getLatestBlock() {
            return this.chain[this.chain.length - 1];
        }

        async addBlock(data) {
            const previousBlock = this.getLatestBlock();
            const index = previousBlock.index + 1;
            const timestamp = new Date().toLocaleTimeString();
            let nonce = 0;
            let hash = await this.calculateHash(index, previousBlock.hash, timestamp, data, nonce);

            // Minado simple (Proof of Work)
            while (hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
                nonce++;
                hash = await this.calculateHash(index, previousBlock.hash, timestamp, data, nonce);
            }

            const newBlock = {
                index,
                timestamp,
                data,
                previousHash: previousBlock.hash,
                hash,
                nonce
            };
            this.chain.push(newBlock);
            this.render();
        }

        async calculateHash(index, previousHash, timestamp, data, nonce) {
            return await sha256(index + previousHash + timestamp + data + nonce);
        }

        // Actualizar datos de un bloque (Tampering)
        async updateBlockData(index, newData) {
            if (index >= 0 && index < this.chain.length) {
                this.chain[index].data = newData;
                // Al cambiar datos, el hash cambia inmediatamente (sin minar aún)
                this.chain[index].hash = await this.calculateHash(
                    this.chain[index].index,
                    this.chain[index].previousHash,
                    this.chain[index].timestamp,
                    this.chain[index].data,
                    this.chain[index].nonce
                );
                this.render();
            }
        }

        // Re-minar un bloque específico
        async mineBlock(index) {
            if (index >= 0 && index < this.chain.length) {
                const block = this.chain[index];
                // Si no es el genesis, asegurarse de que previousHash coincida con el anterior (Chain Repair)
                if (index > 0) {
                    block.previousHash = this.chain[index - 1].hash;
                }

                let nonce = 0;
                let hash = await this.calculateHash(block.index, block.previousHash, block.timestamp, block.data, nonce);

                // Buscar nonce válido
                while (hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
                    nonce++;
                    hash = await this.calculateHash(block.index, block.previousHash, block.timestamp, block.data, nonce);
                }

                block.nonce = nonce;
                block.hash = hash;
                this.render();
            }
        }

        render() {
            const track = document.getElementById('blockchain-track');
            if (!track) return;
            track.innerHTML = '';

            let previousBlockHash = "0";

            this.chain.forEach((block, i) => {
                // Validar estado visual del bloque
                let isValidHash = block.hash.substring(0, this.difficulty) === Array(this.difficulty + 1).join("0");
                let isLinkValid = block.previousHash === previousBlockHash;

                if (i === 0) isLinkValid = true;

                const isBlockValid = isValidHash && isLinkValid;

                // Actualizar hash previo para la siguiente iteración
                previousBlockHash = block.hash;

                const card = document.createElement('div');
                card.className = `block-card ${isBlockValid ? 'valid' : 'invalid'}`;

                // Input para Data (Editable)
                const dataInput = `<input type="text" class="block-data-input" 
                    value="${block.data}" 
                    oninput="window.globalChain.updateBlockData(${i}, this.value)">`;

                // Botón de Minar (Solo si es inválido)
                const mineBtn = !isBlockValid ?
                    `<button class="btn-mine-small" onclick="window.globalChain.mineBlock(${i})">🔨 Minar (Reparar)</button>` :
                    '';

                card.innerHTML = `
                    <div class="block-header">
                        <span>BLOQUE #${block.index}</span>
                        <span style="font-size: 0.8rem; opacity: 0.7;">${block.timestamp}</span>
                    </div>
                    <div class="block-input-group">
                        <label>Datos:</label>
                        ${dataInput}
                    </div>
                    <div class="block-input-group">
                        <label>Nonce:</label>
                        <div class="code-display small">${block.nonce}</div>
                    </div>
                    <div class="block-input-group">
                        <label>Previous Hash:</label>
                        <div class="prev-hash ${isLinkValid ? '' : 'text-red'}">${block.previousHash.substring(0, 20)}...</div>
                    </div>
                    <div class="block-input-group">
                        <label>Hash:</label>
                        <div class="code-display small ${isValidHash ? '' : 'text-red'}">${block.hash.substring(0, 20)}...</div>
                    </div>
                    ${mineBtn}
                `;
                track.appendChild(card);
            });
        }
    }

    // Inicializar Blockchain Global
    window.globalChain = new GlobalBlockchain();

    // Reset Button
    const btnReset = document.getElementById('btn-reset-chain');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            window.globalChain = new GlobalBlockchain();
        });
    }

    // --- Módulo 3: Firmas Digitales (Interactivo - Man-in-the-Middle) ---
    const sigAliceMsg = document.getElementById('sig-alice-msg');
    const btnSigSign = document.getElementById('btn-sig-sign');
    const aliceStatus = document.getElementById('alice-status');

    const sigPacketContainer = document.getElementById('sig-packet-container');
    const sigPacket = document.getElementById('sig-packet');
    const sigPacketData = document.getElementById('sig-packet-data');
    const btnSigTamper = document.getElementById('btn-sig-tamper');
    const tamperModal = document.getElementById('tamper-modal');
    const tamperMsgInput = document.getElementById('tamper-msg-input');
    const btnTamperApply = document.getElementById('btn-tamper-apply');

    const bobReceivedMsg = document.getElementById('bob-received-msg');
    const btnSigVerify = document.getElementById('btn-sig-verify');
    const bobVerificationResult = document.getElementById('bob-verification-result');
    const bobHashMsg = document.getElementById('bob-hash-msg');
    const bobHashSig = document.getElementById('bob-hash-sig');
    const finalResultBadge = document.getElementById('final-result-badge');

    let currentSigKeyPair = null;
    let currentSigValue = null;
    let currentMsgInTransit = "";
    let isTampered = false;

    // Generar claves para este módulo
    async function initSigKeys() {
        currentSigKeyPair = await crypto.subtle.generateKey(
            {
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["sign", "verify"]
        );
    }
    initSigKeys();

    // 1. Alice Firma y Envía
    if (btnSigSign) {
        btnSigSign.addEventListener('click', async () => {
            if (!currentSigKeyPair) return;

            const msg = sigAliceMsg.value;
            if (!msg) return;

            // Firmar
            const encoder = new TextEncoder();
            const data = encoder.encode(msg);
            currentSigValue = await crypto.subtle.sign(
                "RSASSA-PKCS1-v1_5",
                currentSigKeyPair.privateKey,
                data
            );

            // UI Updates
            aliceStatus.classList.remove('hidden');
            aliceStatus.textContent = "Firmando...";

            setTimeout(() => {
                aliceStatus.textContent = "Enviado a la Red ➔";

                // Reset Network & Bob
                sigPacketContainer.classList.remove('hidden');
                sigPacketContainer.classList.remove('paused');
                sigPacketData.textContent = msg;
                sigPacketData.style.color = "#e2e8f0"; // Reset color
                currentMsgInTransit = msg;
                isTampered = false;

                bobReceivedMsg.textContent = "Esperando...";
                bobReceivedMsg.classList.add('empty');
                btnSigVerify.disabled = true;
                bobVerificationResult.classList.add('hidden');

                // Animar entrada del paquete
                sigPacket.style.animation = 'none';
                sigPacket.offsetHeight; /* trigger reflow */
                sigPacket.style.animation = 'flyInLeft 0.5s ease-out forwards';
            }, 500);
        });
    }

    // 2. Interceptar (Tamper)
    if (btnSigTamper) {
        btnSigTamper.addEventListener('click', () => {
            sigPacketContainer.classList.add('paused'); // Show controls permanently
            tamperModal.classList.remove('hidden');
            tamperMsgInput.value = currentMsgInTransit;
        });
    }

    // 3. Aplicar Hackeo
    if (btnTamperApply) {
        btnTamperApply.addEventListener('click', () => {
            const newMsg = tamperMsgInput.value;
            if (newMsg !== currentMsgInTransit) {
                currentMsgInTransit = newMsg;
                isTampered = true;
                sigPacketData.textContent = newMsg;
                sigPacketData.style.color = "#ef4444"; // Red text to indicate change (visual hint)
            }
            tamperModal.classList.add('hidden');

            // Simular reenvío a Bob
            setTimeout(() => {
                deliverToBob();
            }, 500);
        });
    }

    // Función para entregar a Bob (se llama si no se intercepta o después de interceptar)
    // Para simplificar, si el usuario NO intercepta, puede hacer click en el paquete para "Dejar pasar"
    if (sigPacket) {
        sigPacket.addEventListener('click', () => {
            if (!tamperModal.classList.contains('hidden')) return; // Si modal abierto, no hacer nada
            deliverToBob();
        });
    }

    function deliverToBob() {
        sigPacketContainer.classList.add('hidden');

        bobReceivedMsg.textContent = currentMsgInTransit;
        bobReceivedMsg.classList.remove('empty');
        if (isTampered) {
            bobReceivedMsg.style.color = "#ef4444";
        } else {
            bobReceivedMsg.style.color = "#e2e8f0";
        }

        btnSigVerify.disabled = false;
        btnSigVerify.classList.add('pulse'); // Highlight button
    }

    // 4. Bob Verifica
    if (btnSigVerify) {
        btnSigVerify.addEventListener('click', async () => {
            btnSigVerify.classList.remove('pulse');
            btnSigVerify.textContent = "Verificando...";

            // Simular proceso
            setTimeout(async () => {
                const encoder = new TextEncoder();

                // A. Hash del Mensaje Recibido
                const msgData = encoder.encode(currentMsgInTransit);
                const msgHashBuf = await crypto.subtle.digest('SHA-256', msgData);
                const msgHashArr = Array.from(new Uint8Array(msgHashBuf));
                const msgHashHex = msgHashArr.slice(0, 10).map(b => b.toString(16).padStart(2, '0')).join('') + '...';

                // B. Verificar Firma (Matemáticamente)
                const isValid = await crypto.subtle.verify(
                    "RSASSA-PKCS1-v1_5",
                    currentSigKeyPair.publicKey,
                    currentSigValue,
                    msgData
                );

                // Mostrar Resultados
                bobVerificationResult.classList.remove('hidden');
                bobHashMsg.textContent = msgHashHex;

                // En realidad, RSA verify no te da el "hash descifrado" directamente en la API WebCrypto de alto nivel,
                // pero conceptualmente comparamos lo que la firma "dice" vs lo que el mensaje "es".
                // Para efectos educativos, si es válido, los hashes coinciden. Si no, mostramos uno diferente.

                if (isValid) {
                    bobHashSig.textContent = msgHashHex; // Coinciden
                    bobHashSig.style.color = "#10b981";
                    bobHashMsg.style.color = "#10b981";

                    finalResultBadge.className = "result-badge valid";
                    finalResultBadge.innerHTML = "✅ FIRMA VÁLIDA<br><small>El mensaje es auténtico</small>";
                } else {
                    // Generar un hash falso para visualización de mismatch
                    bobHashSig.textContent = "0xBAD173...";
                    bobHashSig.style.color = "#ef4444";
                    bobHashMsg.style.color = "#ef4444";

                    finalResultBadge.className = "result-badge invalid";
                    finalResultBadge.innerHTML = "❌ FIRMA INVÁLIDA<br><small>El mensaje fue alterado</small>";
                }

                btnSigVerify.textContent = "Verificar Firma";
            }, 1000);
        });
    }

    // --- Simulator Elements ---
    const btnTxValid = document.getElementById('btn-tx-valid');
    const btnTxInvalid = document.getElementById('btn-tx-invalid');
    const btnSimReset = document.getElementById('btn-sim-reset');

    const aliceTxData = document.getElementById('alice-tx-data');
    const minerVerification = document.getElementById('miner-verification');

    const networkSpace = document.getElementById('network-space');
    const consoleOutput = document.getElementById('console-output');
    const miniChain = document.getElementById('mini-chain');

    let blockCount = 0;
    let isSimulating = false;

    // --- Helper Functions ---
    function getTimestamp() {
        const now = new Date();
        return `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
    }

    function log(msg, type = 'info') {
        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        line.textContent = `${getTimestamp()} ${msg}`;
        consoleOutput.appendChild(line);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    function createPayload(isTampered) {
        const packet = document.createElement('div');
        packet.className = 'packet-card';

        const iconMail = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
        const iconCheck = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

        packet.innerHTML = `
            <div class="packet-header">
                ${iconMail}
                <span>Payload</span>
            </div>
            <div class="packet-content">
                ${isTampered ? 'Enviar 100 BTC a Eve' : 'Enviar 10 BTC a Bob'}
            </div>
            <div class="packet-sig">
                <span class="icon-check-red">${iconCheck}</span>
                <span>Sig(0x8f2a...)</span>
            </div>
        `;
        return packet;
    }

    function addBlockToChain(hash, data) {
        const chainContainer = document.getElementById('mini-chain');
        const blockIndex = chainContainer.children.length;

        const block = document.createElement('div');
        block.className = 'mini-block-item pop-in';
        block.innerHTML = `
            <div class="block-title">Block #${blockIndex}</div>
            <div class="block-hash">Hash: ${hash.substring(0, 10)}...</div>
            <div class="block-data">${data.substring(0, 20)}...</div>
        `;

        chainContainer.insertBefore(block, chainContainer.firstChild);

        // SYNC: Add to Global Interactive Blockchain
        if (typeof window.globalChain !== 'undefined') {
            window.globalChain.addBlock(data);
        }
    }

    function createInterceptionOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'interception-overlay';
        overlay.innerHTML = `
            <svg class="interception-icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 2a10 10 0 0 1 10 10h-10V2z"></path><path d="M2 12a10 10 0 0 0 10 10V12H2z"></path></svg>
            <div class="interception-title">¡INTERCEPTADO!</div>
            <div class="interception-desc">Modificando datos...</div>
        `;
        return overlay;
    }

    async function runSimulation(isTampered) {
        if (isSimulating) return;
        isSimulating = true;

        aliceTxData.classList.add('hidden-section');
        minerVerification.classList.add('hidden-section');
        document.getElementById('panel-miner').classList.remove('miner-glow');

        minerVerification.innerHTML = `
            <div class="verif-header">VERIFICACIÓN</div>
            <div class="verif-step">
                <span class="step-label">1. Calc. Hash (Datos):</span>
                <span class="step-value loading" id="verif-hash">Esperando...</span>
            </div>
            <div class="verif-step">
                <span class="step-label">2. Descifrar Firma (PubKey):</span>
                <span class="step-value loading" id="verif-sig">Esperando...</span>
            </div>
            <button class="btn-verif-waiting" id="btn-verif-status">
                ESPERANDO...
            </button>
        `;

        log(`Iniciando simulación de Transacción ${isTampered ? 'INVÁLIDA (Tampered)' : 'VÁLIDA'}...`);

        document.getElementById('panel-alice').classList.add('alice-glow');

        await new Promise(r => setTimeout(r, 1000));

        aliceTxData.classList.remove('hidden-section');
        log(`Alice crea datos: "Enviar 10 BTC a Bob"`);
        await new Promise(r => setTimeout(r, 1000));

        log(`Calculando Hash del mensaje: 0x8f2a...11`);
        await new Promise(r => setTimeout(r, 1000));

        log(`Alice firma el hash con su Llave Privada.`);
        await new Promise(r => setTimeout(r, 1000));

        document.getElementById('panel-alice').classList.remove('alice-glow');

        log(`Transmitiendo paquete a la red...`);
        const packet = createPayload(false);
        networkSpace.appendChild(packet);

        const startX = 20;
        const endX = networkSpace.offsetWidth + 120;

        if (isTampered) {
            const midX = networkSpace.offsetWidth / 2 - 80;
            const anim1 = packet.animate([
                { transform: `translateX(${startX}px) scale(1)` },
                { transform: `translateX(${midX}px) scale(1)` }
            ], { duration: 1000, easing: 'ease-in-out', fill: 'forwards' });

            await anim1.finished;

            log(`¡ALERTA! Un atacante intercepta la transacción...`, 'warning');
            const overlay = createInterceptionOverlay();
            networkSpace.appendChild(overlay);

            await new Promise(r => setTimeout(r, 1500));

            log(`Atacante modifica el monto a 1000 BTC.`, 'warning');
            packet.querySelector('.packet-content').textContent = "Enviar 1000 BTC a Bob";
            packet.querySelector('.packet-content').style.color = "#ef4444";

            await new Promise(r => setTimeout(r, 1000));

            log(`Atacante reenvía el paquete modificado.`, 'warning');
            networkSpace.removeChild(overlay);

            const anim2 = packet.animate([
                { transform: `translateX(${midX}px) scale(1)`, opacity: 1 },
                { transform: `translateX(${endX}px) scale(0.5)`, opacity: 0 }
            ], { duration: 800, easing: 'ease-in', fill: 'forwards' });

            await anim2.finished;

        } else {
            const animation = packet.animate([
                { transform: `translateX(${startX}px) scale(1)`, opacity: 1 },
                { transform: `translateX(${endX}px) scale(0.5)`, opacity: 0 }
            ], { duration: 1200, easing: 'ease-in', fill: 'forwards' });
            await animation.finished;
        }

        networkSpace.removeChild(packet);

        document.getElementById('panel-miner').classList.add('miner-glow');
        setTimeout(() => {
            document.getElementById('panel-miner').classList.remove('miner-glow');
        }, 1000);

        log(`Minero recibe la transacción. Iniciando validación...`);
        minerVerification.classList.remove('hidden-section');

        const elHash = document.getElementById('verif-hash');
        elHash.textContent = "Calculando...";
        elHash.classList.add('text-orange');
        await new Promise(r => setTimeout(r, 1000));

        if (isTampered) {
            elHash.textContent = "0xBAD1...99";
            log(`Minero calcula hash de: "Enviar 1000 BTC a Bob"`);
        } else {
            elHash.textContent = "0x8f2a...11";
            log(`Minero calcula hash de: "Enviar 10 BTC a Bob"`);
        }
        elHash.classList.remove('loading');
        elHash.classList.add('yellow');

        const elSig = document.getElementById('verif-sig');
        elSig.textContent = "Descifrando...";
        elSig.classList.add('text-green');
        await new Promise(r => setTimeout(r, 1000));
        elSig.textContent = "0x8f2a...11";
        elSig.classList.remove('loading');
        elSig.classList.add('green');
        log(`Minero descifra la firma usando la Llave Pública de Alice...`);

        await new Promise(r => setTimeout(r, 500));

        const btnStatus = document.getElementById('btn-verif-status');

        if (isTampered) {
            btnStatus.className = 'btn-mismatch';
            btnStatus.innerHTML = `MISMATCH - RECHAZADO ✕`;

            log(`FALLO DE VERIFICACIÓN. El hash calculado no coincide con la firma.`, 'error');
            log(`Causa: Los datos fueron alterados después de ser firmados.`, 'error');
        } else {
            btnStatus.className = 'btn-verif-success';
            btnStatus.innerHTML = `¡HASH COINCIDE! ✓`;

            log(`Verificación exitosa. Los datos son íntegros y auténticos.`, 'success');
            await new Promise(r => setTimeout(r, 1000));

            log(`Minando bloque (Proof of Work)...`, 'success');
            await new Promise(r => setTimeout(r, 1500));

            const mockHash = "00004b68a577";
            addBlockToChain(mockHash, "Enviar 10 BTC a Bob");
            log(`Bloque #${blockCount} agregado a la blockchain exitosamente.`, 'success');
        }

        isSimulating = false;
    }

    if (btnTxValid) {
        btnTxValid.addEventListener('click', () => runSimulation(false));
        btnTxInvalid.addEventListener('click', () => runSimulation(true));

        btnSimReset.addEventListener('click', () => {
            consoleOutput.innerHTML = '<div class="console-line">> System ready. Select a simulation mode above.</div>';
            miniChain.innerHTML = `
                <div class="mini-block-item genesis">
                    <div class="block-title">Block #0 (Genesis)</div>
                    <div class="block-hash">Hash: 0000abc...</div>
                </div>
            `;
            blockCount = 0;
            aliceTxData.classList.add('hidden-section');
            minerVerification.classList.add('hidden-section');
            isSimulating = false;
        });
    }
});
