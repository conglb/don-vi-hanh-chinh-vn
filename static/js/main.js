// DOM Elements
const selectTinh = document.getElementById('selectTinh');
const selectXa = document.getElementById('selectXa');
const btnSearch = document.getElementById('btnSearch');
const btnReset = document.getElementById('btnReset');
const loadingTinh = document.getElementById('loadingTinh');
const loadingXa = document.getElementById('loadingXa');
const resultContainer = document.getElementById('resultContainer');
const resultContent = document.getElementById('resultContent');

// State
let tinhData = [];
let xaData = [];
let selectedTinh = null;
let selectedXa = null;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadTinhData();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    selectTinh.addEventListener('change', handleTinhChange);
    selectXa.addEventListener('change', handleXaChange);
    btnSearch.addEventListener('click', handleSearch);
    btnReset.addEventListener('click', handleReset);
}

// Load Province Data
async function loadTinhData() {
    try {
        showLoading(loadingTinh, true);
        selectTinh.disabled = true;

        const response = await fetch('/api/dvhc/tinh');
        const result = await response.json();

        if (result.success) {
            tinhData = result.data;
            populateTinhSelect(tinhData);
        } else {
            showError('Không thể tải dữ liệu tỉnh/thành phố: ' + result.message);
        }
    } catch (error) {
        showError('Lỗi kết nối: ' + error.message);
    } finally {
        showLoading(loadingTinh, false);
        selectTinh.disabled = false;
    }
}

// Populate Province Select
function populateTinhSelect(data) {
    selectTinh.innerHTML = '<option value="">-- Chọn Tỉnh/Thành phố --</option>';
    
    // Sort by name
    const sortedData = data.sort((a, b) => {
        const nameA = a.ten_tinh || a.name || '';
        const nameB = b.ten_tinh || b.name || '';
        return nameA.localeCompare(nameB, 'vi');
    });

    sortedData.forEach(tinh => {
        const option = document.createElement('option');
        option.value = tinh.id || tinh.tinh_id;
        option.textContent = tinh.ten_tinh || tinh.name || 'N/A';
        selectTinh.appendChild(option);
    });
}

// Handle Province Change
async function handleTinhChange(e) {
    const tinhId = e.target.value;
    
    // Reset xa select
    selectXa.innerHTML = '<option value="">-- Vui lòng chọn Tỉnh/Thành phố trước --</option>';
    selectXa.disabled = true;
    btnSearch.disabled = true;
    selectedTinh = null;
    selectedXa = null;
    hideResult();

    if (!tinhId) {
        return;
    }

    // Find selected province
    selectedTinh = tinhData.find(t => (t.id || t.tinh_id) == tinhId);

    // Load xa data
    await loadXaData(tinhId);
}

// Load Commune Data
async function loadXaData(tinhId) {
    try {
        showLoading(loadingXa, true);
        selectXa.disabled = true;

        const response = await fetch(`/api/dvhc/xa/${tinhId}`);
        const result = await response.json();

        if (result.success) {
            xaData = result.data;
            populateXaSelect(xaData);
        } else {
            showError('Không thể tải dữ liệu xã/phường: ' + result.message);
            selectXa.innerHTML = '<option value="">-- Không có dữ liệu --</option>';
        }
    } catch (error) {
        showError('Lỗi kết nối: ' + error.message);
        selectXa.innerHTML = '<option value="">-- Lỗi tải dữ liệu --</option>';
    } finally {
        showLoading(loadingXa, false);
        selectXa.disabled = false;
    }
}

// Populate Commune Select
function populateXaSelect(data) {
    selectXa.innerHTML = '<option value="">-- Chọn Xã/Phường/Thị trấn --</option>';
    
    if (data.length === 0) {
        selectXa.innerHTML = '<option value="">-- Không có dữ liệu --</option>';
        return;
    }

    // Sort by name
    const sortedData = data.sort((a, b) => {
        const nameA = a.ten_xa || a.name || '';
        const nameB = b.ten_xa || b.name || '';
        return nameA.localeCompare(nameB, 'vi');
    });

    sortedData.forEach(xa => {
        const option = document.createElement('option');
        option.value = xa.id || xa.xa_id;
        option.textContent = xa.ten_xa || xa.name || 'N/A';
        selectXa.appendChild(option);
    });

    selectXa.disabled = false;
}

// Handle Commune Change
function handleXaChange(e) {
    const xaId = e.target.value;
    
    if (!xaId) {
        btnSearch.disabled = true;
        selectedXa = null;
        return;
    }

    selectedXa = xaData.find(x => (x.id || x.xa_id) == xaId);
    btnSearch.disabled = false;
}

// Handle Search
function handleSearch() {
    if (!selectedTinh || !selectedXa) {
        showError('Vui lòng chọn đầy đủ thông tin!');
        return;
    }

    displayResult();
}

// Display Result
function displayResult() {
    const tinhName = selectedTinh.ten_tinh || selectedTinh.name || 'N/A';
    const xaName = selectedXa.ten_xa || selectedXa.name || 'N/A';
    const mabuuchinh = selectedXa.mabuuchinh || selectedXa.zip_code || 'Chưa cập nhật';
    const huyenName = selectedXa.ten_huyen || selectedXa.district || 'N/A';

    const resultHTML = `
        <div class="result-item">
            <strong>🏙️ Tỉnh/Thành phố:</strong> ${tinhName}
        </div>
        ${huyenName !== 'N/A' ? `
        <div class="result-item">
            <strong>🏘️ Quận/Huyện:</strong> ${huyenName}
        </div>
        ` : ''}
        <div class="result-item">
            <strong>📍 Xã/Phường/Thị trấn:</strong> ${xaName}
        </div>
        <div class="result-item" style="background: #e8f5e9; border-left-color: #4caf50;">
            <strong style="color: #2e7d32;">📮 Mã Bưu Chính:</strong> 
            <span style="font-size: 1.3em; color: #2e7d32; font-weight: bold;">${mabuuchinh}</span>
        </div>
        <div class="result-item">
            <strong>   Vị trí địa lý:</strong>  ${xaName.area || 'Chưa cập nhật'} <br>
            <strong>   Diện tích:</strong> ${xaName.area || 'Chưa cập nhật'} km² <br>
            <strong>   Dân số:</strong> ${xaName.population || 'Chưa cập nhật'} người
        </div>
    `;

    resultContent.innerHTML = resultHTML;
    resultContainer.style.display = 'block';
    
    // Smooth scroll to result
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Handle Reset
function handleReset() {
    selectTinh.value = '';
    selectXa.innerHTML = '<option value="">-- Vui lòng chọn Tỉnh/Thành phố trước --</option>';
    selectXa.disabled = true;
    btnSearch.disabled = true;
    
    selectedTinh = null;
    selectedXa = null;
    xaData = [];
    
    hideResult();
}

// Utility Functions
function showLoading(element, show) {
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

function hideResult() {
    resultContainer.style.display = 'none';
    resultContent.innerHTML = '';
}

function showError(message) {
    alert('⚠️ ' + message);
}

// Export for debugging (optional)
window.dvhcApp = {
    tinhData,
    xaData,
    selectedTinh,
    selectedXa
};
