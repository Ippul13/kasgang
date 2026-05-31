const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyrRwfvoEAdThKE4dSAoaXkhuEcgTPynsQnLc5HD_8LqOFyonezufPVW5PRLJUn6m1f-A/exec';

// URL untuk Google Apps Script Iuran Warga
const SCRIPT_URL_IURAN = 'https://script.google.com/macros/s/AKfycbyE1TbXzfVtHwvseEZ7llZguvLE3wr34dx7xQCrT4ZJizR-l9Ivrs7RRO3uvSYQLGgDoA/exec';

// URL untuk Google Apps Script Program Kerja
const SCRIPT_URL_PROGRAM = 'https://script.google.com/macros/s/AKfycby_ykQEkE8S5pIyEdbA2uOeb77g50r6U37f-yogxGwmFF1FHKRxvZDpZe2xlqn3znfOpw/exec';

// URL untuk Google Apps Script Inventaris
const SCRIPT_URL_INVENTARIS = 'https://script.google.com/macros/s/AKfycbwGJrEfvfF_3yyBumTNzJwDZlMAyYoXbGC-mhQEMeaELIJGCOFqtAxw1ocWP5ibdseX/exec';

// State
let transactions = [];
let currentFilteredTransactions = [];
let iuranData = [];
let inventarisData = [];
let programKerjaData = [];
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
const closeMenuBtn = document.getElementById('closeMenuBtn');

// Filter Elements
const filterYear = document.getElementById('filterYear');
const filterMonth = document.getElementById('filterMonth');
const filterType = document.getElementById('filterType');
const btnResetFilter = document.getElementById('btnResetFilter');

// Login State & Credentials (default: username: admin, password: admin123)
let isLoggedIn = false;
const VALID_CREDENTIALS = {
    username: 'admin',
    password: 'admin123',
    
};

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
        // Simulate async validation (bisa diganti dengan server auth)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
            isLoggedIn = true;
            loginModal.classList.remove('show');
            loginForm.reset();
            updateAuthButton();
            showToast('Login berhasil!');
            
            // Buka tab Input Transaksi
            document.querySelector('.nav-links li[data-target="input"]').click();
        } else {
            throw new Error('Username atau password salah');
        }
    } catch (error) {
        loginMessage.textContent = error.message;
        loginMessage.className = 'message-box error';
        loginMessage.style.display = 'block';
    } finally {
        btnLoginSubmit.disabled = false;
        btnLoginText.textContent = 'Login';
        btnLoginLoading.style.display = 'none';
    }
});

// Update Auth Button
function updateAuthButton() {
    const navInput = document.getElementById('navInput');
    
    if (isLoggedIn) {
        btnAuthToggle.style.backgroundColor = 'var(--success-color)';
        btnAuthToggle.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> <span class="nav-text">Logout</span>';
        navInput.style.display = 'block'; // Tampilkan menu Input Transaksi
    } else {
        btnAuthToggle.style.backgroundColor = 'var(--text-muted)';
        btnAuthToggle.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> <span class="nav-text">Login Admin</span>';
        navInput.style.display = 'none'; // Sembunyikan menu Input Transaksi
    }
}

// Logout Function
function logout() {
    isLoggedIn = false;
    updateAuthButton();
    showToast('Logout berhasil!');
    // Kembali ke Dashboard
    document.querySelector('.nav-links li[data-target="dashboard"]').click();
}

// Proteksi Menu Input Transaksi
function checkInputAccess() {
    if (!isLoggedIn) {
        loginModal.classList.add('show');
        return false;
    }
    return true;
}

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
        <h1>LAPORAN KAS Gang E20 / E21</h1>
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
        html: previewHTML
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
    const opt = {
        margin: [5, 5, 5, 5],
        filename: `Laporan_Kas_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a3' }
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

    // Fetch initial data
    if (SCRIPT_URL !== 'URL_GOOGLE_APPS_SCRIPT_ANDA_DISINI') {
        fetchData();
        fetchIuranData();
    } else {
        console.warn('Silakan masukkan SCRIPT_URL terlebih dahulu.');
    }
    
    // Setup mobile menu
    setupMobileMenu();
}

// Mobile Menu Toggle Functions
function setupMobileMenu() {
    // Hamburger button click
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Close button click
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMobileMenu);
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
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
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
        historyTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Belum ada data transaksi sesuai filter</td></tr>`;
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

        const row = `
            <tr>
                <td>${index + 1}</td>
                <td>${formatDate(t.Tanggal)}</td>
                <td>${t.Keterangan}</td>
                <td><span class="${badgeClass}">${jenis}</span></td>
                <td class="${textClass}">${sign} ${formatRupiah(t.Nominal)}</td>
                <td style="font-size: 12px; color: var(--text-muted);">${new Date(t.Timestamp).toLocaleString('id-ID')}</td>
            </tr>
        `;
        historyTableBody.innerHTML += row;
    });
}

// Fetch Iuran Data from Separate Sheet
async function fetchIuranData() {
    try {
        iuranTableBody.innerHTML = '<tr><td colspan="14" style="text-align:center; color:var(--text-muted);">Memuat data iuran warga...</td></tr>';
        
        // Check if SCRIPT_URL_IURAN is configured
        if (SCRIPT_URL_IURAN.includes('YOUR_IURAN_SCRIPT_URL_HERE')) {
            iuranTableBody.innerHTML = '<tr><td colspan="14" style="text-align:center; color:var(--text-danger);"><strong>⚠️ Belum dikonfigurasi!</strong><br>Silakan atur SCRIPT_URL_IURAN di app.js</td></tr>';
            console.warn('SCRIPT_URL_IURAN belum dikonfigurasi');
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
        iuranTableBody.innerHTML = '<tr><td colspan="14" style="text-align:center; color:var(--text-muted);">Belum ada data iuran warga</td></tr>';
        return;
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Juni', 'Juli', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    iuranData.forEach((resident, index) => {
        let row = `<tr><td>${index + 1}</td><td>${resident.Rumah || ''} - ${resident.Nama || ''}</td>`;
        
        // Add monthly status
        for (let i = 0; i < 12; i++) {
            const monthKey = months[i];
            const status = resident[monthKey] || '';
            const statusClass = status === 'Y' || status === '✓' || status === 'V' ? 'iuran-status-check' : 'iuran-status-empty';
            const displayValue = status === 'Y' || status === '✓' || status === 'V' ? '✓' : '-';
            row += `<td class="${statusClass}">${displayValue}</td>`;
        }
        
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
        iuranTableBody.innerHTML = '<tr><td colspan="14" style="text-align:center; color:var(--text-muted);">Tidak ada data yang cocok dengan pencarian</td></tr>';
        return;
    }
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Juni', 'Juli', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    filteredData.forEach((resident, index) => {
        let row = `<tr><td>${index + 1}</td><td>${resident.Rumah || ''} - ${resident.Nama || ''}</td>`;
        
        for (let i = 0; i < 12; i++) {
            const monthKey = months[i];
            const status = resident[monthKey] || '';
            const statusClass = status === 'Y' || status === '✓' || status === 'V' ? 'iuran-status-check' : 'iuran-status-empty';
            const displayValue = status === 'Y' || status === '✓' || status === 'V' ? '✓' : '-';
            row += `<td class="${statusClass}">${displayValue}</td>`;
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
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Memuat data inventaris...</td></tr>';
        return;
    }
    
    inventarisData.forEach(item => {
        const row = document.createElement('tr');
        const kondisiClass = item.kondisi === 'Baik' ? 'good' : item.kondisi === 'Cukup' ? 'fair' : 'poor';
        
        row.innerHTML = `
            <td>${item.no}</td>
            <td>${item.nama}</td>
            <td>${item.kategori}</td>
            <td style="text-align: center;">${item.jumlah}</td>
            <td><span class="status-badge status-${kondisiClass}">${item.kondisi}</span></td>
            <td>${item.lokasi}</td>
            <td>${item.keterangan}</td>
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
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Memuat data program kerja...</td></tr>';
        return;
    }
    
    programKerjaData.forEach(item => {
        const row = document.createElement('tr');
        let statusClass = 'pending';
        if (item.status === 'Selesai') statusClass = 'done';
        else if (item.status === 'Dalam Proses') statusClass = 'in-progress';
        else if (item.status === 'Berkelanjutan') statusClass = 'ongoing';
        
        row.innerHTML = `
            <td>${item.no}</td>
            <td><strong>${item.program}</strong></td>
            <td>${item.pic}</td>
            <td>${item.target}</td>
            <td><span class="status-badge status-${statusClass}">${item.status}</span></td>
            <td>${item.keterangan}</td>
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

    if (SCRIPT_URL === 'URL_GOOGLE_APPS_SCRIPT_ANDA_DISINI') {
        alert('Anda belum mengatur SCRIPT_URL. Silakan edit app.js dan masukkan URL Web App Google Apps Script Anda.');
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
        formMessage.textContent = 'Terjadi kesalahan. Pastikan Web App URL benar dan sudah di-deploy dengan akses "Anyone".';
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

// Run Init
init();
