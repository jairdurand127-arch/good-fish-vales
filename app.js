// Estado global
let currentVoucher = null;
let allVouchers = [];

// Cargar vales del localStorage
function loadVouchers() {
    const stored = localStorage.getItem('goodfish_vouchers');
    allVouchers = stored ? JSON.parse(stored) : [];
    return allVouchers;
}

// Guardar vales en localStorage
function saveVouchers() {
    localStorage.setItem('goodfish_vouchers', JSON.stringify(allVouchers));
}

// Generar código único
function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'GF-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Verificar que no exista
    const exists = allVouchers.some(v => v.code === code);
    return exists ? generateCode() : code;
}

// Mostrar vista
function showView(viewName) {
    // Ocultar todas las vistas
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('hidden');
    });
    
    // Mostrar vista seleccionada
    const view = document.getElementById(viewName + '-view');
    if (view) {
        view.classList.remove('hidden');
    }
    
    // Cargar datos si es necesario
    if (viewName === 'list') {
        loadVouchersList();
    }
}

// Crear vale
function createVoucher() {
    const customerName = document.getElementById('customer-name').value.trim() || 'Cliente';
    const amount = parseFloat(document.getElementById('amount').value);
    const maxUses = parseInt(document.getElementById('max-uses').value);
    
    if (!amount || amount <= 0) {
        alert('⚠️ Por favor ingresa un monto válido');
        return;
    }
    
    const code = generateCode();
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    
    const voucher = {
        code,
        amount,
        maxUses,
        usedCount: 0,
        customerName,
        createdAt: now.toISOString(),
        expiryDate: expiryDate.toISOString(),
        status: 'active',
        usageHistory: []
    };
    
    allVouchers.push(voucher);
    saveVouchers();
    currentVoucher = voucher;
    
    // Limpiar formulario
    document.getElementById('customer-name').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('max-uses').value = '1';
    
    // Mostrar vale
    displayVoucher(voucher);
    showView('display');
}

// Mostrar vale creado
function displayVoucher(voucher) {
    document.getElementById('display-code').textContent = voucher.code;
    document.getElementById('display-amount').textContent = `S/ ${voucher.amount.toFixed(2)}`;
    document.getElementById('qr-image').src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${voucher.code}`;
    
    const info = `
        <div style="margin: 10px 0;"><strong>Cliente:</strong> ${voucher.customerName}</div>
        <div style="margin: 10px 0;"><strong>Usos permitidos:</strong> ${voucher.maxUses} ${voucher.maxUses === 1 ? 'vez' : 'veces'}</div>
        <div style="margin: 10px 0;"><strong>Válido hasta:</strong> ${formatDate(voucher.expiryDate)}</div>
        <div style="margin: 10px 0;"><strong>Creado:</strong> ${formatDate(voucher.createdAt)}</div>
    `;
    document.getElementById('display-info').innerHTML = info;
}

// Formatear fecha
function formatDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Descargar vale como imagen
async function downloadVoucher() {
    if (!currentVoucher) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    
    // Fondo blanco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Encabezado
    ctx.fillStyle = '#0891b2';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🐟 GOOD FISH CEVICHERÍA 🐟', 400, 60);
    
    ctx.fillStyle = '#666666';
    ctx.font = '24px Arial';
    ctx.fillText('Vale de Consumo', 400, 100);
    
    // Contenedor QR con borde
    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(150, 130, 500, 350);
    ctx.setLineDash([]);
    
    // Cargar imagen QR
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${currentVoucher.code}`;
    
    await new Promise((resolve) => {
        qrImg.onload = () => {
            ctx.drawImage(qrImg, 250, 170, 300, 300);
            resolve();
        };
        qrImg.onerror = () => resolve();
    });
    
    // Código
    ctx.fillStyle = '#0891b2';
    ctx.font = 'bold 48px Courier';
    ctx.fillText(currentVoucher.code, 400, 540);
    
    // Monto
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 72px Arial';
    ctx.fillText(`S/ ${currentVoucher.amount.toFixed(2)}`, 400, 630);
    
    // Información
    ctx.fillStyle = '#333333';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Cliente:', 100, 700);
    ctx.font = '24px Arial';
    ctx.fillText(currentVoucher.customerName, 220, 700);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Usos permitidos:', 100, 740);
    ctx.font = '24px Arial';
    ctx.fillText(`${currentVoucher.maxUses} ${currentVoucher.maxUses === 1 ? 'vez' : 'veces'}`, 300, 740);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Válido hasta:', 100, 780);
    ctx.font = '24px Arial';
    ctx.fillText(formatDate(currentVoucher.expiryDate), 280, 780);
    
    // Línea separadora
    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 860);
    ctx.lineTo(700, 860);
    ctx.stroke();
    
    // Condiciones
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('CONDICIONES:', 100, 900);
    
    ctx.font = '18px Arial';
    const conditions = [
        '✓ Válido solo en Good Fish Cevichería',
        '✓ No es canjeable por dinero',
        '✓ Uso exclusivo del portador',
        '✓ Vigencia máxima de 1 mes',
        '✓ Presentar código al momento del pago'
    ];
    
    conditions.forEach((condition, index) => {
        ctx.fillText(condition, 120, 940 + (index * 30));
    });
    
    // Descargar
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Vale_GoodFish_${currentVoucher.code}.png`;
        link.click();
        URL.revokeObjectURL(url);
    });
}

// Compartir vale
async function shareVoucher() {
    if (!currentVoucher) return;
    
    const text = `🐟 GOOD FISH CEVICHERÍA
Vale de Consumo

💰 Monto: S/ ${currentVoucher.amount.toFixed(2)}
🎫 Código: ${currentVoucher.code}
👤 Cliente: ${currentVoucher.customerName}
📊 Usos: ${currentVoucher.maxUses} ${currentVoucher.maxUses === 1 ? 'vez' : 'veces'}
📅 Válido hasta: ${formatDate(currentVoucher.expiryDate)}

Presentar este código al momento del pago.`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Vale Good Fish',
                text: text
            });
        } catch (error) {
            copyToClipboard(text);
        }
    } else {
        copyToClipboard(text);
    }
}

// Copiar al portapapeles
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('✓ Información del vale copiada al portapapeles');
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('✓ Información del vale copiada');
    }
}

// Verificar vale
function verifyVoucher() {
    const code = document.getElementById('verify-code').value.trim().toUpperCase();
    
    if (!code) {
        alert('⚠️ Por favor ingresa un código');
        return;
    }
    
    loadVouchers();
    const voucher = allVouchers.find(v => v.code === code);
    
    const resultDiv = document.getElementById('verify-result');
    
    if (!voucher) {
        resultDiv.innerHTML = `
            <div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 12px; padding: 20px; color: #991b1b; text-align: center;">
                <div style="font-size: 48px;">❌</div>
                <div style="font-weight: bold; margin: 10px 0;">Vale no encontrado</div>
                <div>El código no existe en el sistema</div>
            </div>
        `;
        return;
    }
    
    const now = new Date();
    const expiry = new Date(voucher.expiryDate);
    const isExpired = now > expiry;
    const isUsed = voucher.usedCount >= voucher.maxUses;
    
    let statusHtml = '';
    let canUse = false;
    
    if (isExpired) {
        statusHtml = `
            <div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 12px; padding: 20px; color: #991b1b;">
                <div style="font-size: 48px; text-align: center;">⏱️</div>
                <div style="font-weight: bold; text-align: center; margin: 10px 0;">VALE EXPIRADO</div>
                <div style="text-align: center;">Este vale venció el ${formatDate(voucher.expiryDate)}</div>
            </div>
        `;
    } else if (isUsed) {
        statusHtml = `
            <div style="background: #e2e8f0; border: 2px solid #64748b; border-radius: 12px; padding: 20px; color: #475569;">
                <div style="font-size: 48px; text-align: center;">✓</div>
                <div style="font-weight: bold; text-align: center; margin: 10px 0;">VALE YA USADO</div>
                <div style="text-align: center;">Se utilizaron todos los usos permitidos (${voucher.maxUses})</div>
            </div>
        `;
    } else {
        canUse = true;
        statusHtml = `
            <div style="background: #d1fae5; border: 2px solid #059669; border-radius: 12px; padding: 20px; color: #065f46;">
                <div style="font-size: 48px; text-align: center;">✅</div>
                <div style="font-weight: bold; text-align: center; margin: 10px 0;">VALE DISPONIBLE</div>
                <div style="text-align: center; font-size: 36px; font-weight: bold; color: #059669; margin: 10px 0;">
                    S/ ${voucher.amount.toFixed(2)}
                </div>
            </div>
        `;
    }
    
    const infoHtml = `
        <div style="margin-top: 20px; text-align: left; background: #f8fafc; padding: 15px; border-radius: 8px;">
            <div style="margin: 8px 0;"><strong>Código:</strong> ${voucher.code}</div>
            <div style="margin: 8px 0;"><strong>Cliente:</strong> ${voucher.customerName}</div>
            <div style="margin: 8px 0;"><strong>Usos:</strong> ${voucher.usedCount}/${voucher.maxUses}</div>
            <div style="margin: 8px 0;"><strong>Vence:</strong> ${formatDate(voucher.expiryDate)}</div>
        </div>
    `;
    
    const buttonHtml = canUse ? `
        <button class="btn btn-success" onclick="applyVoucher('${voucher.code}')" style="margin-top: 15px;">
            ✓ Aplicar Vale Ahora
        </button>
    ` : '';
    
    resultDiv.innerHTML = statusHtml + infoHtml + buttonHtml;
}

// Aplicar vale
function applyVoucher(code) {
    loadVouchers();
    const voucherIndex = allVouchers.findIndex(v => v.code === code);
    
    if (voucherIndex === -1) return;
    
    const voucher = allVouchers[voucherIndex];
    const now = new Date();
    
    voucher.usedCount += 1;
    voucher.usageHistory.push({
        date: now.toISOString(),
        amount: voucher.amount
    });
    
    if (voucher.usedCount >= voucher.maxUses) {
        voucher.status = 'used';
    }
    
    allVouchers[voucherIndex] = voucher;
    saveVouchers();
    
    alert(`✅ ¡Vale aplicado exitosamente!\n\nMonto: S/ ${voucher.amount.toFixed(2)}\nUsos: ${voucher.usedCount}/${voucher.maxUses}`);
    
    document.getElementById('verify-code').value = '';
    verifyVoucher.code = code;
    verifyVoucher();
}

// Cargar lista de vales
function loadVouchersList() {
    loadVouchers();
    
    const active = allVouchers.filter(v => {
        const isExpired = new Date() > new Date(v.expiryDate);
        const isUsed = v.usedCount >= v.maxUses;
        return !isExpired && !isUsed;
    });
    
    const used = allVouchers.filter(v => v.usedCount >= v.maxUses);
    const expired = allVouchers.filter(v => {
        const isExpired = new Date() > new Date(v.expiryDate);
        return isExpired && v.usedCount < v.maxUses;
    });
    
    // Estadísticas
    const statsHtml = `
        <div class="stat-card" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);">
            <div class="stat-number" style="color: #059669;">${active.length}</div>
            <div class="stat-label">Activos</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" style="color: #64748b;">${used.length}</div>
            <div class="stat-label">Usados</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);">
            <div class="stat-number" style="color: #dc2626;">${expired.length}</div>
            <div class="stat-label">Expirados</div>
        </div>
    `;
    
    document.getElementById('stats-container').innerHTML = statsHtml;
    
    // Lista de vales
    let vouchersHtml = '';
    
    if (active.length > 0) {
        vouchersHtml += '<h3 style="color: #059669; margin: 20px 0 10px 0;">✓ Vales Activos</h3>';
        active.forEach(v => {
            vouchersHtml += createVoucherCard(v, 'active');
        });
    }
    
    if (used.length > 0) {
        vouchersHtml += '<h3 style="color: #64748b; margin: 20px 0 10px 0;">✗ Vales Usados</h3>';
        used.forEach(v => {
            vouchersHtml += createVoucherCard(v, 'used');
        });
    }
    
    if (expired.length > 0) {
        vouchersHtml += '<h3 style="color: #dc2626; margin: 20px 0 10px 0;">⏱️ Vales Expirados</h3>';
        expired.forEach(v => {
            vouchersHtml += createVoucherCard(v, 'expired');
        });
    }
    
    if (allVouchers.length === 0) {
        vouchersHtml = `
            <div style="text-align: center; padding: 40px; color: #94a3b8;">
                <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
                <div>No hay vales creados todavía</div>
            </div>
        `;
    }
    
    document.getElementById('vouchers-container').innerHTML = vouchersHtml;
}

// Crear tarjeta de vale
function createVoucherCard(voucher, status) {
    const statusClasses = {
        active: 'background: #d1fae5; border: 2px solid #059669; color: #065f46;',
        used: 'background: #e2e8f0; border: 2px solid #64748b; color: #475569;',
        expired: 'background: #fee2e2; border: 2px solid #dc2626; color: #991b1b;'
    };
    
    const statusIcons = {
        active: '✅',
        used: '✓',
        expired: '⏱️'
    };
    
    const statusText = {
        active: 'DISPONIBLE',
        used: 'USADO',
        expired: 'EXPIRADO'
    };
    
    return `
        <div style="${statusClasses[status]} border-radius: 12px; padding: 20px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <div style="font-family: monospace; font-size: 20px; font-weight: bold;">${voucher.code}</div>
                    <div style="font-size: 14px;">${voucher.customerName}</div>
                </div>
                <div style="font-weight: bold;">${statusIcons[status]} ${statusText[status]}</div>
            </div>
            <div style="font-size: 32px; font-weight: bold; margin-bottom: 10px;">S/ ${voucher.amount.toFixed(2)}</div>
            <div style="font-size: 14px;">
                <div>Usos: ${voucher.usedCount}/${voucher.maxUses}</div>
                <div>Vence: ${formatDate(voucher.expiryDate)}</div>
            </div>
        </div>
    `;
}

// Cargar vales al inicio
loadVouchers();
