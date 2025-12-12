// ============================================================
// MÓDULO DE UTILIDADES (utils.js)
// Funções genéricas de formatação, exportação e UI
// ============================================================

// 1. FORMATAÇÃO DE DATAS E TEMPO
export function formatDate(dateString) {
    if (!dateString) return '-';
    // Converte YYYY-MM-DD para DD/MM/YYYY
    const partes = dateString.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dateString;
}

export function calculateTimeInUse(dateString) {
    if (!dateString) return '-';
    
    const start = new Date(dateString);
    const now = new Date();
    
    start.setHours(0,0,0,0);
    now.setHours(0,0,0,0);

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
        months--;
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    if (years === 0 && months === 0) return "Menos de um mês";

    let parts = [];
    if (years > 0) parts.push(`${years} ano(s)`);
    if (months > 0) parts.push(`${months} mês(es)`);
    
    return parts.join(' e ');
}

export function calculateDaysSince(dateString) {
    if (!dateString) return '-';
    const last = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return `${diffDays} dias`;
}

// Auxiliar para cálculo de datas (Relatório RH)
export function calcDateDiffString(startDateStr, endDateStr = null) {
    if(!startDateStr) return '-';
    
    const start = new Date(startDateStr);
    const end = endDateStr ? new Date(endDateStr) : new Date();
    
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    if(end < start) return "Data futura ou inválida";

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
        months--;
        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    const parts = [];
    if(years > 0) parts.push(`${years} ano(s)`);
    if(months > 0) parts.push(`${months} mês(es)`);
    if(days > 0) parts.push(`${days} dia(s)`);
    
    return parts.length > 0 ? parts.join(', ') : '0 dias';
}

export function getDaysDiff(dateString) {
    if (!dateString) return null;
    const parts = dateString.split('-');
    const targetDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 3600 * 24));
}

// 2. MÁSCARAS E FORMATAÇÃO DE TEXTO
export function formatPhoneNumber(value) {
    let v = value.replace(/\D/g, "");
    v = v.substring(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    return v;
}

export function formatCompetencia(value) {
    let v = value.replace(/\D/g, "");
    v = v.substring(0, 6);
    if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d)/, "$1/$2");
    }
    return v;
}

export function formatPeriodo(value) {
    let v = value.replace(/\D/g, "");
    v = v.substring(0, 8);
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, "$1/$2");
    if (v.length > 4) v = v.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2 à $3");
    if (v.length > 6) v = v.replace(/ à (\d{2})(\d)/, " à $1/$2");
    return v;
}

// 3. SANITIZAÇÃO (SEGURANÇA)
export function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    const textarea = document.createElement('textarea');
    textarea.textContent = input;
    let sanitized = textarea.innerHTML;
    sanitized = sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["']?[^"']*["']?/gi, '')
        .replace(/<iframe [^>]*>[\s\S]*?<\/iframe>/gi, '')
        .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
        .replace(/<embed [^>]*>/gi, '');
    return sanitized.trim();
}

// 4. INTERFACE (Toast e Notificações)
export function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    // Se for um toast de Undo, o HTML é diferente, mas a estrutura básica é essa
    // Se a mensagem contiver HTML (botão undo), usamos innerHTML, senão textContent
    if (message.includes('<') || message.includes('button')) {
        toast.innerHTML = message; 
    } else {
        toast.textContent = message;
    }
    
    toast.className = 'toast';
    void toast.offsetWidth; // Força reflow
    toast.classList.add(type);
    toast.classList.add('show');
    
    // Remove automaticamente após 3s se não for um toast com interação (ex: undo)
    if (!message.includes('button')) {
        setTimeout(function() {
            toast.classList.remove('show');
        }, 3000);
    }
}

// 5. EXPORTAÇÃO (Excel e PDF)
export function downloadXLSX(filename, headers, rows, sheetName = "Dados") {
    if (typeof XLSX === 'undefined') {
        alert('Erro: A biblioteca Excel (SheetJS) não carregou.');
        return;
    }
    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const colWidths = headers.map((h, i) => {
        let maxWidth = h.length;
        rows.forEach(row => {
            const cellValue = row[i] ? String(row[i]) : "";
            if (cellValue.length > maxWidth) maxWidth = cellValue.length;
        });
        return { wch: maxWidth + 5 };
    });
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename + ".xlsx");
}

// Mantendo downloadCSV para compatibilidade se algo ainda usar
export function downloadCSV(filename, headers, rows) {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function downloadPDF(title, headers, rows) {
    if (!window.jspdf) {
        alert('Biblioteca PDF não carregada.');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);

    if (doc.autoTable) {
        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 35,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [0, 61, 92] }
        });
    } else {
        // Fallback básico
        let y = 40;
        rows.forEach(row => {
            if (y > 180) { doc.addPage(); y = 20; }
            doc.text(row.join(' | ').substring(0, 120), 14, y);
            y += 7;
        });
    }
    doc.save(`${title}.pdf`);
}
