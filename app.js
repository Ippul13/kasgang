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

// FAB Login Button (Mobile)
const fabLoginBtn = document.getElementById('fabLoginBtn');
if (fabLoginBtn) {
    fabLoginBtn.addEventListener('click', () => {
        if (isLoggedIn) {
            logout();
        } else {
            loginModal.classList.add('show');
        }
    });
}

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

        if (targetId === 'warga' && isLoggedIn) {
            fetchWargaData();
        }

        if (targetId === 'galeri') {
            fetchGaleriData();
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

// Export Transactions to Excel
function exportToExcel() {
    if (currentFilteredTransactions.length === 0) {
        showToast('Tidak ada data untuk di-export!');
        return;
    }

    const header = ['No', 'Tanggal', 'Keterangan', 'Jenis', 'Nominal'];
    const rows = [header];
    currentFilteredTransactions.forEach((t, index) => {
        const jenis = (t.Jenis || '').trim();
        const nominal = parseFloat(t.Nominal) || 0;
        rows.push([
            index + 1,
            formatDate(t.Tanggal),
            t.Keterangan || '',
            jenis,
            nominal
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) {
            view[i] = s.charCodeAt(i) & 0xff;
        }
        return buf;
    }
    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Kas_${new Date().toISOString().slice(0,10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Export PDF Button Handler
const btnExportPDF = document.getElementById('btnExportPDF');
if (btnExportPDF) {
    btnExportPDF.addEventListener('click', exportToPDF);
}

// Export Excel Button Handler
const btnExportExcel = document.getElementById('btnExportExcel');
if (btnExportExcel) {
    btnExportExcel.addEventListener('click', exportToExcel);
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
    totalBalanceEl.textContent = formatRupiah(balance);
    totalIncomeEl.textContent = formatRupiah(filteredIncome);
    totalExpenseEl.textContent = formatRupiah(filteredExpense);
}

// Render Tables (Dashboard only â€” history tab removed)
function renderTables() {
    recentTableBody.innerHTML = '';

    if (currentFilteredTransactions.length === 0) {
        recentTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Belum ada data transaksi sesuai filter</td></tr>`;
        return;
    }

    const reversedTransactions = [...currentFilteredTransactions].reverse();

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
}

// Fetch Iuran Data from Separate Sheet
async function fetchIuranData() {
    try {
        iuranTableBody.innerHTML = '<tr><td colspan="18" style="text-align:center; color:var(--text-muted);">Memuat data iuran warga...</td></tr>';
        
        // Check if BASE_API_URL is configured
        if (BASE_API_URL.includes('username.workers.dev')) {
            iuranTableBody.innerHTML = '<tr><td colspan="18" style="text-align:center; color:var(--text-danger);"><strong>&#9888; Belum dikonfigurasi!</strong><br>Silakan atur BASE_API_URL di app.js</td></tr>';
            console.warn('BASE_API_URL belum dikonfigurasi');
            return;
        }
        
        const response = await fetch(SCRIPT_URL_IURAN);
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            iuranData = result.data;
            renderIuranTable();
        } else {
            iuranTableBody.innerHTML = '<tr><td colspan="18" style="text-align:center; color:var(--text-muted);">Gagal memuat data iuran: ' + (result.message || 'Unknown error') + '</td></tr>';
            console.error('Error fetching iuran data:', result.message);
        }
    } catch (error) {
        console.error('Network error:', error);
        iuranTableBody.innerHTML = '<tr><td colspan="18" style="text-align:center; color:var(--text-muted);">Terjadi kesalahan saat memuat data</td></tr>';
    }
}

// Render Iuran Table
function renderIuranTable() {
    iuranTableBody.innerHTML = '';
    
    if (iuranData.length === 0) {
        iuranTableBody.innerHTML = '<tr><td colspan="18" style="text-align:center; color:var(--text-muted);">Belum ada data iuran warga</td></tr>';
        return;
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Juni', 'Juli', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    iuranData.forEach((resident, index) => {
        let row = `<tr><td>${index + 1}</td><td>${resident.Rumah || ''} - ${resident.Nama || ''}</td>`;
        
        // Add monthly status
        for (let i = 0; i < 12; i++) {
            const monthKey = months[i];
            const status = resident[monthKey] || '';
            const isPaid = (status === 'Y' || status === 'V' || (status.trim().length > 0 && status.trim() !== '-'));
            const statusClass = isPaid ? 'iuran-status-check' : 'iuran-status-empty';
            const displayValue = isPaid ? '<i class="fa-solid fa-check"></i>' : '-';
            row += `<td class="${statusClass}">${displayValue}</td>`;
        }
        
        // Add nominal columns
        const hutRi = parseInt(resident.HutRI) || 0;
        const thrSecurity = parseInt(resident.ThrSecurity) || 0;
        const partisipasiRonda = parseInt(resident.PartisipasiRonda) || 0;
        row += `<td style="text-align: right;">Rp ${hutRi.toLocaleString('id-ID')}</td>`;
        row += `<td style="text-align: right;">Rp ${thrSecurity.toLocaleString('id-ID')}</td>`;
        row += `<td style="text-align: right;">Rp ${partisipasiRonda.toLocaleString('id-ID')}</td>`;
        
        // Always add action column (CSS controls visibility)
        row += `
            <td class="admin-only" style="text-align: center;">
                <button onclick="openWargaModal('${resident.Rumah}')" class="btn-action edit" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
            </td>
        `;
        
        row += '</tr>';
        iuranTableBody.innerHTML += row;
    });

    // Re-apply admin visibility after render
    applyAdminVisibility();
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
        iuranTableBody.innerHTML = '<tr><td colspan="18" style="text-align:center; color:var(--text-muted);">Tidak ada data yang cocok dengan pencarian</td></tr>';
        return;
    }
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Juni', 'Juli', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    filteredData.forEach((resident, index) => {
        let row = `<tr><td>${index + 1}</td><td>${resident.Rumah || ''} - ${resident.Nama || ''}</td>`;
        
        for (let i = 0; i < 12; i++) {
            const monthKey = months[i];
            const status = resident[monthKey] || '';
            const isPaid = (status === 'Y' || status === 'V' || (status.trim().length > 0 && status.trim() !== '-'));
            const statusClass = isPaid ? 'iuran-status-check' : 'iuran-status-empty';
            const displayValue = isPaid ? '<i class="fa-solid fa-check"></i>' : '-';
            row += `<td class="${statusClass}">${displayValue}</td>`;
        }
        
        const hutRi2 = parseInt(resident.HutRI) || 0;
        const thrSecurity2 = parseInt(resident.ThrSecurity) || 0;
        const partisipasiRonda2 = parseInt(resident.PartisipasiRonda) || 0;
        row += `<td style="text-align: right;">Rp ${hutRi2.toLocaleString('id-ID')}</td>`;
        row += `<td style="text-align: right;">Rp ${thrSecurity2.toLocaleString('id-ID')}</td>`;
        row += `<td style="text-align: right;">Rp ${partisipasiRonda2.toLocaleString('id-ID')}</td>`;
        
        // Always add action column (CSS controls visibility)
        row += `
            <td class="admin-only" style="text-align: center;">
                <button onclick="openWargaModal('${resident.Rumah}')" class="btn-action edit" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
            </td>
        `;
        
        row += '</tr>';
        iuranTableBody.innerHTML += row;
    });

    // Re-apply admin visibility after render
    applyAdminVisibility();
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
        <h1 style="margin: 0 0 10px 0; font-size: 22px; color: #333;">Kas Gang Rp: 10.000 | Kas RT Rp: 10.000 | Kas BSK Rp: 5.000 | HUT RI, THR Security dan Iuran Ronda (Tahunan)</h1>
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

// Export Iuran to Excel
function exportIuranToExcel() {
    if (iuranData.length === 0) {
        alert('Belum ada data iuran untuk diexport');
        return;
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Juni', 'Juli', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const header = ['No', 'Rumah', 'Nama', ...months, 'HUT RI', 'THR Security', 'Partisipasi Ronda'];
    const rows = [header];
    iuranData.forEach((resident, index) => {
        const row = [index + 1, resident.Rumah || '', resident.Nama || ''];
        for (let i = 0; i < 12; i++) {
            const val = resident[months[i]] || '';
            const isPaid = (val === 'Y' || val === 'V' || (val.trim().length > 0 && val.trim() !== '-'));
            row.push(isPaid ? 'Y' : '-');
        }
        const hutRI = parseInt(resident.HutRI) || 0;
        const thrSecurity = parseInt(resident.ThrSecurity) || 0;
        const partisipasiRonda = parseInt(resident.PartisipasiRonda) || 0;
        row.push(hutRI);
        row.push(thrSecurity);
        row.push(partisipasiRonda);
        rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Iuran Bulanan');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) {
            view[i] = s.charCodeAt(i) & 0xff;
        }
        return buf;
    }
    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Iuran_Warga_2026.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

function exportInventarisToExcel() {
    if (inventarisData.length === 0) {
        alert('Belum ada data inventaris untuk diexport');
        return;
    }

    const header = ['No', 'Nama Barang', 'Kategori', 'Jumlah', 'Kondisi', 'Lokasi', 'Keterangan'];
    const rows = [header];
    inventarisData.forEach(item => {
        rows.push([
            item.no || '',
            item.nama || '',
            item.kategori || '',
            item.jumlah || '',
            item.kondisi || '',
            item.lokasi || '',
            item.keterangan || ''
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventaris');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) {
            view[i] = s.charCodeAt(i) & 0xff;
        }
        return buf;
    }
    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Inventaris_Gang_E20_E21.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

function exportProgramKerjaToExcel() {
    if (programKerjaData.length === 0) {
        alert('Belum ada data program kerja untuk diexport');
        return;
    }

    const header = ['No', 'Program Kerja', 'PIC', 'Target', 'Status', 'Keterangan'];
    const rows = [header];
    programKerjaData.forEach(item => {
        rows.push([
            item.no || '',
            item.program || '',
            item.pic || '',
            item.target || '',
            item.status || '',
            item.keterangan || ''
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Program Kerja');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) {
            view[i] = s.charCodeAt(i) & 0xff;
        }
        return buf;
    }
    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Program_Kerja_Gang_E20_E21.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                <button onclick="openInventarisModal(${item.no})" class="btn-action edit" title="Edit" style="margin-right: 8px;"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="confirmDelete('Hapus inventaris &quot;${item.nama}&quot;?', () => deleteInventaris(${item.no}))" class="btn-action delete" title="Hapus"><i class='fa-solid fa-trash'></i></button>
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

    // Re-apply admin visibility after render
    applyAdminVisibility();
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
                <button onclick="openProgramModal(${item.no})" class="btn-action edit" title="Edit" style="margin-right: 8px;"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="confirmDelete('Hapus program &quot;${item.program}&quot;?', () => deleteProgram(${item.no}))" class="btn-action delete" title="Hapus"><i class='fa-solid fa-trash'></i></button>
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

    // Re-apply admin visibility after render
    applyAdminVisibility();
}

// Handle Iuran Export Button
document.addEventListener('DOMContentLoaded', () => {
    const btnExportIuran = document.getElementById('btnExportIuranPDF');
    if (btnExportIuran) {
        btnExportIuran.addEventListener('click', exportIuranToPDF);
    }

    const btnExportIuranExcel = document.getElementById('btnExportIuranExcel');
    if (btnExportIuranExcel) {
        btnExportIuranExcel.addEventListener('click', exportIuranToExcel);
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

    const btnExportInventarisExcel = document.getElementById('btnExportInventarisExcel');
    if (btnExportInventarisExcel) {
        btnExportInventarisExcel.addEventListener('click', exportInventarisToExcel);
    }

    // Handle Program Kerja Export Button
    const btnExportProgram = document.getElementById('btnExportProgramPDF');
    if (btnExportProgram) {
        btnExportProgram.addEventListener('click', exportProgramKerjaToPDF);
    }

    const btnExportProgramExcel = document.getElementById('btnExportProgramExcel');
    if (btnExportProgramExcel) {
        btnExportProgramExcel.addEventListener('click', exportProgramKerjaToExcel);
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

    // Data Warga
    const btnTambahWargaData = document.getElementById('btnTambahWargaData');
    if (btnTambahWargaData) {
        btnTambahWargaData.addEventListener('click', () => openWargaDataModal());
    }

    const btnExportWargaPDF = document.getElementById('btnExportWargaPDF');
    if (btnExportWargaPDF) {
        btnExportWargaPDF.addEventListener('click', exportWargaToPDF);
    }

    const closeWargaDataModalBtn = document.getElementById('closeWargaDataModal');
    if (closeWargaDataModalBtn) {
        closeWargaDataModalBtn.addEventListener('click', closeWargaDataModal);
    }

    const wargaDataForm = document.getElementById('wargaDataForm');
    if (wargaDataForm) {
        wargaDataForm.addEventListener('submit', handleWargaDataSubmit);
    }

    const wargaSearchInput = document.getElementById('wargaSearchInput');
    if (wargaSearchInput) {
        wargaSearchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const filtered = wargaData.filter(w =>
                w.nama.toLowerCase().includes(q) || w.no_rumah.toLowerCase().includes(q)
            );
            renderWargaTable(filtered);
        });
    }

    const btnResetWargaSearch = document.getElementById('btnResetWargaSearch');
    if (btnResetWargaSearch) {
        btnResetWargaSearch.addEventListener('click', () => {
            const inp = document.getElementById('wargaSearchInput');
            if (inp) inp.value = '';
            renderWargaTable(wargaData);
        });
    }

    // Close wargaDataModal on backdrop click
    document.getElementById('wargaDataModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('wargaDataModal')) closeWargaDataModal();
    });

    // â”€â”€ GALERI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const btnUploadFoto = document.getElementById('btnUploadFoto');
    if (btnUploadFoto) btnUploadFoto.addEventListener('click', openGaleriUploadModal);

    const btnSyncGaleri = document.getElementById('btnSyncGaleri');
    if (btnSyncGaleri) btnSyncGaleri.addEventListener('click', syncGaleriFromR2);

    const closeGaleriUploadModalBtn = document.getElementById('closeGaleriUploadModal');
    if (closeGaleriUploadModalBtn) closeGaleriUploadModalBtn.addEventListener('click', closeGaleriUploadModal);

    document.getElementById('galeriUploadModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('galeriUploadModal')) closeGaleriUploadModal();
    });

    const galeriUploadForm = document.getElementById('galeriUploadForm');
    if (galeriUploadForm) galeriUploadForm.addEventListener('submit', handleGaleriUpload);

    // File input + drag-drop
    const galeriFotoInput = document.getElementById('galeriFotoInput');
    const galeriDropZone = document.getElementById('galeriDropZone');

    if (galeriFotoInput) {
        galeriFotoInput.addEventListener('change', (e) => previewGaleriFile(e.target.files[0]));
    }
    if (galeriDropZone) {
        galeriDropZone.addEventListener('dragover', (e) => { e.preventDefault(); galeriDropZone.classList.add('drag-over'); });
        galeriDropZone.addEventListener('dragleave', () => galeriDropZone.classList.remove('drag-over'));
        galeriDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            galeriDropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                galeriFotoInput.files = e.dataTransfer.files;
                previewGaleriFile(file);
            }
        });
    }

    // Search galeri
    const galeriSearchInput = document.getElementById('galeriSearchInput');
    if (galeriSearchInput) {
        galeriSearchInput.addEventListener('input', (e) => filterGaleri(e.target.value));
    }

    // Lightbox controls
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev').addEventListener('click', () => navigateLightbox(-1));
    document.getElementById('lightboxNext').addEventListener('click', () => navigateLightbox(1));
    document.getElementById('lightboxDelete').addEventListener('click', () => {
        const id = document.getElementById('lightboxDelete').dataset.id;
        if (id) confirmDelete('Hapus foto ini dari galeri?', () => deleteGaleriFoto(parseInt(id)));
    });
    document.getElementById('galeriLightbox').addEventListener('click', (e) => {
        if (e.target === document.getElementById('galeriLightbox')) closeLightbox();
    });

    // Keyboard nav for lightbox
    document.addEventListener('keydown', (e) => {
        if (!document.getElementById('galeriLightbox').classList.contains('open')) return;
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
        if (e.key === 'Escape') closeLightbox();
    });
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
    const phoneNumber = '6282333270800'; // Ganti dengan nomor WhatsApp admin
    const message = `Konfirmasi Pembayaran warga Gang E20/E21\n\n` +
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
function applyAdminVisibility() {
    document.querySelectorAll('.admin-only').forEach(el => {
        if (isLoggedIn) {
            el.classList.add('show');
        } else {
            el.classList.remove('show');
        }
    });
}

function updateAuthButton() {
    const authToggle = document.getElementById('btnAuthToggle');
    const fabBtn = document.getElementById('fabLoginBtn');
    const adminElements = document.querySelectorAll('.admin-only');
    const navInput = document.getElementById('navInput');
    
    if (isLoggedIn) {
        authToggle.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> <span class="nav-text">Logout</span>';
        authToggle.style.backgroundColor = 'var(--primary-color)';
        if (fabBtn) {
            fabBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i>';
            fabBtn.title = 'Logout';
            fabBtn.classList.add('logged-in');
        }
        adminElements.forEach(el => el.classList.add('show'));
        if (navInput) navInput.classList.add('admin-visible');
        const navWarga = document.getElementById('navWarga');
        if (navWarga) navWarga.classList.add('admin-visible');
        document.body.classList.add('admin-logged-in');
        fetchSaranData();
    } else {
        authToggle.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> <span class="nav-text">Login Admin</span>';
        authToggle.style.backgroundColor = 'var(--text-muted)';
        if (fabBtn) {
            fabBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i>';
            fabBtn.title = 'Login Admin';
            fabBtn.classList.remove('logged-in');
        }
        adminElements.forEach(el => el.classList.remove('show'));
        if (navInput) navInput.classList.remove('admin-visible');
        const navWarga2 = document.getElementById('navWarga');
        if (navWarga2) navWarga2.classList.remove('admin-visible');
        document.body.classList.remove('admin-logged-in');
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
        
        document.getElementById('wargaModalTitle').textContent = 'Update Data';
        document.getElementById('wargaRumah').value = resident.Rumah;
        document.getElementById('wargaNama').value = resident.Nama;
        document.getElementById('wargaRumah').readOnly = true;
        document.getElementById('originalRumah').value = rumah;
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Juni', 'Juli', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        months.forEach(month => {
            const checkbox = document.getElementById(`check${month}`);
            if (checkbox) {
                checkbox.checked = resident[month] === 'Y' || resident[month] === 'V' || (resident[month] && resident[month].trim().length > 0 && resident[month].trim() !== '-');
            }
        });
        
        const hutRiVal = parseInt(resident.HutRI) || 0;
        const thrSecurityVal = parseInt(resident.ThrSecurity) || 0;
        const partisipasiRondaVal = parseInt(resident.PartisipasiRonda) || 0;
        const inputHutRI = document.getElementById('wargaHutRI');
        const inputThrSecurity = document.getElementById('wargaThrSecurity');
        const inputPartisipasiRonda = document.getElementById('wargaPartisipasiRonda');
        if (inputHutRI) inputHutRI.value = hutRiVal;
        if (inputThrSecurity) inputThrSecurity.value = thrSecurityVal;
        if (inputPartisipasiRonda) inputPartisipasiRonda.value = partisipasiRondaVal;
    } else {
        // Add mode
        document.getElementById('wargaModalTitle').textContent = 'Tambah Data Warga';
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
        
        document.getElementById('inventarisModalTitle').textContent = 'Edit Inventaris';
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
        document.getElementById('inventarisModalTitle').textContent = 'Tambah Inventaris';
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
        
        document.getElementById('programModalTitle').textContent = 'Edit Program Kerja';
        document.getElementById('progNo').value = item.no;
        document.getElementById('progProgram').value = item.program;
        document.getElementById('progPic').value = item.pic;
        document.getElementById('progTarget').value = item.target;
        document.getElementById('progStatus').value = item.status;
        document.getElementById('progKeterangan').value = item.keterangan || '';
        document.getElementById('progNo').readOnly = true;
    } else {
        // Add mode
        document.getElementById('programModalTitle').textContent = 'Tambah Program Kerja';
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
    
    const hutRI = document.getElementById('wargaHutRI').value || '0';
    const thrSecurity = document.getElementById('wargaThrSecurity').value || '0';
    const partisipasiRonda = document.getElementById('wargaPartisipasiRonda').value || '0';
    data.HutRI = parseInt(hutRI);
    data.ThrSecurity = parseInt(thrSecurity);
    data.PartisipasiRonda = parseInt(partisipasiRonda);
    
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
            '<button onclick="confirmDelete(\'Hapus laporan dari ' + escapeHtml(item.nama) + '?\', () => deleteSaran(' + item.id + '))" class="btn-action delete" title="Hapus"><i class="fa-solid fa-trash"></i></button>' +
            '</td>';
        tbody.appendChild(row);
    });

    // Re-apply admin visibility after render
    applyAdminVisibility();
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

async function exportSaranToPDF() {
    if (!isLoggedIn) {
        alert('Anda harus login sebagai admin terlebih dahulu');
        return;
    }

    let wrapper = null;
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

        // Bangun HTML string langsung â€” lebih reliable daripada clone DOM
        let tableRows = '';
        saranData.forEach((item, index) => {
            const lampiran = item.foto
                ? '<span style="color:#4f46e5;">Ada</span>'
                : '-';
            const timestampCell = item.timestamp || item.Timestamp
                ? formatDateTime(item.timestamp || item.Timestamp)
                : '-';
            tableRows += `<tr style="background:${index % 2 === 0 ? '#ffffff' : '#f9fafb'}">
                <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${index + 1}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">${formatDate(item.tanggal)}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(item.nama || '-')}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(item.alamat || '-')}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;max-width:250px;word-wrap:break-word;">${escapeHtml(truncateText(item.detail, 200))}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(timestampCell)}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${lampiran}</td>
            </tr>`;
        });

        const htmlContent = `
            <div style="font-family:Arial,sans-serif;font-size:11px;color:#333;padding:20px;background:white;">
                <div style="text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #333;">
                    <h1 style="margin:0 0 6px 0;font-size:20px;">Laporan Kritik, Saran &amp; Pengaduan</h1>
                    <h2 style="margin:0 0 6px 0;font-size:14px;font-weight:500;">Gang E20 / E21</h2>
                    <p style="margin:0;font-size:11px;color:#888;">Dicetak pada: ${dateStr} &nbsp;|&nbsp; Total: ${saranData.length} laporan</p>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:10px;">
                    <thead>
                        <tr style="background:#4f46e5;color:white;">
                            <th style="padding:10px 8px;border:1px solid #4338ca;text-align:center;width:30px;">No</th>
                            <th style="padding:10px 8px;border:1px solid #4338ca;width:80px;">Tanggal</th>
                            <th style="padding:10px 8px;border:1px solid #4338ca;width:120px;">Pengirim</th>
                            <th style="padding:10px 8px;border:1px solid #4338ca;width:100px;">Alamat</th>
                            <th style="padding:10px 8px;border:1px solid #4338ca;">Detail</th>
                            <th style="padding:10px 8px;border:1px solid #4338ca;width:120px;">Waktu Masuk</th>
                            <th style="padding:10px 8px;border:1px solid #4338ca;width:60px;text-align:center;">Lampiran</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>`;

        wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:absolute;left:-9999px;top:0;width:1100px;background:white;';
        wrapper.innerHTML = htmlContent;
        document.body.appendChild(wrapper);

        // Tunggu satu frame agar browser sempat layout
        await new Promise(resolve => setTimeout(resolve, 100));

        const opt = {
            margin: [8, 8, 8, 8],
            filename: 'Kritik_Saran_Gang_E20_E21_' + now.getTime() + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 1.5, useCORS: true, allowTaint: true, logging: false },
            jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
        };

        await html2pdf().set(opt).from(wrapper).save();
        showToast('PDF berhasil di-download!');
    } catch (error) {
        console.error('Error exporting saran PDF:', error);
        showToast('Gagal membuat PDF!');
    } finally {
        if (wrapper && document.body.contains(wrapper)) {
            document.body.removeChild(wrapper);
        }
    }
}

// ========== DATA WARGA ==========

let wargaData = [];

async function fetchWargaData() {
    const tbody = document.getElementById('wargaTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);">Memuat data warga...</td></tr>';

    try {
        const response = await fetch(BASE_API_URL + '/api/warga');
        const result = await response.json();
        if (result.status === 'success') {
            wargaData = result.data || [];
            renderWargaTable(wargaData);
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);">Gagal memuat data warga</td></tr>';
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);">Error: ' + err.message + '</td></tr>';
    }
}

function renderWargaTable(data) {
    const tbody = document.getElementById('wargaTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);">Belum ada data warga</td></tr>';
        applyAdminVisibility();
        return;
    }

    data.forEach((w, index) => {
        const row = document.createElement('tr');
        const kkCell = w.has_kk
            ? `<button class="warga-kk-btn" onclick="viewWargaKK(${w.id}, '${escapeHtml(w.file_kk_nama || 'File KK')}')">
                   <i class="fa-solid fa-file-arrow-down"></i> ${escapeHtml(w.file_kk_nama || 'Lihat KK')}
               </button>`
            : '<span class="warga-no-kk">-</span>';

        row.innerHTML = `
            <td style="text-align:center;">${index + 1}</td>
            <td><strong>${escapeHtml(w.no_rumah)}</strong></td>
            <td>${escapeHtml(w.nama)}</td>
            <td>${w.no_telp ? '<a href="https://wa.me/62' + escapeHtml(w.no_telp.replace(/^0/, '').replace(/\D/g,'')) + '" target="_blank" style="color:var(--primary-color);text-decoration:none;"><i class="fa-brands fa-whatsapp" style="color:#25D366;"></i> ' + escapeHtml(w.no_telp) + '</a>' : '-'}</td>
            <td style="text-align:center;"><span class="warga-anggota-badge">${w.jumlah_anggota || 1}</span></td>
            <td>${kkCell}</td>
            <td class="admin-only" style="text-align:center;">
                <button onclick="openWargaDataModal(${w.id})" class="btn-action edit" title="Edit" style="margin-right:6px;"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="confirmDelete('Hapus data warga ${escapeHtml(w.nama)}?', () => deleteWargaData(${w.id}))" class="btn-action delete" title="Hapus"><i class='fa-solid fa-trash'></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });

    applyAdminVisibility();
}

async function viewWargaKK(id, filename) {
    try {
        showToast('Mengambil file KK...');
        const response = await fetch(BASE_API_URL + '/api/warga/kk?id=' + id);
        const result = await response.json();
        if (result.status === 'success' && result.file_kk) {
            const isPdf = (result.file_kk_nama || filename).toLowerCase().endsWith('.pdf') ||
                          result.file_kk.startsWith('data:application/pdf');
            const dataUrl = result.file_kk.startsWith('data:')
                ? result.file_kk
                : (isPdf ? 'data:application/pdf;base64,' : 'data:image/jpeg;base64,') + result.file_kk;

            const win = window.open('', '_blank');
            if (win) {
                if (isPdf) {
                    win.document.write(`<html><head><title>${filename}</title></head><body style="margin:0;"><embed src="${dataUrl}" type="application/pdf" width="100%" height="100%" style="min-height:100vh;"/></body></html>`);
                } else {
                    win.document.write(`<html><head><title>${filename}</title></head><body style="margin:0;background:#111;display:flex;justify-content:center;align-items:center;min-height:100vh;"><img src="${dataUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;" alt="File KK"/></body></html>`);
                }
                win.document.close();
            }
        } else {
            showToast('File KK tidak ditemukan');
        }
    } catch (err) {
        showToast('Gagal mengambil file KK');
    }
}

function openWargaDataModal(id = null) {
    const modal = document.getElementById('wargaDataModal');
    const form = document.getElementById('wargaDataForm');
    const title = document.getElementById('wargaDataModalTitle');
    const msgBox = document.getElementById('wargaDataFormMessage');
    const kkInfo = document.getElementById('wargaDataKKInfo');

    form.reset();
    msgBox.style.display = 'none';
    kkInfo.textContent = '';

    if (id) {
        const w = wargaData.find(x => x.id === id);
        if (!w) return;
        title.textContent = 'Edit Data Warga';
        document.getElementById('wargaDataId').value = w.id;
        document.getElementById('wargaDataRumah').value = w.no_rumah;
        document.getElementById('wargaDataNama').value = w.nama;
        document.getElementById('wargaDataTelp').value = w.no_telp || '';
        document.getElementById('wargaDataAnggota').value = w.jumlah_anggota || 1;
        if (w.has_kk) {
            kkInfo.textContent = 'File KK saat ini: ' + (w.file_kk_nama || 'Ada') + '. Upload baru untuk mengganti.';
        }
    } else {
        title.textContent = 'Tambah Data Warga';
        document.getElementById('wargaDataId').value = '';
    }

    modal.classList.add('show');
}

function closeWargaDataModal() {
    document.getElementById('wargaDataModal').classList.remove('show');
}

async function handleWargaDataSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById('btnWargaDataSubmit');
    const btnText = document.getElementById('wargaDataBtnText');
    const btnLoading = document.getElementById('wargaDataBtnLoading');
    const msgBox = document.getElementById('wargaDataFormMessage');

    const id = document.getElementById('wargaDataId').value;
    const no_rumah = document.getElementById('wargaDataRumah').value.trim();
    const nama = document.getElementById('wargaDataNama').value.trim();
    const no_telp = document.getElementById('wargaDataTelp').value.trim();
    const jumlah_anggota = parseInt(document.getElementById('wargaDataAnggota').value) || 1;
    const fileInput = document.getElementById('wargaDataKK');
    const file = fileInput.files[0];

    if (!no_rumah || !nama) {
        msgBox.textContent = 'Nomor rumah dan nama wajib diisi!';
        msgBox.className = 'message-box error';
        msgBox.style.display = 'block';
        return;
    }

    if (file && file.size > 2 * 1024 * 1024) {
        msgBox.textContent = 'Ukuran file KK maksimal 2MB!';
        msgBox.className = 'message-box error';
        msgBox.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-block';
    msgBox.style.display = 'none';

    try {
        let file_kk = null;
        let file_kk_nama = null;

        if (file) {
            file_kk = await fileToBase64(file);
            file_kk_nama = file.name;
        }

        const payload = { no_rumah, nama, no_telp, jumlah_anggota, file_kk, file_kk_nama };
        if (id) payload.id = id;

        const response = await fetch(BASE_API_URL + '/api/warga', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.status === 'success') {
            closeWargaDataModal();
            showToast('Data warga berhasil disimpan!');
            fetchWargaData();
        } else {
            throw new Error(result.message || 'Gagal menyimpan data');
        }
    } catch (err) {
        msgBox.textContent = err.message;
        msgBox.className = 'message-box error';
        msgBox.style.display = 'block';
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

async function deleteWargaData(id) {
    try {
        const response = await fetch(BASE_API_URL + '/api/warga?id=' + id, { method: 'DELETE' });
        const result = await response.json();
        if (result.status === 'success') {
            showToast('Data warga berhasil dihapus!');
            fetchWargaData();
        } else {
            alert('Gagal menghapus: ' + (result.message || 'Unknown error'));
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function exportWargaToPDF() {
    if (wargaData.length === 0) {
        showToast('Tidak ada data untuk di-export!');
        return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

    let tableRows = '';
    wargaData.forEach((w, index) => {
        tableRows += `<tr style="background:${index % 2 === 0 ? '#ffffff' : '#f9fafb'}">
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${index + 1}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;">${escapeHtml(w.no_rumah)}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(w.nama)}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(w.no_telp || '-')}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${w.jumlah_anggota || 1}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${w.has_kk ? 'Ada' : '-'}</td>
        </tr>`;
    });

    const htmlContent = `
        <div style="font-family:Arial,sans-serif;font-size:11px;color:#333;padding:20px;background:white;">
            <div style="text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #333;">
                <h1 style="margin:0 0 6px 0;font-size:20px;">Data Warga Gang E20 / E21</h1>
                <p style="margin:0;font-size:11px;color:#888;">Dicetak pada: ${dateStr} &nbsp;|&nbsp; Total: ${wargaData.length} warga</p>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:10px;">
                <thead>
                    <tr style="background:#4f46e5;color:white;">
                        <th style="padding:10px 8px;border:1px solid #4338ca;text-align:center;width:30px;">No</th>
                        <th style="padding:10px 8px;border:1px solid #4338ca;width:80px;">No Rumah</th>
                        <th style="padding:10px 8px;border:1px solid #4338ca;">Nama</th>
                        <th style="padding:10px 8px;border:1px solid #4338ca;width:120px;">No Telp/WA</th>
                        <th style="padding:10px 8px;border:1px solid #4338ca;width:80px;text-align:center;">Jml Anggota</th>
                        <th style="padding:10px 8px;border:1px solid #4338ca;width:70px;text-align:center;">File KK</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>`;

    let wrapper = null;
    try {
        wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:absolute;left:-9999px;top:0;width:900px;background:white;';
        wrapper.innerHTML = htmlContent;
        document.body.appendChild(wrapper);

        await new Promise(resolve => setTimeout(resolve, 100));

        await html2pdf().set({
            margin: [8, 8, 8, 8],
            filename: 'Data_Warga_Gang_E20_E21_' + now.getTime() + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 1.5, useCORS: true, allowTaint: true, logging: false },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        }).from(wrapper).save();

        showToast('PDF berhasil di-download!');
    } catch (err) {
        console.error('Export warga PDF error:', err);
        showToast('Gagal membuat PDF!');
    } finally {
        if (wrapper && document.body.contains(wrapper)) document.body.removeChild(wrapper);
    }
}

// ========== GALERI (R2) ==========
// Foto tersimpan di R2 bucket "galerigang".
// Metadata di D1. Image ditampilkan via /api/galeri/img?key=<r2_key>

let galeriData = [];
let galeriFiltered = [];
let lightboxIndex = 0;

// Helper: URL gambar dari r2_key
function galeriImgUrl(r2Key) {
    return BASE_API_URL + '/api/galeri/img?key=' + encodeURIComponent(r2Key);
}

// â”€â”€ Fetch list metadata â”€â”€
async function fetchGaleriData() {
    const grid = document.getElementById('galeriGrid');
    const empty = document.getElementById('galeriEmpty');
    if (!grid) return;

    grid.innerHTML = '<div class="galeri-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat galeri...</div>';
    if (empty) empty.style.display = 'none';

    try {
        const res = await fetch(BASE_API_URL + '/api/galeri');
        const result = await res.json();
        if (result.status === 'success') {
            galeriData = result.data || [];
            galeriFiltered = [...galeriData];
            renderGaleriGrid(galeriFiltered);
            buildTagFilters();
        } else {
            grid.innerHTML = '<div class="galeri-loading">Gagal memuat galeri</div>';
        }
    } catch (err) {
        grid.innerHTML = '<div class="galeri-loading">Error: ' + err.message + '</div>';
    }
}

// â”€â”€ Render grid â”€â”€
function renderGaleriGrid(data) {
    const grid = document.getElementById('galeriGrid');
    const empty = document.getElementById('galeriEmpty');
    if (!grid) return;

    grid.innerHTML = '';

    if (!data || data.length === 0) {
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';

    data.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'galeri-card';
        card.dataset.id = item.id;
        card.dataset.idx = idx;

        const tagsArr = item.tag ? item.tag.split(',').map(t => t.trim()).filter(Boolean) : [];
        const tagsHtml = tagsArr.map(t => `<span class="galeri-card-tag">${escapeHtml(t)}</span>`).join('');
        const imgSrc = galeriImgUrl(item.r2_key);

        card.innerHTML = `
            <img src="${imgSrc}" alt="${escapeHtml(item.judul)}" loading="lazy">
            <div class="galeri-card-overlay">
                <p class="galeri-card-title">${escapeHtml(item.judul)}</p>
                <div class="galeri-card-tags">${tagsHtml}</div>
            </div>
            <button class="galeri-card-delete admin-only" title="Hapus foto" data-id="${item.id}">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        // Mark img loaded on load event
        const img = card.querySelector('img');
        img.addEventListener('load', () => img.classList.add('loaded'));
        img.addEventListener('error', () => { img.src = ''; img.classList.add('loaded'); });

        card.addEventListener('click', (e) => {
            if (e.target.closest('.galeri-card-delete')) return;
            openLightbox(idx);
        });

        const delBtn = card.querySelector('.galeri-card-delete');
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmDelete(`Hapus foto "${escapeHtml(item.judul)}"?`, () => deleteGaleriFoto(item.id));
        });

        grid.appendChild(card);
    });

    applyAdminVisibility();
    if (isLoggedIn) document.body.classList.add('admin-logged-in');
    else document.body.classList.remove('admin-logged-in');
}

// â”€â”€ Tag filters â”€â”€
function buildTagFilters() {
    const container = document.getElementById('galeriTagFilters');
    if (!container) return;
    const tagSet = new Set();
    galeriData.forEach(item => {
        if (item.tag) item.tag.split(',').forEach(t => { const c = t.trim(); if (c) tagSet.add(c); });
    });
    container.innerHTML = '';
    tagSet.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'galeri-tag-btn';
        btn.dataset.tag = tag;
        btn.textContent = tag;
        btn.addEventListener('click', () => setTagFilter(tag, btn));
        container.appendChild(btn);
    });
}

function setTagFilter(tag, clickedBtn) {
    document.querySelectorAll('.galeri-tag-btn').forEach(b => b.classList.remove('active'));
    clickedBtn.classList.add('active');
    const q = (document.getElementById('galeriSearchInput')?.value || '').toLowerCase();
    galeriFiltered = galeriData.filter(item => {
        const tags = item.tag ? item.tag.split(',').map(t => t.trim()) : [];
        return (tag === '' || tags.includes(tag)) && matchSearch(item, q);
    });
    renderGaleriGrid(galeriFiltered);
}

function filterGaleri(query) {
    const q = query.toLowerCase();
    const activeTag = document.querySelector('.galeri-tag-btn.active')?.dataset.tag || '';
    galeriFiltered = galeriData.filter(item => {
        const tags = item.tag ? item.tag.split(',').map(t => t.trim()) : [];
        return (activeTag === '' || tags.includes(activeTag)) && matchSearch(item, q);
    });
    renderGaleriGrid(galeriFiltered);
}

function matchSearch(item, q) {
    if (!q) return true;
    return (item.judul || '').toLowerCase().includes(q) ||
           (item.keterangan || '').toLowerCase().includes(q) ||
           (item.tag || '').toLowerCase().includes(q);
}
function resetGaleriFilter() {
    // 1. Hapus active dari semua tag button (jika masih ada di DOM)
    document.querySelectorAll('.galeri-tag-btn.active').forEach(b => b.classList.remove('active'));

    // 2. Kosongkan search input
    const searchInput = document.getElementById('galeriSearchInput');
    if (searchInput) searchInput.value = '';

    // 3. Reset filtered data ke semua data
    galeriFiltered = [...galeriData];

    // 4. Re-render grid
    renderGaleriGrid(galeriFiltered);
}

// â”€â”€ Lightbox â”€â”€
function openLightbox(idx) {
    lightboxIndex = idx;
    const item = galeriFiltered[idx];
    if (!item) return;

    const lb     = document.getElementById('galeriLightbox');
    const lbImg  = document.getElementById('lightboxImg');
    const lbDel  = document.getElementById('lightboxDelete');

    lbImg.style.opacity = '0';
    lb.classList.add('open');

    document.getElementById('lightboxJudul').textContent     = item.judul;
    document.getElementById('lightboxKeterangan').textContent = item.keterangan || '';
    document.getElementById('lightboxTimestamp').textContent  = item.timestamp ? formatDateTime(item.timestamp) : '';
    document.getElementById('lightboxTags').innerHTML = (item.tag || '')
        .split(',').filter(t => t.trim())
        .map(t => `<span>${escapeHtml(t.trim())}</span>`).join('');

    lbDel.dataset.id = item.id;

    // nav arrows
    document.getElementById('lightboxPrev').style.opacity = idx > 0 ? '1' : '0.3';
    document.getElementById('lightboxNext').style.opacity = idx < galeriFiltered.length - 1 ? '1' : '0.3';

    // Load image straight from R2 via worker
    lbImg.onload  = () => { lbImg.style.opacity = '1'; };
    lbImg.onerror = () => { lbImg.style.opacity = '1'; };
    lbImg.src = galeriImgUrl(item.r2_key);

    applyAdminVisibility();
    if (isLoggedIn) lbDel.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('galeriLightbox').classList.remove('open');
    document.getElementById('lightboxImg').src = '';
    document.body.style.overflow = '';
}

function navigateLightbox(dir) {
    const next = lightboxIndex + dir;
    if (next >= 0 && next < galeriFiltered.length) openLightbox(next);
}

// â”€â”€ Upload modal â”€â”€
function openGaleriUploadModal() {
    document.getElementById('galeriUploadForm').reset();
    document.getElementById('galeriUploadMsg').style.display = 'none';
    document.getElementById('galeriPreviewBox').style.display = 'none';
    document.getElementById('galeriFileInfo').textContent = '';
    document.getElementById('galeriUploadModal').classList.add('show');
}

function closeGaleriUploadModal() {
    document.getElementById('galeriUploadModal').classList.remove('show');
}

function previewGaleriFile(file) {
    if (!file) return;
    document.getElementById('galeriFileInfo').textContent =
        file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('galeriPreviewImg').src = e.target.result;
        document.getElementById('galeriPreviewBox').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// â”€â”€ Upload â†’ kirim multipart/form-data ke worker â†’ R2 â”€â”€
async function handleGaleriUpload(e) {
    e.preventDefault();
    const btn       = document.getElementById('btnGaleriSubmit');
    const btnText   = document.getElementById('galeriSubmitText');
    const btnLoader = document.getElementById('galeriSubmitLoading');
    const msgBox    = document.getElementById('galeriUploadMsg');

    const judul      = document.getElementById('galeriJudul').value.trim();
    const tag        = document.getElementById('galeriTag').value.trim();
    const keterangan = document.getElementById('galeriKeterangan').value.trim();
    const fileInput  = document.getElementById('galeriFotoInput');
    const file       = fileInput.files[0];

    if (!judul) {
        msgBox.textContent = 'Judul wajib diisi!';
        msgBox.className = 'message-box error';
        msgBox.style.display = 'block';
        return;
    }
    if (!file) {
        msgBox.textContent = 'Pilih foto terlebih dahulu!';
        msgBox.className = 'message-box error';
        msgBox.style.display = 'block';
        return;
    }
    if (file.size > 8 * 1024 * 1024) {
        msgBox.textContent = 'Ukuran foto maksimal 8MB!';
        msgBox.className = 'message-box error';
        msgBox.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    msgBox.style.display = 'none';

    try {
        // Kirim sebagai multipart/form-data â€” worker simpan file binary ke R2
        const fd = new FormData();
        fd.append('judul',      judul);
        fd.append('tag',        tag);
        fd.append('keterangan', keterangan);
        fd.append('foto',       file, file.name);   // kirim File langsung, bukan base64

        const res = await fetch(BASE_API_URL + '/api/galeri', {
            method: 'POST',
            body: fd
            // jangan set Content-Type â€” browser set boundary otomatis
        });
        const result = await res.json();

        if (result.status === 'success') {
            closeGaleriUploadModal();
            showToast('Foto berhasil diunggah!');
            fetchGaleriData();
        } else {
            throw new Error(result.message || 'Gagal upload');
        }
    } catch (err) {
        msgBox.textContent = err.message;
        msgBox.className = 'message-box error';
        msgBox.style.display = 'block';
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

async function deleteGaleriFoto(id) {
    try {
        const res = await fetch(BASE_API_URL + '/api/galeri?id=' + id, { method: 'DELETE' });
        const result = await res.json();
        if (result.status === 'success') {
            closeLightbox();
            showToast('Foto berhasil dihapus!');
            fetchGaleriData();
        } else {
            alert('Gagal menghapus: ' + (result.message || 'Unknown error'));
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// Pulihkan metadata D1 dari file yang masih ada di R2
// Dipanggil jika tabel galeri di D1 tidak sengaja terhapus
async function syncGaleriFromR2() {
    if (!isLoggedIn) return;
    if (!confirm('Fitur ini akan membaca semua file di R2 bucket dan mendaftarkan ulang yang belum ada di database.\n\nMetadata (judul, tag, keterangan) tidak bisa dipulihkan otomatis — akan diisi dengan nama file.\n\nLanjutkan?')) return;

    showToast('Membaca bucket R2...');
    try {
        const res = await fetch(BASE_API_URL + '/api/galeri/r2list');
        const result = await res.json();
        if (result.status !== 'success') throw new Error(result.message);

        const objects = result.objects || [];
        if (objects.length === 0) {
            showToast('Bucket R2 kosong, tidak ada yang perlu dipulihkan.');
            return;
        }

        // Ambil daftar r2_key yang sudah ada di D1
        const galeriRes = await fetch(BASE_API_URL + '/api/galeri');
        const galeriResult = await galeriRes.json();
        const existingKeys = new Set((galeriResult.data || []).map(g => g.r2_key));

        // Upload hanya yang belum ada di D1
        const toRestore = objects.filter(o => !existingKeys.has(o.key));
        if (toRestore.length === 0) {
            showToast('Semua foto sudah terdaftar di database.');
            fetchGaleriData();
            return;
        }

        showToast(`Memulihkan ${toRestore.length} foto...`);

        // Untuk setiap object R2 yang belum ada di D1, daftarkan via upload metadata
        let restored = 0;
        for (const obj of toRestore) {
            const fileName = obj.key.split('/').pop();
            const ext = fileName.split('.').pop().toLowerCase();
            const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

            // Kirim POST dengan r2_key yang sudah ada (bukan upload file baru)
            const patchRes = await fetch(BASE_API_URL + '/api/galeri/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    r2_key: obj.key,
                    judul: fileName.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
                    keterangan: '',
                    tag: '',
                    foto_nama: fileName,
                    content_type: contentType
                })
            });
            const patchResult = await patchRes.json();
            if (patchResult.status === 'success') restored++;
        }

        showToast(`Berhasil memulihkan ${restored} dari ${toRestore.length} foto!`);
        fetchGaleriData();
    } catch (err) {
        alert('Gagal pulihkan dari R2: ' + err.message);
    }
}

// Run Init
init();

