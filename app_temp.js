// Gantilah URL ini dengan URL Cloudflare Worker Anda setelah di-deploy (misalnya: https://dbgang-api.username.workers.dev)
const BASE_API_URL = 'https://dbgang-api.cvpts.workers.dev';

const SCRIPT_URL = `${BASE_API_URL}/api/transactions`;

// URL untuk Cloudflare Worker Iuran Warga
const SCRIPT_URL_IURAN = `${BASE_API_URL}/api/iuran`;

// URL untuk Cloudflare Worker Program Kerja
const SCRIPT_URL_PROGRAM = `${BASE_API_URL}/api/program`;

// URL untuk Cloudflare Worker Inventaris
const SCRIPT_URL_INVENTARIS = `${BASE_API_URL}/api/inventaris`;

// URL untuk Cloudflare Worker Kritik & Saran
const SCRIPT_URL_SARAN = `${BASE_API_URL}/api/saran`;

// State
let transactions = [];
let currentFilteredTransactions = [];
let iuranData = [];
let inventarisData = [];
let programKerjaData = [];
let saranData = [];
let mobileMenuOpen = false;

// DOM Elements
const currentDateEl = document.getElementById('currentDate');
const totalBalanceEl = document.getElementById('totalBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const recentTableBody = document.getElementById('recentTableBody');
const historyTableBody = document.getElementById('historyTableBody');
const loadingIndicator = document.getElementById('loadingIndicator');
const transactionForm = document.getElementById('transactionForm');
const submitBtn = document.getElementById('submitBtn');
const btnTextContent = document.querySelector('.btn-text-content');
const btnLoading = document.querySelector('.btn-loading');
const toast = document.getElementById('toast');
const formMessage = document.getElementById('formMessage');
const iuranTableBody = document.getElementById('iuranTableBody');

// Mobile Menu Elements
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Filter Elements
const filterYear = document.getElementById('filterYear');
const filterMonth = document.getElementById('filterMonth');
const filterType = document.getElementById('filterType');
const btnResetFilter = document.getElementById('btnResetFilter');

// Login State
let isLoggedIn = false;

// Modal Elements
const loginModal = document.getElementById('loginModal');
const btnAuthToggle = document.getElementById('btnAuthToggle');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const btnLoginSubmit = document.getElementById('btnLoginSubmit');
const btnLoginText = document.querySelector('.btn-login-text');
const btnLoginLoading = document.querySelector('.btn-login-loading');
const loginCloseModal = loginModal.querySelector('.close-modal');

// Open Login Modal
btnAuthToggle.addEventListener('click', () => {
    if (isLoggedIn) {
        logout();
    } else {
        loginModal.classList.add('show');
    }
});

// Close Login Modal
loginCloseModal.addEventListener('click', () => {
    loginModal.classList.remove('show');
    loginMessage.style.display = 'none';
    loginForm.reset();
});

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.classList.remove('show');
        loginMessage.style.display = 'none';
    }
    if (e.target === document.getElementById('previewModal')) {
        closePDFPreview();
    }
});

// Handle Login Form Submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    btnLoginSubmit.disabled = true;
    btnLoginText.textContent = 'Memproses...';
    btnLoginLoading.style.display = 'inline-block';
    loginMessage.style.display = 'none';
    
    try {
        const response = await fetch(`${BASE_API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
            isLoggedIn = true;
            loginModal.classList.remove('show');
            loginForm.reset();
            updateAuthButton();
            fetchSaranData();
            showToast('Login berhasil!');
        } else {
            loginMessage.textContent = result.message || 'Login gagal!';
            loginMessage.style.display = 'block';
        }
    } catch (error) {
        loginMessage.textContent = 'Terjadi kesalahan sistem.';
        loginMessage.style.display = 'block';
    } finally {
        btnLoginSubmit.disabled = false;
        btnLoginText.textContent = 'Login';
        btnLoginLoading.style.display = 'none';
    }

    if (!isLoggedIn) {
        loginModal.classList.add('show');
        return false;
    }
    return true;
});

// Navigation Logic
document.querySelectorAll('.nav-links li').forEach(item => {
    item.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        
        // Cek akses untuk menu Input Transaksi
        if (targetId === 'input' && !checkInputAccess()) {
            return;
        }
        
        // Remove active class from all nav items
        document.querySelectorAll('.nav-links li').forEach(nav => nav.classList.remove('active'));
        // Add active class to clicked item
        this.classList.add('active');
        
        // Hide all sections
        document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
        
        // Show target section
        document.getElementById(targetId).classList.add('active');

        if (targetId === 'saran' && isLoggedIn) {
            fetchSaranData();
        }
    });
});

function switchTab(targetId) {
    document.querySelector(`.nav-links li[data-target="${targetId}"]`).click();
}

// Store PDF data for later download
let pdfData = null;

// Export to PDF Function - Show Preview First
function exportToPDF() {
    if (currentFilteredTransactions.length === 0) {
        showToast('Tidak ada data untuk di-export!');
        return;
    }

    const currentDate = new Date().toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Calculate summary
    let filteredIncome = 0;
    let filteredExpense = 0;
    currentFilteredTransactions.forEach(t => {
        const nominal = parseFloat(t.Nominal) || 0;
        const jenis = (t.Jenis || '').trim();
        if (jenis === 'Pemasukan') {
            filteredIncome += nominal;
        } else if (jenis === 'Pengeluaran') {
            filteredExpense += nominal;
        }
    });
    const balance = filteredIncome - filteredExpense;

    // Build preview HTML
    let previewHTML = `
        <h1>LAPORAN TRANSAKSI KAS Gang E20 / E21</h1>
        <p>Tanggal: ${currentDate}</p>
        
        <div class="filter-info">
            <strong>Filter yang digunakan:</strong><br>
            Tahun: ${filterYear.value || 'Semua'} | 
            Bulan: ${filterMonth.value || 'Semua'} | 
            Jenis: ${filterType.value || 'Semua'}
        </div>

        <table>
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th>Keterangan</th>
                    <th>Jenis</th>
                    <th>Nominal</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Add transaction rows
    currentFilteredTransactions.forEach(t => {
        const jenis = (t.Jenis || '').trim();
        const badgeClass = jenis === 'Pemasukan' ? 'income' : 'expense';
        const sign = jenis === 'Pemasukan' ? '+' : '-';
        
        previewHTML += `
            <tr>
                <td>${formatDate(t.Tanggal)}</td>
                <td>${t.Keterangan}</td>
                <td><strong>${jenis}</strong></td>
                <td class="${badgeClass}">${sign} ${formatRupiah(t.Nominal)}</td>
            </tr>
        `;
    });

    previewHTML += `
            </tbody>
        </table>

        <div class="summary">
            <div class="summary-row">
                <span><strong>Pemasukan:</strong></span>
                <span class="income"><strong>Rp ${formatRupiah(filteredIncome).replace('Rp ', '')}</strong></span>
            </div>
            <div class="summary-row">
                <span><strong>Pengeluaran:</strong></span>
                <span class="expense"><strong>Rp ${formatRupiah(filteredExpense).replace('Rp ', '')}</strong></span>
            </div>
            <div class="summary-row total">
                <span><strong>Total Saldo:</strong></span>
                <span><strong>Rp ${formatRupiah(balance).replace('Rp ', '')}</strong></span>
            </div>
        </div>
    `;

    // Store data for download
    pdfData = {
        income: filteredIncome,
        expense: filteredExpense,
        balance: balance,
        date: currentDate,
        html: previewHTML,
        filename: `Laporan_Kas_${new Date().getTime()}.pdf`
    };

    // Show preview modal
    document.getElementById('previewContent').innerHTML = previewHTML;
    document.getElementById('previewModal').classList.add('show');
}

// Close PDF Preview
function closePDFPreview() {
    document.getElementById('previewModal').classList.remove('show');
    pdfData = null;
}

// Download PDF after preview
function downloadPDFNow() {
    if (!pdfData) return;

    const element = document.getElementById('previewContent');
    const isSaranReport = pdfData.filename && pdfData.filename.startsWith('Kritik_Saran');
    const opt = {
        margin: [5, 5, 5, 5],
        filename: pdfData.filename || `Laporan_Kas_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true },
        jsPDF: {
            orientation: isSaranReport ? 'landscape' : 'landscape',
            unit: 'mm',
            format: isSaranReport ? 'a4' : 'a3'
        }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        closePDFPreview();
        showToast('PDF berhasil di-download!');
    });
}

// Export PDF Button Handler
const btnExportPDF = document.getElementById('btnExportPDF');
if (btnExportPDF) {
    btnExportPDF.addEventListener('click', exportToPDF);
}

// Filter Logic
function applyFilters() {
    const yearVal = filterYear.value;
    const monthVal = filterMonth.value;
    const typeVal = filterType.value;
    
    currentFilteredTransactions = transactions.filter(t => {
        const jenis = (t.Jenis || '').trim();
        if (typeVal !== 'Semua' && jenis !== typeVal) return false;
        
        if (yearVal || monthVal) {
            const date = new Date(t.Tanggal);
            if (yearVal && date.getFullYear().toString() !== yearVal) return false;
            if (monthVal && String(date.getMonth() + 1).padStart(2, '0') !== monthVal) return false;
        }
        
        return true;
    });
    
    updateDashboard();
    renderTables();
}

function populateYears() {
    const years = new Set();
    transactions.forEach(t => {
        if (t.Tanggal) {
            const y = new Date(t.Tanggal).getFullYear();
            if (!isNaN(y)) years.add(y);
        }
    });
    
    let optionsHTML = '<option value="">Semua Tahun</option>';
    Array.from(years).sort((a,b) => b - a).forEach(y => {
        optionsHTML += `<option value="${y}">${y}</option>`;
    });
    
    const currentSelected = filterYear.value;
    filterYear.innerHTML = optionsHTML;
    if (currentSelected) {
        filterYear.value = currentSelected;
    } else {
        // Optionally default to current year
        const currentYear = new Date().getFullYear().toString();
        if (years.has(parseInt(currentYear))) {
            filterYear.value = currentYear;
        }
    }
}

filterYear.addEventListener('input', applyFilters);
filterMonth.addEventListener('input', applyFilters);
filterType.addEventListener('input', applyFilters);
btnResetFilter.addEventListener('click', () => {
    filterYear.value = '';
    filterMonth.value = '';
    filterType.value = 'Semua';
    applyFilters();
});

// Initialize
function init() {
    // Set current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = new Date().toLocaleDateString('id-ID', options);
    
    // Set default date in form to today
    document.getElementById('tanggal').valueAsDate = new Date();

    const saranTanggalEl = document.getElementById('saranTanggal');
    if (saranTanggalEl) {
        saranTanggalEl.valueAsDate = new Date();
    }

    // Fetch initial data
    if (BASE_API_URL && !BASE_API_URL.includes('username.workers.dev')) {
        fetchData();
        fetchIuranData();
    } else {
        console.warn('Silakan masukkan BASE_API_URL Cloudflare Worker Anda terlebih dahulu.');
    }
    
    // Initialize auth button display
    updateAuthButton();
    
    // Setup mobile menu
    setupMobileMenu();
}

// Mobile Menu Toggle Functions
function setupMobileMenu() {
    // Hamburger button click
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Overlay click
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Navigation links click
    document.querySelectorAll('.nav-links li').forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
    
    // Auth button click
    if (document.getElementById('btnAuthToggle')) {
        document.getElementById('btnAuthToggle').addEventListener('click', () => {
            setTimeout(() => {
                closeMobileMenu();
            }, 100);
        });
    }
}

function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
    
    if (mobileMenuOpen) {
        sidebar.classList.add('mobile-active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        sidebar.classList.remove('mobile-active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function closeMobileMenu() {
    mobileMenuOpen = false;
    sidebar.classList.remove('mobile-active');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Format Currency

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Format Date
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Format DateTime
function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Fetch Data from Google Sheets
async function fetchData() {
    try {
        // Show loading state
        recentTableBody.innerHTML = '';
        historyTableBody.innerHTML = '';
        loadingIndicator.style.display = 'flex';
        
        const response = await fetch(SCRIPT_URL);
        const result = await response.json();
        
        if (result.status === 'success') {
            transactions = result.data;
            populateYears();
            applyFilters();
        } else {
            console.error('Error fetching data:', result.message);
        }
    } catch (error) {
        console.error('Network error:', error);
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Calculate and Update Dashboard
function updateDashboard() {
    let filteredIncome = 0;
    let filteredExpense = 0;

    // Pemasukan dan Pengeluaran sesuai filter
    currentFilteredTransactions.forEach(t => {
        const nominal = parseFloat(t.Nominal) || 0;
        const jenis = (t.Jenis || '').trim();
        if (jenis === 'Pemasukan') {
            filteredIncome += nominal;
        } else if (jenis === 'Pengeluaran') {
            filteredExpense += nominal;
        }
    });

    // Saldo dihitung hanya berdasarkan transaksi yang sedang difilter
    const balance = filteredIncome - filteredExpense;

    totalBalanceEl.textContent = formatRupiah(balance);
    totalIncomeEl.textContent = formatRupiah(filteredIncome);
    totalExpenseEl.textContent = formatRupiah(filteredExpense);
}

// Render Tables
function renderTables() {
    // Clear tables
    recentTableBody.innerHTML = '';
    historyTableBody.innerHTML = '';

    if (currentFilteredTransactions.length === 0) {
        const emptyRow = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Belum ada data transaksi sesuai filter</td></tr>`;
        recentTableBody.innerHTML = emptyRow;
        historyTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Belum ada data transaksi sesuai filter</td></tr>`;
        return;
    }

    // Sort transactions by Date (newest first) or ID (assuming ID is sequential)
    // Here we assume Google sheet sends them in chronological order, so we reverse it
    const reversedTransactions = [...currentFilteredTransactions].reverse();

    // Render Dashboard Table (All filtered)
    reversedTransactions.forEach(t => {
        const jenis = (t.Jenis || '').trim();
        const badgeClass = jenis === 'Pemasukan' ? 'badge-income' : 'badge-expense';
        const textClass = jenis === 'Pemasukan' ? 'text-success' : 'text-danger';
        const sign = jenis === 'Pemasukan' ? '+' : '-';

        const row = `
            <tr>
                <td>${formatDate(t.Tanggal)}</td>
                <td>${t.Keterangan}</td>
                <td><span class="${badgeClass}">${jenis}</span></td>
                <td class="${textClass}">${sign} ${formatRupiah(t.Nominal)}</td>
            </tr>
        `;
        recentTableBody.innerHTML += row;
    });

    // Render History (All)
    reversedTransactions.forEach((t, index) => {
        const jenis = (t.Jenis || '').trim();
        const badgeClass = jenis === 'Pemasukan' ? 'badge-income' : 'badge-expense';
        const textClass = jenis === 'Pemasukan' ? 'text-success' : 'text-danger';
        const sign = jenis === 'Pemasukan' ? '+' : '-';

        // Always add action cell (CSS controls visibility)
        const actionCell = `
            <td class="admin-only" style="text-align: center;">
                <button onclick="confirmDelete('Hapus transaksi tanggal ${formatDate(t.Tanggal)}?', () => deleteTransaction('${t.id}'))" class="btn-action delete" title="Hapus">ðŸ—‘ï¸</button>
            </td>
        `;

        const row = `
            <tr>
                <td>${index + 1}</td>
                <td>${formatDate(t.Tanggal)}</td>
                <td>${t.Keterangan}</td>
                <td><span class="${badgeClass}">${jenis}</span></td>
                <td class="${textClass}">${sign} ${formatRupiah(t.Nominal)}</td>
                <td style="font-size: 12px; color: var(--text-muted);">${new Date(t.Timestamp).toLocaleString('id-ID')}</td>
                ${actionCell}
            </tr>
        `;
        historyTableBody.innerHTML += row;
    });
}

// Fetch Iuran Data from Separate Sheet
async function fetchIuranData() {
    try {
        iuranTableBody.innerHTML = '<tr><td colspan="14" style="text-align:center; color:var(--text-muted);">Memuat data iuran warga...</td></tr>';
        
        // Check if BASE_API_URL is configured
        if (BASE_API_URL.includes('username.workers.dev')) {
            iuranTableBody.innerHTML = '<tr><td colspan="14" style="text-align:center; color:var(--text-danger);"><strong>âš ï¸ Belum dikonfigurasi!</strong><br>Silakan atur BASE_API_URL di app.js</td></tr>';
            console.warn('BASE_API_URL belum dikonfigurasi');
            return;
        }
        
        const response = await fetch(SCRIPT_URL_IURAN);
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            iuranData = result.data;
            renderIuranTable();
        } else {
            iuranTableBody.innerHTML = '<tr><td colspan="14" style="text-align:center; color:var(--text-muted);">Gagal memuat data iuran: ' + (result.message || 'Unknown error') + '</td></tr>';
            console.error('Error fetching iuran data:', result.message);
        }
    } catch (error) {
        console.error('Network error:', error);
        iuranTableBody.innerHTML = '<tr><td colspan="14" style="text-align:center; color:var(--text-muted);">Terjadi kesalahan saat memuat data</td></tr>';
    }
}

// Render Iuran Table
function renderIuranTable() {
    iuranTableBody.innerHTML = '';
    
    if (iuranData.length === 0) {
        iuranTableBody.innerHTML = '<tr><td colspan="15" style="text-align:center; color:var(--text-muted);">Belum ada data iuran warga</td></tr>';
        return;
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Juni', 'Juli', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    iuranData.forEach((resident, index) => {
        let row = `<tr><td>${index + 1}</td><td>${resident.Rumah || ''} - ${resident.Nama || ''}</td>`;
        
        // Add monthly status
        for (let i = 0; i < 12; i++) {
            const monthKey = months[i];
            const status = resident[monthKey] || '';
            const statusClass = status === 'Y' || status === 'âœ“' || status === 'V' ? 'iuran-status-check' : 'iuran-status-empty';
            const displayValue = status === 'Y' || status === 'âœ“' || status === 'V' ? 'âœ“' : '-';
            row += `<td class="${statusClass}">${displayValue}</td>`;
        }
        
        // Always add action column (CSS controls visibility)
        row += `
            <td class="admin-only" style="text-align: center;">
                <button onclick="openWargaModal('${resident.Rumah}')" class="btn-action edit" title="Edit">ðŸ–Šï¸</button>
            </td>
        `;
        
        row += '</tr>';
        iuranTableBody.innerHTML += row;
    });
}

// Filter Iuran Table by Nama or Rumah
function filterIuranTable(searchText) {
    if (!searchText.trim()) {
        renderIuranTable();
        return;
    }
    
    const searchLower = searchText.toLowerCase();
    const filteredData = iuranData.filter(resident => {
        const namaMatch = (resident.Nama || '').toLowerCase().includes(searchLower);
        const rumahMatch = (resident.Rumah || '').toLowerCase().includes(searchLower);
        return namaMatch || rumahMatch;
    });
    
    iuranTableBody.innerHTML = '';
    
    if (filteredData.length === 0) {
        iuranTableBody.innerHTML = '<tr><td colspan="15" style="text-align:center; color:var(--text-muted);">Tidak ada data yang cocok dengan pencarian</td></tr>';
        return;
    }
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Juni', 'Juli', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    filteredData.forEach((resident, index) => {
        let row = `<tr><td>${index + 1}</td><td>${resident.Rumah || ''} - ${resident.Nama || ''}</td>`;
        
        for (let i = 0; i < 12; i++) {
            const monthKey = months[i];
            const status = resident[monthKey] || '';
            const statusClass = status === 'Y' || status === 'âœ“' || status === 'V' ? 'iuran-status-check' : 'iuran-status-empty';
            const displayValue = status === 'Y' || status === 'âœ“' || status === 'V' ? 'âœ“' : '-';
            row += `<td class="${statusClass}">${displayValue}</td>`;
        }
        
        // Add action column if logged in
        if (isLoggedIn) {
            row += `
                <td class="admin-only" style="display: table-cell; text-align: center;">
                    <button onclick="openWargaModal('${resident.Rumah}')" class="btn-action edit" title="Edit">ðŸ–Šï¸</button>
                </td>
            `;
        } else {
            row += `<td class="admin-only" style="display: none;"></td>`;
        }
        
        row += '</tr>';
        iuranTableBody.innerHTML += row;
    });
}

// Export Iuran to PDF
function exportIuranToPDF() {
    if (iuranData.length === 0) {
        alert('Belum ada data iuran untuk diexport');
        return;
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Juni', 'Juli', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Create wrapper with header
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width: 100%; padding: 15px; font-family: Arial, sans-serif; background: white;';
    
    // Add header
    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #333;';
    header.innerHTML = `
        <h1 style="margin: 0 0 10px 0; font-size: 25px; color: #333;">Laporan Iuran Gang E20 / E21</h1>
        <h1 style="margin: 0 0 10px 0; font-size: 22px; color: #333;">Kas Gang Rp: 10.000 | Kas RT Rp: 5.000 | Kas BSK Rp: 5.000</h1>
        <p style="margin: 5px 0; font-size: 22px; color: #333;">Tahun 2026</p>
        <p style="margin: 5px 0; font-size: 12px; color: #999;">Dicetak pada: ${dateStr}</p>
    `;
    wrapper.appendChild(header);
    
    // Append table clone with optimized styling
    const tableClone = document.getElementById('iuranTable').cloneNode(true);
    tableClone.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 11px;';
    wrapper.appendChild(tableClone);
    
    // Use A2 landscape for maximum fit of all columns (even wider than A3)
    const opt = {
        margin: [5, 5, 5, 5],
        filename: 'Iuran_Warga_2026.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true, allowTaint: true },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a2' }
    };

    html2pdf().set(opt).from(wrapper).save();
}

// Fetch Inventaris Data from Google Sheets
async function fetchInventarisData() {
    try {
        const response = await fetch(SCRIPT_URL_INVENTARIS);
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            inventarisData = result.data;
            renderInventarisTable();
        } else {
            const tbody = document.getElementById('inventarisTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Gagal memuat data inventaris: ' + (result.message || 'Unknown error') + '</td></tr>';
            }
            console.error('Error fetching inventaris data:', result.message);
        }
    } catch (error) {
        console.error('Network error:', error);
        const tbody = document.getElementById('inventarisTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Terjadi kesalahan saat memuat data</td></tr>';
        }
    }
}

// Fetch Program Kerja Data from Google Sheets
async function fetchProgramKerjaData() {
    try {
        const response = await fetch(SCRIPT_URL_PROGRAM);
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            programKerjaData = result.data;
            renderProgramKerjaTable();
        } else {
            const tbody = document.getElementById('programTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Gagal memuat data program kerja: ' + (result.message || 'Unknown error') + '</td></tr>';
            }
            console.error('Error fetching program kerja data:', result.message);
        }
    } catch (error) {
        console.error('Network error:', error);
        const tbody = document.getElementById('programTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Terjadi kesalahan saat memuat data</td></tr>';
        }
    }
}

// Export Inventaris to PDF
function exportInventarisToPDF() {
    if (inventarisData.length === 0) {
        alert('Belum ada data inventaris untuk diexport');
        return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Create wrapper with header
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width: 100%; padding: 15px; font-family: Arial, sans-serif; background: white;';
    
    // Add header
    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #333;';
    header.innerHTML = `
        <h1 style="margin: 0 0 10px 0; font-size: 25px; color: #333;">Laporan Data Inventaris</h1>
        <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #333;">Gang E20 / E21</h2>
        <p style="margin: 5px 0; font-size: 14px; color: #666;">Tahun 2026</p>
        <p style="margin: 5px 0; font-size: 12px; color: #999;">Dicetak pada: ${dateStr}</p>
    `;
    wrapper.appendChild(header);
    
    // Append table clone with optimized styling
    const tableClone = document.getElementById('inventarisTable').cloneNode(true);
    tableClone.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 11px;';
    wrapper.appendChild(tableClone);
    
    const opt = {
        margin: [5, 5, 5, 5],
        filename: 'Inventaris_Gang_E20_E21.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true, allowTaint: true },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(wrapper).save();
}

// Export Program Kerja to PDF
function exportProgramKerjaToPDF() {
    if (programKerjaData.length === 0) {
        alert('Belum ada data program kerja untuk diexport');
        return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Create wrapper with header
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width: 100%; padding: 15px; font-family: Arial, sans-serif; background: white;';
    
    // Add header
    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #333;';
    header.innerHTML = `
        <h1 style="margin: 0 0 10px 0; font-size: 25px; color: #333;">Laporan Program Kerja</h1>
        <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #333;">Gang E20 / E21 Tahun 2026</h2>
        <p style="margin: 5px 0; font-size: 14px; color: #666;">Rencana Program Kegiatan</p>
        <p style="margin: 5px 0; font-size: 12px; color: #999;">Dicetak pada: ${dateStr}</p>
    `;
    wrapper.appendChild(header);
    
    // Append table clone with optimized styling
    const tableClone = document.getElementById('programTable').cloneNode(true);
    tableClone.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 11px;';
    wrapper.appendChild(tableClone);
    
    const opt = {
        margin: [5, 5, 5, 5],
        filename: 'Program_Kerja_Gang_E20_E21.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true, allowTaint: true },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(wrapper).save();
}
function renderInventarisTable() {
    const tbody = document.getElementById('inventarisTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (inventarisData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">Memuat data inventaris...</td></tr>';
        return;
    }
    
    inventarisData.forEach(item => {
        const row = document.createElement('tr');
        const kondisiClass = item.kondisi === 'Baik' ? 'good' : item.kondisi === 'Cukup' ? 'fair' : 'poor';
        
        // Always add action cell (CSS controls visibility)
        const actionCell = `
            <td class="admin-only" style="text-align: center;">
                <button onclick="openInventarisModal(${item.no})" class="btn-action edit" title="Edit" style="margin-right: 8px;">ðŸ–Šï¸</button>
                <button onclick="confirmDelete('Hapus inventaris &quot;${item.nama}&quot;?', () => deleteInventaris(${item.no}))" class="btn-action delete" title="Hapus">ðŸ—‘ï¸</button>
            </td>
        `;
        
        row.innerHTML = `
            <td>${item.no}</td>
            <td>${item.nama}</td>
            <td>${item.kategori}</td>
            <td style="text-align: center;">${item.jumlah}</td>
            <td><span class="status-badge status-${kondisiClass}">${item.kondisi}</span></td>
            <td>${item.lokasi}</td>
            <td>${item.keterangan}</td>
            ${actionCell}
        `;
        tbody.appendChild(row);
    });
}

// Render Program Kerja Table
function renderProgramKerjaTable() {
    const tbody = document.getElementById('programTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (programKerjaData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Memuat data program kerja...</td></tr>';
        return;
    }
    
    programKerjaData.forEach(item => {
        const row = document.createElement('tr');
        let statusClass = 'pending';
        if (item.status === 'Selesai') statusClass = 'done';
        else if (item.status === 'Dalam Proses') statusClass = 'in-progress';
        else if (item.status === 'Berkelanjutan') statusClass = 'ongoing';
        
        // Always add action cell (CSS controls visibility)
        const actionCell = `
            <td class="admin-only" style="text-align: center;">
                <button onclick="openProgramModal(${item.no})" class="btn-action edit" title="Edit" style="margin-right: 8px;">ðŸ–Šï¸</button>
                <button onclick="confirmDelete('Hapus program &quot;${item.program}&quot;?', () => deleteProgram(${item.no}))" class="btn-action delete" title="Hapus">ðŸ—‘ï¸</button>
            </td>
        `;
        
        row.innerHTML = `
            <td>${item.no}</td>
            <td><strong>${item.program}</strong></td>
            <td>${item.pic}</td>
            <td>${item.target}</td>
            <td><span class="status-badge status-${statusClass}">${item.status}</span></td>
            <td>${item.keterangan}</td>
            ${actionCell}
        `;
        tbody.appendChild(row);
    });
}

// Handle Iuran Export Button
document.addEventListener('DOMContentLoaded', () => {
    const btnExportIuran = document.getElementById('btnExportIuranPDF');
    if (btnExportIuran) {
        btnExportIuran.addEventListener('click', exportIuranToPDF);
    }
    
    // Handle Iuran Search
    const iuranSearchInput = document.getElementById('iuranSearchInput');
    const btnResetIuranSearch = document.getElementById('btnResetIuranSearch');
    
    if (iuranSearchInput) {
        iuranSearchInput.addEventListener('input', (e) => {
            filterIuranTable(e.target.value);
        });
    }
    
    if (btnResetIuranSearch) {
        btnResetIuranSearch.addEventListener('click', () => {
            if (iuranSearchInput) iuranSearchInput.value = '';
            renderIuranTable();
        });
    }

    // Handle Inventaris Export Button
    const btnExportInventaris = document.getElementById('btnExportInventarisPDF');
    if (btnExportInventaris) {
        btnExportInventaris.addEventListener('click', exportInventarisToPDF);
    }

    // Handle Program Kerja Export Button
    const btnExportProgram = document.getElementById('btnExportProgramPDF');
    if (btnExportProgram) {
        btnExportProgram.addEventListener('click', exportProgramKerjaToPDF);
    }

    // Fetch Inventaris and Program Kerja Data from Google Sheets
    fetchInventarisData();
    fetchProgramKerjaData();

    // Handle Payment Confirmation Form
    const paymentForm = document.getElementById('paymentConfirmForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }

    // Handle Kritik & Saran
    const saranForm = document.getElementById('saranForm');
    if (saranForm) {
        saranForm.addEventListener('submit', handleSaranSubmit);
    }

    const btnExportSaran = document.getElementById('btnExportSaranPDF');
    if (btnExportSaran) {
        btnExportSaran.addEventListener('click', exportSaranToPDF);
    }

    const btnRefreshSaran = document.getElementById('btnRefreshSaran');
    if (btnRefreshSaran) {
        btnRefreshSaran.addEventListener('click', fetchSaranData);
    }
});


// Handle Payment Confirmation Form Submit
async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const nama = document.getElementById('paymentName').value.trim();
    const no_rumah = document.getElementById('paymentHouse').value.trim();
    const keterangan = document.getElementById('paymentDesc').value.trim();
    const buktiFile = document.getElementById('paymentProof').files[0];
    
    if (!nama || !no_rumah || !keterangan || !buktiFile) {
        alert('Semua field harus diisi dan bukti bayar harus dipilih!');
        return;
    }
    
    if (buktiFile.size > 5 * 1024 * 1024) {
        alert('Ukuran file tidak boleh lebih dari 5MB');
        return;
    }
    
    // Create WhatsApp message
    const phoneNumber = '6281234567890'; // Ganti dengan nomor WhatsApp admin
    const message = `Konfirmasi Pembayaran Kas Gang E20/E21\n\n` +
        `Nama: ${nama}\n` +
        `No. Rumah: ${no_rumah}\n` +
        `Keterangan: ${keterangan}\n` +
        `Waktu: ${new Date().toLocaleString('id-ID')}\n\n` +
        `Bukti pembayaran sudah disiapkan.`;
    
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Show alert before redirect
    alert('Anda akan dialihkan ke WhatsApp untuk mengirim konfirmasi pembayaran. Silakan lampirkan foto bukti bayar di chat.');
    
    // Redirect to WhatsApp
    window.open(whatsappURL, '_blank');
    
    // Reset form
    document.getElementById('paymentConfirmForm').reset();
}

// Handle Form Submit
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (BASE_API_URL.includes('username.workers.dev')) {
        alert('Anda belum mengatur BASE_API_URL. Silakan edit app.js dan masukkan URL Cloudflare Worker Anda.');
        return;
    }

    // Get Form Data
    const formData = new FormData(transactionForm);
    const dataObj = Object.fromEntries(formData.entries());

    // UI Loading State
    submitBtn.disabled = true;
    btnTextContent.textContent = 'Menyimpan...';
    btnLoading.style.display = 'inline-block';
    formMessage.style.display = 'none';

    try {
        // Send POST request using no-cors because Google Apps Script POST redirect can cause CORS issues
        // We use a specific pattern: encode data as x-www-form-urlencoded
        const urlParams = new URLSearchParams();
        urlParams.append('action', 'insert');
        urlParams.append('tanggal', dataObj.tanggal);
        urlParams.append('jenis', dataObj.jenis);
        urlParams.append('nominal', dataObj.nominal);
        urlParams.append('keterangan', dataObj.keterangan);

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: urlParams
        });

        const result = await response.json();

        if (result.status === 'success') {
            // Reset Form
            transactionForm.reset();
            document.getElementById('tanggal').valueAsDate = new Date();
            
            // Show Success Toast
            showToast('Transaksi berhasil disimpan!');
            
            // Switch to history tab and refresh data
            switchTab('dashboard');
            fetchData();
        } else {
            throw new Error(result.message || 'Gagal menyimpan data');
        }

    } catch (error) {
        console.error('Submit Error:', error);
        formMessage.textContent = 'Terjadi kesalahan. Pastikan URL Cloudflare Worker Anda benar dan sudah di-deploy.';
        formMessage.className = 'message-box error';
        formMessage.style.display = 'block';
    } finally {
        // Reset UI Loading State
        submitBtn.disabled = false;
        btnTextContent.textContent = 'Simpan Transaksi';
        btnLoading.style.display = 'none';
    }
});

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================================
// ADMIN CRUD OPERATIONS - Edit/Delete Functions
// ============================================================

// Update Auth Button visibility and show/hide admin actions
function updateAuthButton() {
    const authToggle = document.getElementById('btnAuthToggle');
    const adminElements = document.querySelectorAll('.admin-only');
    const inputSection = document.getElementById('input');
    const navInput = document.getElementById('navInput');
    
    if (isLoggedIn) {
        authToggle.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> <span class="nav-text">Logout</span>';
        authToggle.style.backgroundColor = 'var(--primary-color)';
        // Add 'show' class to display admin elements
        adminElements.forEach(el => {
            el.classList.add('show');
        });
        // Show input section on mobile
        if (inputSection) inputSection.classList.add('admin-visible');
        if (navInput) navInput.classList.add('admin-visible');
        fetchSaranData();
    } else {
        authToggle.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> <span class="nav-text">Login Admin</span>';
        authToggle.style.backgroundColor = 'var(--text-muted)';
        // Remove 'show' class to hide admin elements
        adminElements.forEach(el => {
            el.classList.remove('show');
        });
        // Hide input section on mobile
        if (inputSection) inputSection.classList.remove('admin-visible');
        if (navInput) navInput.classList.remove('admin-visible');
    }
}

function logout() {
    isLoggedIn = false;
    saranData = [];
    updateAuthButton();
    showToast('Logout berhasil!');
    switchTab('dashboard');
}

// Guard: check if user can access Input Transaksi
function checkInputAccess() {
    if (!isLoggedIn) {
        // Show login modal instead of navigating
        loginModal.classList.add('show');
        return false;
    }
    return true;
}

// ========== MODAL MANAGEMENT ==========
function closeDeleteConfirm() {
    document.getElementById('deleteConfirmModal').classList.remove('show');
}

function openWargaModal(rumah = null) {
    if (!isLoggedIn) {
        alert('Anda harus login terlebih dahulu');
        return;
    }
    
    const modal = document.getElementById('wargaModal');
    const form = document.getElementById('wargaForm');
    
    form.reset();
    document.getElementById('originalRumah').value = '';
    
    if (rumah) {
        // Edit mode
        const resident = iuranData.find(r => r.Rumah === rumah);
        if (!resident) return;
        
        document.getElementById('wargaModalTitle').textContent = 'âœï¸ Edit Data Warga';
        document.getElementById('wargaRumah').value = resident.Rumah;
        document.getElementById('wargaNama').value = resident.Nama;
        document.getElementById('wargaRumah').readOnly = true;
        document.getElementById('originalRumah').value = rumah;
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Juni', 'Juli', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        months.forEach(month => {
            const checkbox = document.getElementById(`check${month}`);
            if (checkbox) {
                checkbox.checked = resident[month] === 'Y' || resident[month] === 'âœ“' || resident[month] === 'V';
            }
        });
    } else {
        // Add mode
        document.getElementById('wargaModalTitle').textContent = 'âž• Tambah Data Warga';
        document.getElementById('wargaRumah').readOnly = false;
    }
    
    modal.classList.add('show');
}

function openInventarisModal(no = null) {
    if (!isLoggedIn) {
        alert('Anda harus login terlebih dahulu');
        return;
    }
    
    const modal = document.getElementById('inventarisModal');
    const form = document.getElementById('inventarisForm');
    
    form.reset();
    
    if (no) {
        // Edit mode
        const item = inventarisData.find(i => i.no == no);
        if (!item) return;
        
        document.getElementById('inventarisModalTitle').textContent = 'ðŸ–Šï¸ Edit Inventaris';
        document.getElementById('invNo').value = item.no;
        document.getElementById('invNama').value = item.nama;
        document.getElementById('invKategori').value = item.kategori;
        document.getElementById('invJumlah').value = item.jumlah;
        document.getElementById('invKondisi').value = item.kondisi;
        document.getElementById('invLokasi').value = item.lokasi;
        document.getElementById('invKeterangan').value = item.keterangan || '';
        document.getElementById('invNo').readOnly = true;
    } else {
        // Add mode
        document.getElementById('inventarisModalTitle').textContent = 'âž• Tambah Inventaris';
        document.getElementById('invNo').readOnly = false;
        // Auto-suggest next number
        if (inventarisData.length > 0) {
            const maxNo = Math.max(...inventarisData.map(i => parseInt(i.no) || 0));
            document.getElementById('invNo').value = maxNo + 1;
        }
    }
    
    modal.classList.add('show');
}

function openProgramModal(no = null) {
    if (!isLoggedIn) {
        alert('Anda harus login terlebih dahulu');
        return;
    }
    
    const modal = document.getElementById('programModal');
    const form = document.getElementById('programForm');
    
    form.reset();
    
    if (no) {
        // Edit mode
        const item = programKerjaData.find(p => p.no == no);
        if (!item) return;
        
        document.getElementById('programModalTitle').textContent = 'ðŸ–Šï¸ Edit Program Kerja';
        document.getElementById('progNo').value = item.no;
        document.getElementById('progProgram').value = item.program;
        document.getElementById('progPic').value = item.pic;
        document.getElementById('progTarget').value = item.target;
        document.getElementById('progStatus').value = item.status;
        document.getElementById('progKeterangan').value = item.keterangan || '';
        document.getElementById('progNo').readOnly = true;
    } else {
        // Add mode
        document.getElementById('programModalTitle').textContent = 'âž• Tambah Program Kerja';
        document.getElementById('progNo').readOnly = false;
        // Auto-suggest next number
        if (programKerjaData.length > 0) {
            const maxNo = Math.max(...programKerjaData.map(p => parseInt(p.no) || 0));
            document.getElementById('progNo').value = maxNo + 1;
        }
    }
    
    modal.classList.add('show');
}

// Delete confirmation with callback
let deleteCallback = null;
let deleteMessage = '';

function confirmDelete(message, callback) {
    deleteCallback = callback;
    deleteMessage = message;
    document.getElementById('deleteConfirmMessage').textContent = message;
    document.getElementById('deleteConfirmModal').classList.add('show');
}

document.getElementById('btnConfirmDelete').addEventListener('click', () => {
    if (deleteCallback) {
        deleteCallback();
        closeDeleteConfirm();
    }
});

// ========== SAVE/DELETE HANDLERS ==========
async function saveWargaData() {
    if (!isLoggedIn) return;
    
    const form = document.getElementById('wargaForm');
    const formData = new FormData(form);
    
    const originalRumah = document.getElementById('originalRumah').value;
    const rumah = document.getElementById('wargaRumah').value.trim();
    const nama = document.getElementById('wargaNama').value.trim();
    
    if (!rumah || !nama) {
        alert('Nomor Rumah dan Nama harus diisi!');
        return;
    }
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Juni', 'Juli', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const data = { Rumah: rumah, Nama: nama };
    
    months.forEach(month => {
        const checkbox = document.getElementById(`check${month}`);
        data[month] = checkbox && checkbox.checked ? 'Y' : '-';
    });
    
    if (originalRumah) {
        data.originalRumah = originalRumah;
    }
    
    try {
        const response = await fetch(SCRIPT_URL_IURAN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showToast('Data warga berhasil disimpan!');
            document.getElementById('wargaModal').classList.remove('show');
            fetchIuranData();
        } else {
            alert('Gagal menyimpan: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menyimpan data');
    }
}

async function saveInventarisData() {
    if (!isLoggedIn) return;
    
    const no = document.getElementById('invNo').value.trim();
    const nama = document.getElementById('invNama').value.trim();
    const kategori = document.getElementById('invKategori').value.trim();
    const jumlah = document.getElementById('invJumlah').value.trim();
    const kondisi = document.getElementById('invKondisi').value.trim();
    const lokasi = document.getElementById('invLokasi').value.trim();
    const keterangan = document.getElementById('invKeterangan').value.trim();
    
    if (!no || !nama || !kategori || !jumlah || !kondisi || !lokasi) {
        alert('Semua field wajib diisi!');
        return;
    }
    
    const data = { no, nama, kategori, jumlah: parseInt(jumlah), kondisi, lokasi, keterangan };
    
    try {
        const response = await fetch(SCRIPT_URL_INVENTARIS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showToast('Inventaris berhasil disimpan!');
            document.getElementById('inventarisModal').classList.remove('show');
            fetchInventarisData();
        } else {
            alert('Gagal menyimpan: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menyimpan data');
    }
}

async function saveProgamData() {
    if (!isLoggedIn) return;
    
    const no = document.getElementById('progNo').value.trim();
    const program = document.getElementById('progProgram').value.trim();
    const pic = document.getElementById('progPic').value.trim();
    const target = document.getElementById('progTarget').value.trim();
    const status = document.getElementById('progStatus').value.trim();
    const keterangan = document.getElementById('progKeterangan').value.trim();
    
    if (!no || !program || !pic || !target || !status) {
        alert('Semua field wajib diisi!');
        return;
    }
    
    const data = { no, program, pic, target, status, keterangan };
    
    try {
        const response = await fetch(SCRIPT_URL_PROGRAM, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showToast('Program kerja berhasil disimpan!');
            document.getElementById('programModal').classList.remove('show');
            fetchProgramKerjaData();
        } else {
            alert('Gagal menyimpan: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menyimpan data');
    }
}

async function deleteInventaris(no) {
    if (!isLoggedIn) return;
    
    try {
        const response = await fetch(`${SCRIPT_URL_INVENTARIS}?no=${no}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showToast('Inventaris berhasil dihapus!');
            fetchInventarisData();
        } else {
            alert('Gagal menghapus: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menghapus data');
    }
}

async function deleteProgram(no) {
    if (!isLoggedIn) return;
    
    try {
        const response = await fetch(`${SCRIPT_URL_PROGRAM}?no=${no}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showToast('Program kerja berhasil dihapus!');
            fetchProgramKerjaData();
        } else {
            alert('Gagal menghapus: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menghapus data');
    }
}

async function deleteTransaction(id) {
    if (!isLoggedIn) return;
    
    try {
        const response = await fetch(`${SCRIPT_URL}?id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showToast('Transaksi berhasil dihapus!');
            fetchData();
        } else {
            alert('Gagal menghapus: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menghapus data');
    }
}

// ========== MODAL EVENT LISTENERS ==========
document.getElementById('closeWargaModal').addEventListener('click', () => {
    document.getElementById('wargaModal').classList.remove('show');
});

document.getElementById('closeInventarisModal').addEventListener('click', () => {
    document.getElementById('inventarisModal').classList.remove('show');
});

document.getElementById('closeProgramModal').addEventListener('click', () => {
    document.getElementById('programModal').classList.remove('show');
});

document.getElementById('btnWargaSubmit').addEventListener('click', (e) => {
    e.preventDefault();
    saveWargaData();
});

document.getElementById('btnInventarisSubmit').addEventListener('click', (e) => {
    e.preventDefault();
    saveInventarisData();
});

document.getElementById('btnProgramSubmit').addEventListener('click', (e) => {
    e.preventDefault();
    saveProgamData();
});

// "Add New" Button Listeners
document.getElementById('btnTambahWarga').addEventListener('click', () => {
    openWargaModal();
});

document.getElementById('btnTambahInventaris').addEventListener('click', () => {
    openInventarisModal();
});

document.getElementById('btnTambahProgram').addEventListener('click', () => {
    openProgramModal();
});

// Close modals when clicking outside
document.getElementById('wargaModal').addEventListener('click', (e) => {
    if (e.target.id === 'wargaModal') document.getElementById('wargaModal').classList.remove('show');
});

document.getElementById('inventarisModal').addEventListener('click', (e) => {
    if (e.target.id === 'inventarisModal') document.getElementById('inventarisModal').classList.remove('show');
});

document.getElementById('programModal').addEventListener('click', (e) => {
    if (e.target.id === 'programModal') document.getElementById('programModal').classList.remove('show');
});

document.getElementById('deleteConfirmModal').addEventListener('click', (e) => {
    if (e.target.id === 'deleteConfirmModal') closeDeleteConfirm();
});

// ============================================================
// KRITIK & SARAN
// ============================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function truncateText(text, maxLength = 120) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function fetchSaranData() {
    if (!isLoggedIn) return;

    const tbody = document.getElementById('saranTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" class="saran-empty">Memuat data kritik dan saran...</td></tr>';

    try {
        const loaded = await loadSaranDataFromAPI();
        if (loaded) {
            renderSaranTable();
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="saran-empty">Gagal memuat data</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching saran:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="saran-empty">Terjadi kesalahan saat memuat data</td></tr>';
    }
}

function renderSaranTable() {
    const tbody = document.getElementById('saranTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (saranData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="saran-empty">Belum ada laporan masuk</td></tr>';
        return;
    }

    saranData.forEach((item, index) => {
        const row = document.createElement('tr');
        const lampiranCell = item.foto
            ? '<button type="button" class="saran-lampiran-btn" onclick="viewSaranFoto(' + item.id + ')"><i class="fa-solid fa-image"></i> Lihat</button>'
            : '<span class="saran-lampiran-none">-</span>';

        const timestampCell = item.timestamp || item.Timestamp
            ? formatDateTime(item.timestamp || item.Timestamp)
            : '-';

        row.innerHTML = '<td data-label="No">' + (index + 1) + '</td>' +
            '<td data-label="Tanggal">' + formatDate(item.tanggal) + '</td>' +
            '<td data-label="Pengirim">' + escapeHtml(item.nama) + '</td>' +
            '<td data-label="Alamat">' + escapeHtml(item.alamat) + '</td>' +
            '<td data-label="Detail" class="saran-detail-cell" title="' + escapeHtml(item.detail) + '">' + escapeHtml(truncateText(item.detail, 150)) + '</td>' +
            '<td data-label="Waktu Masuk">' + escapeHtml(timestampCell) + '</td>' +
            '<td data-label="Lampiran" style="text-align: center;">' + lampiranCell + '</td>' +
            '<td data-label="Aksi" class="admin-only" style="text-align: center;">' +
            '<button onclick="confirmDelete(\'Hapus laporan dari ' + escapeHtml(item.nama) + '?\', () => deleteSaran(' + item.id + '))" class="btn-action delete" title="Hapus">ðŸ—‘ï¸</button>' +
            '</td>';
        tbody.appendChild(row);
    });

    if (isLoggedIn) {
        tbody.querySelectorAll('.admin-only').forEach(el => el.classList.add('show'));
    }
}

function viewSaranFoto(id) {
    const item = saranData.find(s => s.id == id);
    if (!item || !item.foto) return;

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(`
            <html>
                <head><title>Lampiran Laporan #${id}</title></head>
                <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111;">
                    <img src="${item.foto}" alt="Lampiran" style="max-width:100%; max-height:100vh; object-fit:contain;">
                </body>
            </html>
        `);
        win.document.close();
    }
}

async function handleSaranSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById('btnSaranSubmit');
    const btnText = document.querySelector('.btn-saran-text');
    const btnLoading = document.querySelector('.btn-saran-loading');
    const msgBox = document.getElementById('saranFormMessage');

    const nama = document.getElementById('saranNama').value.trim();
    const alamat = document.getElementById('saranAlamat').value.trim();
    const tanggal = document.getElementById('saranTanggal').value;
    const detail = document.getElementById('saranDetail').value.trim();
    const fotoInput = document.getElementById('saranFoto');

    if (!tanggal || !detail) {
        msgBox.textContent = 'Tanggal dan detail wajib diisi!';
        msgBox.className = 'message-box error';
        msgBox.style.display = 'block';
        return;
    }

    if (BASE_API_URL.includes('username.workers.dev')) {
        alert('Anda belum mengatur BASE_API_URL. Silakan edit app.js dan masukkan URL Cloudflare Worker Anda.');
        return;
    }

    btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline-block';
    msgBox.style.display = 'none';

    try {
        let fotoBase64 = null;
        if (fotoInput && fotoInput.files.length > 0) {
            const file = fotoInput.files[0];
            if (file.size > 5 * 1024 * 1024) {
                msgBox.textContent = 'Ukuran foto maksimal 5MB!';
                msgBox.className = 'message-box error';
                msgBox.style.display = 'block';
                return;
            }
            fotoBase64 = await fileToBase64(file);
        }

        const response = await fetch(SCRIPT_URL_SARAN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nama: nama || 'Anonim',
                alamat: alamat || 'Rahasia',
                tanggal,
                detail,
                foto: fotoBase64
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            document.getElementById('saranForm').reset();
            document.getElementById('saranTanggal').valueAsDate = new Date();
            showToast('Kritik & saran berhasil dikirim!');
            if (isLoggedIn) fetchSaranData();
        } else {
            msgBox.textContent = result.message || 'Gagal mengirim data';
            msgBox.className = 'message-box error';
            msgBox.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        msgBox.textContent = 'Terjadi kesalahan saat mengirim data';
        msgBox.className = 'message-box error';
        msgBox.style.display = 'block';
    } finally {
        btn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
    }
}

async function deleteSaran(id) {
    if (!isLoggedIn) return;

    try {
        const response = await fetch(`${SCRIPT_URL_SARAN}?id=${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (result.status === 'success') {
            showToast('Laporan berhasil dihapus!');
            fetchSaranData();
        } else {
            alert('Gagal menghapus: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menghapus data');
    }
}

async function loadSaranDataFromAPI() {
    const response = await fetch(SCRIPT_URL_SARAN);
    const result = await response.json();

    if (result.status === 'success') {
        saranData = result.data || [];
        return true;
    }
    return false;
}

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

    let rowsHTML = '';
    saranData.forEach((item, i) => {
        rowsHTML += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${i + 1}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${escapeHtml(formatDate(item.tanggal))}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${escapeHtml(item.nama)}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${escapeHtml(item.alamat)}</td>
                <td style="border: 1px solid #ddd; padding: 6px; word-break: break-word;">${escapeHtml(item.detail)}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${item.timestamp ? escapeHtml(formatDate(item.timestamp)) : '-'}</td>
            </tr>
        `;
    });

    return `
        <div style="width: 100%; padding: 15px; font-family: Arial, sans-serif; background: white; color: #111;">
            <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #333;">
                <h1 style="margin: 0 0 10px 0; font-size: 22px; color: #333;">Laporan Kritik, Saran & Pengaduan</h1>
                <h2 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">Gang E20 / E21</h2>
                <p style="margin: 5px 0; font-size: 12px; color: #999;">Dicetak pada: ${dateStr} | Total: ${saranData.length} laporan</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="border: 1px solid #ddd; padding: 8px;">No</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">Tanggal</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">Pengirim</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">Alamat</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">Detail</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">Waktu Masuk</th>
                    </tr>
                </thead>
                <tbody>${rowsHTML}</tbody>
            </table>
        </div>
    `;
}

async function exportSaranToPDF() {
    if (!isLoggedIn) {
        alert('Anda harus login sebagai admin terlebih dahulu');
        return;
    }

    try {
        const loaded = await loadSaranDataFromAPI();
        if (!loaded) {
            showToast('Gagal memuat data untuk di-export!');
            return;
        }

        if (saranData.length === 0) {
            showToast('Tidak ada data untuk di-export!');
            return;
        }

        renderSaranTable();

        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'width: 100%; padding: 15px; font-family: Arial, sans-serif; background: white;';

        const header = document.createElement('div');
        header.style.cssText = 'text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #333;';
        header.innerHTML = '<h1 style="margin: 0 0 10px 0; font-size: 22px; color: #333;">Laporan Kritik, Saran & Pengaduan</h1><h2 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">Gang E20 / E21</h2><p style="margin: 5px 0; font-size: 12px; color: #999;">Dicetak pada: ' + dateStr + ' | Total: ' + saranData.length + ' laporan</p>';
        wrapper.appendChild(header);

        const tableClone = document.getElementById('saranTable').cloneNode(true);
        tableClone.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 10px;';

        const adminCells = tableClone.querySelectorAll('td.admin-only, th.admin-only');
        adminCells.forEach(cell => cell.parentNode.removeChild(cell));

        wrapper.appendChild(tableClone);

        const opt = {
            margin: [5, 5, 5, 5],
            filename: 'Kritik_Saran_Gang_E20_E21_' + now.getTime() + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 1.5, useCORS: true, allowTaint: true },
            jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
        };

        html2pdf().set(opt).from(wrapper).save().then(() => {
            showToast('PDF berhasil di-download!');
        });
    } catch (error) {
        console.error('Error exporting saran PDF:', error);
        showToast('Gagal membuat PDF!');
    }
}

// Run Init
init();

