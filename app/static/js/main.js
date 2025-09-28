document.addEventListener('DOMContentLoaded', function () {
    AOS.init();
    feather.replace();

    const uploadBtn = document.getElementById('uploadBtn');
    const excelFileInput = document.getElementById('excelFile');
    const columnSelect = document.getElementById('columnSelect');
    const generateBtn = document.getElementById('generateBtn');
    const qrResults = document.getElementById('qrResults');
    const qrGrid = document.getElementById('qrGrid');
    const sizeRange = document.getElementById('sizeRange');
    const errorCorrection = document.getElementById('errorCorrection');
    const exportAllBtn = document.getElementById('exportAllBtn');
    const checkUsageBtn = document.getElementById('checkUsageBtn');

    let excelData = [];
    let qrCodes = [];
    let usedQRCodes = new Set();
    let qrValues = [];
    let currentQRIndex = 0;

    // Hide unused bulk action buttons for single-QR flow
    exportAllBtn.classList.add('hidden');
    checkUsageBtn.classList.add('hidden');

    // Mock function to simulate checking if QR code has been used
    function checkIfQRUsed(code) {
        // In a real app, this would be an API call to your backend
        return usedQRCodes.has(code);
    }

    // Handle file upload
    uploadBtn.addEventListener('click', () => excelFileInput.click());

    excelFileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            excelData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});

            // Populate column select
            columnSelect.innerHTML = '';
            if (excelData.length > 0) {
                excelData[0].forEach((header, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = header || `Column ${index + 1}`;
                    columnSelect.appendChild(option);
                });
                columnSelect.disabled = false;
                generateBtn.disabled = false;
            }
        };
        reader.readAsArrayBuffer(file);
    });

    function updateQRStats() {
        const totalSpan = document.getElementById('totalQRCodes');
        const usedSpan = document.getElementById('usedQRCodes');
        totalSpan.textContent = qrValues.length.toString();
        usedSpan.textContent = usedQRCodes.size.toString();
    }

    function renderCurrentQR() {
        qrGrid.innerHTML = '';

        // If all used or no values
        if (!qrValues.length || usedQRCodes.size >= qrValues.length) {
            const doneDiv = document.createElement('div');
            doneDiv.className = 'bg-white p-6 rounded-lg shadow-md text-center';
            doneDiv.innerHTML = '<p class="text-gray-700">Tất cả QR code đã được sử dụng.</p>';
            qrGrid.appendChild(doneDiv);
            updateQRStats();
            return;
        }

        // Ensure we are on an unused QR index
        let safety = 0;
        while (usedQRCodes.has(qrValues[currentQRIndex]) && safety < qrValues.length) {
            currentQRIndex = (currentQRIndex + 1) % qrValues.length;
            safety++;
        }

        const value = qrValues[currentQRIndex];

        const qr = qrcode(0, errorCorrection.value);
        qr.addData(value.toString());
        qr.make();

        const size = 150;
        const qrSvg = qr.createSvgTag({
            cellSize: size / qr.getModuleCount(),
            margin: 0,
            scalable: true
        });

        const qrWrapper = document.createElement('div');
        qrWrapper.className = 'qr-container bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center';
        qrWrapper.innerHTML = `
                    <div class="qr-code mb-3" style="width:${size}px;height:${size}px">${qrSvg}</div>
                    <p class="text-sm font-medium text-gray-700 mb-2 text-center">${value}</p>
                    <span class="inline-block px-2 py-1 text-xs rounded-full ${usedQRCodes.has(value) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} mb-4">${usedQRCodes.has(value) ? 'Used' : 'Unused'}</span>
                    <button id="markUsedBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium">Đánh dấu đã sử dụng & tiếp theo</button>
                `;
        qrGrid.appendChild(qrWrapper);

        const markBtn = document.getElementById('markUsedBtn');
        markBtn.addEventListener('click', function () {
            usedQRCodes.add(value);
            currentQRIndex = (currentQRIndex + 1) % qrValues.length;
            updateQRStats();
            renderCurrentQR();
        });

        updateQRStats();
        feather.replace();
    }

    // Generate a single centered QR code (150x150)
    generateBtn.addEventListener('click', function () {
        const columnIndex = columnSelect.value;
        if (columnIndex === '' || !excelData.length) return;

        qrGrid.innerHTML = '';
        qrCodes = [];
        usedQRCodes = new Set();
        qrValues = [];
        currentQRIndex = 0;

        // Skip header row if exists
        const startRow = excelData.length > 1 && excelData[0].some(cell => typeof cell === 'string') ? 1 : 0;

        // Collect all non-empty values in the selected column
        for (let i = startRow; i < excelData.length; i++) {
            const row = excelData[i];
            const value = row[columnIndex];
            if (value !== undefined && value !== null && value !== '') {
                qrValues.push(value);
            }
        }

        if (!qrValues.length) return;

        qrResults.classList.remove('hidden');
        renderCurrentQR();
    });

    // Check usage for all QR codes
    checkUsageBtn.addEventListener('click', function () {
        const checkButtons = document.querySelectorAll('.check-btn');
        checkButtons.forEach(btn => btn.click());
    });

    // Export all QR codes as ZIP (simplified for demo)
    exportAllBtn.addEventListener('click', function () {
        alert('In a real application, this would download all QR codes as a ZIP file.');
    });

    // Event delegation for dynamic buttons
    qrGrid.addEventListener('click', function (e) {
        const target = e.target.closest('.download-btn');
        if (target) {
            const index = target.getAttribute('data-index');
            const qr = qrCodes[index];

            // Create download link
            const blob = new Blob([qr.svg], {type: 'image/svg+xml'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `qr_${qr.value}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        const checkTarget = e.target.closest('.check-btn');
        if (checkTarget) {
            const index = checkTarget.getAttribute('data-index');
            const qrCard = checkTarget.closest('.qr-container');
            const qr = qrCodes[index];

            // Simulate API call with loading state
            checkTarget.innerHTML = '<i data-feather="loader" class="w-4 h-4 animate-spin"></i>';
            feather.replace();

            setTimeout(() => {
                const isUsed = checkIfQRUsed(qr.value);
                qr.used = isUsed;

                // Update UI
                if (isUsed) {
                    qrCard.classList.add('used');
                    qrCard.querySelector('span').className = 'inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-800';
                    qrCard.querySelector('span').textContent = 'Used';
                } else {
                    qrCard.classList.remove('used');
                    qrCard.querySelector('span').className = 'inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800';
                    qrCard.querySelector('span').textContent = 'Unused';
                }

                checkTarget.innerHTML = '<i data-feather="refresh-cw" class="w-4 h-4"></i>';
                updateQRStats();
                feather.replace();
            }, 800);
        }
    });

    // Remove demo auto-used behavior in single-QR flow
});