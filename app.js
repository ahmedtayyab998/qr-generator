document.addEventListener("DOMContentLoaded", () => {
    // === APP STATE ===
    const state = {
        activeTab: "generate",
        generateType: "url",
        scanMode: "camera",
        history: [],
        cameraScanner: null,
        isCameraRunning: false,
        imgbbApiKey: "",
        uploadedImageUrl: ""
    };

    // === DOM ELEMENTS ===
    // Navigation & Tabs
    const tabBtns = document.querySelectorAll(".tab-navigation .tab-btn");
    const tabSections = document.querySelectorAll(".tab-section");

    // Generator inputs & pickers
    const typeBtns = document.querySelectorAll(".type-selector .type-btn");
    const inputGroups = document.querySelectorAll(".input-container .input-group");
    const fgColorInput = document.getElementById("qr-fg-color");
    const bgColorInput = document.getElementById("qr-bg-color");
    const fgValSpan = document.getElementById("fg-val");
    const bgValSpan = document.getElementById("bg-val");
    const qrSizeInput = document.getElementById("qr-size");
    const sizeValSpan = document.getElementById("size-val");
    const qrMarginInput = document.getElementById("qr-margin");
    const marginValSpan = document.getElementById("margin-val");
    const canvas = document.getElementById("qrcode-canvas");
    const previewOverlay = document.getElementById("preview-overlay");

    // Action Buttons (Generate)
    const btnDownloadPng = document.getElementById("btn-download-png");
    const btnCopy = document.getElementById("btn-copy");

    // Generator Image Elements
    const imgbbApiKeyInput = document.getElementById("imgbb-api-key");
    const dropZoneGen = document.getElementById("drop-zone-gen");
    const genImageInput = document.getElementById("gen-image-input");
    const filePreviewContainerGen = document.getElementById("file-preview-container-gen");
    const genImagePreview = document.getElementById("gen-image-preview");
    const btnRemoveGenFile = document.getElementById("btn-remove-gen-file");
    const imageUploadStatus = document.getElementById("image-upload-status");
    const imageProgressBar = document.getElementById("image-progress-bar");
    const imageStatusText = document.getElementById("image-status-text");
    const imageUrlResult = document.getElementById("image-url-result");
    const uploadedImageUrlInput = document.getElementById("uploaded-image-url");
    const btnCopyImageUrl = document.getElementById("btn-copy-image-url");

    // Scanner Elements
    const scanTypeBtns = document.querySelectorAll(".scan-type-btn");
    const scannerContainers = document.querySelectorAll(".scanner-container");
    const cameraSelect = document.getElementById("camera-select");
    const btnToggleCamera = document.getElementById("btn-toggle-camera");
    const scannerLaser = document.getElementById("scanner-laser");
    const dropZone = document.getElementById("drop-zone");
    const qrFileInput = document.getElementById("qr-file-input");
    const filePreviewContainer = document.getElementById("file-preview-container");
    const scannedImagePreview = document.getElementById("scanned-image-preview");
    const btnRemoveFile = document.getElementById("btn-remove-file");

    // Scan Results Elements
    const resultPlaceholder = document.getElementById("result-placeholder");
    const resultContent = document.getElementById("result-content");
    const resultText = document.getElementById("result-text");
    const resultBadge = document.getElementById("result-badge");
    const resultTime = document.getElementById("result-time");
    const btnCopyResult = document.getElementById("btn-copy-result");
    const btnVisitLink = document.getElementById("btn-visit-link");

    // History Elements
    const historyList = document.getElementById("history-list");
    const historyEmpty = document.getElementById("history-empty");
    const btnClearHistory = document.getElementById("btn-clear-history");

    // Toast Notification
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");

    // === INIT APP ===
    loadHistoryFromStorage();
    loadApiKey();
    initEventListeners();
    generateQR(); // Generate initial default QR Code

    // === EVENT LISTENERS ===
    function initEventListeners() {
        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const tabName = btn.getAttribute("data-tab");
                switchTab(tabName);
            });
        });

        // Content type switching (Generate)
        typeBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const type = btn.getAttribute("data-type");
                switchGenerateType(type);
            });
        });

        // Live generation inputs
        const inputsToTriggerGen = [
            "url-val", "text-val", "wifi-ssid", "wifi-pass", "wifi-enc",
            "email-to", "email-subject", "email-body", "phone-val",
            "sms-phone", "sms-msg"
        ];
        inputsToTriggerGen.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("input", debounce(generateQR, 300));
                el.addEventListener("change", generateQR);
            }
        });

        // Color and Slider inputs
        fgColorInput.addEventListener("input", (e) => {
            fgValSpan.textContent = e.target.value.toUpperCase();
            generateQR();
        });
        bgColorInput.addEventListener("input", (e) => {
            bgValSpan.textContent = e.target.value.toUpperCase();
            generateQR();
        });
        qrSizeInput.addEventListener("input", (e) => {
            sizeValSpan.textContent = `${e.target.value}px`;
            generateQR();
        });
        qrMarginInput.addEventListener("input", (e) => {
            marginValSpan.textContent = `${e.target.value} block${e.target.value !== '1' ? 's' : ''}`;
            generateQR();
        });

        // Action buttons
        btnDownloadPng.addEventListener("click", downloadPNG);
        btnCopy.addEventListener("click", copyQRImage);

        // Scanner Modes switching
        scanTypeBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const mode = btn.getAttribute("data-scan-mode");
                switchScanMode(mode);
            });
        });

        // Camera controls
        btnToggleCamera.addEventListener("click", toggleCamera);

        // File Drag & Drop
        dropZone.addEventListener("click", () => qrFileInput.click());
        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.classList.add("dragover");
        });
        dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("dragover");
        });
        dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropZone.classList.remove("dragover");
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleQRFile(files[0]);
            }
        });
        qrFileInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                handleQRFile(e.target.files[0]);
            }
        });
        btnRemoveFile.addEventListener("click", (e) => {
            e.stopPropagation();
            resetFileSelector();
        });

        // Copy scan result content
        btnCopyResult.addEventListener("click", () => {
            if (resultText.value) {
                copyTextToClipboard(resultText.value, "Content copied to clipboard!");
            }
        });

        // Clear all history
        btnClearHistory.addEventListener("click", clearAllHistory);

        // Image Generator Listeners
        if (imgbbApiKeyInput) {
            imgbbApiKeyInput.addEventListener("input", (e) => {
                state.imgbbApiKey = e.target.value.trim();
                localStorage.setItem("imgbb_api_key", state.imgbbApiKey);
            });
        }
        if (dropZoneGen) {
            dropZoneGen.addEventListener("click", () => genImageInput.click());
            dropZoneGen.addEventListener("dragover", (e) => {
                e.preventDefault();
                dropZoneGen.classList.add("dragover");
            });
            dropZoneGen.addEventListener("dragleave", () => {
                dropZoneGen.classList.remove("dragover");
            });
            dropZoneGen.addEventListener("drop", (e) => {
                e.preventDefault();
                dropZoneGen.classList.remove("dragover");
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleGenImageFile(files[0]);
                }
            });
        }
        if (genImageInput) {
            genImageInput.addEventListener("change", (e) => {
                if (e.target.files.length > 0) {
                    handleGenImageFile(e.target.files[0]);
                }
            });
        }
        if (btnRemoveGenFile) {
            btnRemoveGenFile.addEventListener("click", (e) => {
                e.stopPropagation();
                resetGenFileSelector();
            });
        }
        if (btnCopyImageUrl) {
            btnCopyImageUrl.addEventListener("click", () => {
                if (uploadedImageUrlInput.value) {
                    copyTextToClipboard(uploadedImageUrlInput.value, "Image URL copied to clipboard!");
                }
            });
        }
    }

    // === TABS & ROUTING ===
    function switchTab(tabName) {
        state.activeTab = tabName;

        // Toggle active tab button
        tabBtns.forEach(btn => {
            if (btn.getAttribute("data-tab") === tabName) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Toggle active sections
        tabSections.forEach(section => {
            if (section.id === `${tabName}-section`) {
                section.classList.add("active");
            } else {
                section.classList.remove("active");
            }
        });

        // Stop camera if navigating away from scan tab
        if (tabName !== "scan" && state.isCameraRunning) {
            stopCamera();
        }

        // Render history if opening history tab
        if (tabName === "history") {
            renderHistory();
        }
    }

    function switchGenerateType(type) {
        state.generateType = type;

        // Toggle type button states
        typeBtns.forEach(btn => {
            if (btn.getAttribute("data-type") === type) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Toggle form groups
        inputGroups.forEach(group => {
            if (group.id === `input-${type}`) {
                group.classList.add("active");
            } else {
                group.classList.remove("active");
            }
        });

        // Regenerate QR
        generateQR();
    }

    function switchScanMode(mode) {
        state.scanMode = mode;

        // Stop camera if switching to file upload
        if (mode !== "camera" && state.isCameraRunning) {
            stopCamera();
        }

        scanTypeBtns.forEach(btn => {
            if (btn.getAttribute("data-scan-mode") === mode) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        scannerContainers.forEach(container => {
            if (container.id === `${mode}-scanner-container`) {
                container.classList.add("active");
            } else {
                container.classList.remove("active");
            }
        });

        if (mode === "camera" && !state.isCameraRunning) {
            initCameraSelect();
        }
    }

    // === QR CODE GENERATOR ===
    function generateQR() {
        showPreviewLoading(true);

        const qrText = getQRTextContent();
        const size = parseInt(qrSizeInput.value) || 256;
        const margin = parseInt(qrMarginInput.value) || 2;
        const fgColor = fgColorInput.value;
        const bgColor = bgColorInput.value;

        if (!qrText) {
            // Draw an empty or default QR pattern when input is empty
            drawEmptyCanvas();
            showPreviewLoading(false);
            return;
        }

        // Generate the code using node-qrcode
        QRCode.toCanvas(canvas, qrText, {
            width: size,
            margin: margin,
            color: {
                dark: fgColor,
                light: bgColor
            },
            errorCorrectionLevel: 'H' // High recovery capacity
        }, (error) => {
            showPreviewLoading(false);
            if (error) {
                console.error("QR Code Generation Error:", error);
                return;
            }
            
            // Add a history item only if it's new and has content
            debounceHistoryAdd("generate", state.generateType, qrText);
        });
    }

    function getQRTextContent() {
        switch (state.generateType) {
            case "url":
                return document.getElementById("url-val").value.trim();
            case "text":
                return document.getElementById("text-val").value.trim();
            case "wifi":
                const ssid = document.getElementById("wifi-ssid").value.trim();
                const pass = document.getElementById("wifi-pass").value.trim();
                const enc = document.getElementById("wifi-enc").value;
                if (!ssid) return "";
                // Format: WIFI:S:SSID;T:WPA;P:PASSWORD;;
                return `WIFI:S:${ssid};T:${enc};P:${pass};;`;
            case "email":
                const to = document.getElementById("email-to").value.trim();
                const subject = document.getElementById("email-subject").value.trim();
                const body = document.getElementById("email-body").value.trim();
                if (!to) return "";
                return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            case "phone":
                const phone = document.getElementById("phone-val").value.trim();
                if (!phone) return "";
                return `tel:${phone}`;
            case "sms":
                const smsPhone = document.getElementById("sms-phone").value.trim();
                const smsMsg = document.getElementById("sms-msg").value.trim();
                if (!smsPhone) return "";
                return `SMSTO:${smsPhone}:${smsMsg}`;
            case "image":
                return state.uploadedImageUrl;
            default:
                return "";
        }
    }

    function drawEmptyCanvas() {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Set dimensions to default size
        canvas.width = parseInt(qrSizeInput.value) || 256;
        canvas.height = canvas.width;
        ctx.fillStyle = bgColorInput.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = fgColorInput.value;
        ctx.font = "14px Outfit";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Enter content to generate", canvas.width / 2, canvas.height / 2);
    }

    function showPreviewLoading(show) {
        previewOverlay.style.display = show ? "flex" : "none";
    }

    // Download PNG file
    function downloadPNG() {
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `qrglow-${state.generateType}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("QR Code downloaded successfully!");
    }

    // Copy QR Image to Clipboard
    async function copyQRImage() {
        try {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    showToast("Could not prepare QR image blob.");
                    return;
                }
                const data = [new ClipboardItem({ "image/png": blob })];
                await navigator.clipboard.write(data);
                showToast("QR Code image copied to clipboard!");
            });
        } catch (err) {
            console.error("Clipboard write error:", err);
            // Fallback for browsers that do not support ClipboardItem for image
            showToast("Failed to copy image directly. Please download instead.");
        }
    }

    // === QR CODE SCANNER (CAMERA) ===
    async function initCameraSelect() {
        cameraSelect.innerHTML = '<option value="">Requesting cameras...</option>';
        try {
            const devices = await Html5Qrcode.getCameras();
            cameraSelect.innerHTML = "";
            if (devices && devices.length > 0) {
                devices.forEach(device => {
                    const opt = document.createElement("option");
                    opt.value = device.id;
                    opt.textContent = device.label || `Camera ${cameraSelect.children.length + 1}`;
                    cameraSelect.appendChild(opt);
                });
                btnToggleCamera.classList.remove("disabled");
            } else {
                cameraSelect.innerHTML = '<option value="">No cameras detected</option>';
                btnToggleCamera.classList.add("disabled");
            }
        } catch (err) {
            console.error("Camera device access denied:", err);
            cameraSelect.innerHTML = '<option value="">Access denied</option>';
            btnToggleCamera.classList.add("disabled");
            showToast("Camera permissions are required to scan.");
        }
    }

    function toggleCamera() {
        if (state.isCameraRunning) {
            stopCamera();
        } else {
            startCamera();
        }
    }

    async function startCamera() {
        const cameraId = cameraSelect.value;
        if (!cameraId) {
            showToast("Please select a camera first.");
            return;
        }

        // Initialize scanner if not already done
        if (!state.cameraScanner) {
            state.cameraScanner = new Html5Qrcode("interactive-reader");
        }

        btnToggleCamera.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Starting...';
        btnToggleCamera.disabled = true;

        try {
            await state.cameraScanner.start(
                cameraId,
                {
                    fps: 15,
                    qrbox: (width, height) => {
                        const minDim = Math.min(width, height);
                        const scanBoxSize = Math.floor(minDim * 0.65);
                        return { width: scanBoxSize, height: scanBoxSize };
                    }
                },
                (decodedText) => {
                    handleScanSuccess(decodedText);
                    // Play a soft beep if scanner success
                    playBeepSound();
                },
                (errorMessage) => {
                    // Scanning loop throws errors when no QR is in sight - ignore them.
                }
            );

            state.isCameraRunning = true;
            btnToggleCamera.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Camera';
            btnToggleCamera.disabled = false;
            btnToggleCamera.classList.remove("btn-primary");
            btnToggleCamera.classList.add("btn-danger");
            scannerLaser.style.display = "block";
            showToast("Camera feed active.");
        } catch (err) {
            console.error("Camera start failure:", err);
            btnToggleCamera.innerHTML = '<i class="fa-solid fa-play"></i> Start Camera';
            btnToggleCamera.disabled = false;
            scannerLaser.style.display = "none";
            showToast("Failed to start camera. Try another device.");
        }
    }

    async function stopCamera() {
        if (!state.cameraScanner || !state.isCameraRunning) return;

        try {
            await state.cameraScanner.stop();
            state.isCameraRunning = false;
            btnToggleCamera.innerHTML = '<i class="fa-solid fa-play"></i> Start Camera';
            btnToggleCamera.classList.remove("btn-danger");
            btnToggleCamera.classList.add("btn-primary");
            scannerLaser.style.display = "none";
            showToast("Camera scanner stopped.");
        } catch (err) {
            console.error("Camera stop error:", err);
        }
    }

    // === QR CODE SCANNER (FILE) ===
    function handleQRFile(file) {
        if (!file.type.startsWith("image/")) {
            showToast("Please upload an image file.");
            return;
        }

        // Show image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            scannedImagePreview.src = e.target.result;
            filePreviewContainer.style.display = "flex";
        };
        reader.readAsDataURL(file);

        // Decode QR from file
        const fileScanner = new Html5Qrcode("interactive-reader");
        fileScanner.scanFile(file, true)
            .then(decodedText => {
                handleScanSuccess(decodedText);
                playBeepSound();
            })
            .catch(err => {
                console.error("File decode error:", err);
                // Clear result and show warning
                resultPlaceholder.style.display = "flex";
                resultContent.style.display = "none";
                showToast("Could not find a valid QR Code in this image.");
            });
    }

    function resetFileSelector() {
        qrFileInput.value = "";
        scannedImagePreview.src = "";
        filePreviewContainer.style.display = "none";
        resultPlaceholder.style.display = "flex";
        resultContent.style.display = "none";
    }

    // === SCAN SUCCESS HANDLER ===
    function handleScanSuccess(decodedText) {
        // Toggle view
        resultPlaceholder.style.display = "none";
        resultContent.style.display = "flex";

        resultText.value = decodedText;
        resultTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Categorize result
        const type = detectContentType(decodedText);
        resultBadge.textContent = type;
        resultBadge.className = `badge badge-${type.toLowerCase()}`;

        // Link visit setup
        if (type === "URL" || decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
            btnVisitLink.classList.remove("disabled");
            btnVisitLink.href = decodedText.startsWith("http") ? decodedText : `https://${decodedText}`;
        } else {
            btnVisitLink.classList.add("disabled");
            btnVisitLink.removeAttribute("href");
        }

        // Add to history
        addHistoryItem("scan", type.toLowerCase(), decodedText);
    }

    function detectContentType(text) {
        if (text.startsWith("http://") || text.startsWith("https://")) return "URL";
        if (text.startsWith("WIFI:")) return "Wi-Fi";
        if (text.startsWith("mailto:")) return "Email";
        if (text.startsWith("tel:")) return "Phone";
        if (text.startsWith("SMSTO:")) return "SMS";
        return "Text";
    }

    // === HISTORY MANAGEMENT ===
    let debounceHistoryTimer;
    function debounceHistoryAdd(type, contentType, content) {
        // Debounce generation history to prevent adding item on every keystroke
        clearTimeout(debounceHistoryTimer);
        debounceHistoryTimer = setTimeout(() => {
            // Check if last history item was identical
            if (state.history.length > 0) {
                const last = state.history[0];
                if (last.type === type && last.contentType === contentType && last.content === content) {
                    return; // Prevent duplicate
                }
            }
            addHistoryItem(type, contentType, content);
        }, 1500);
    }

    function addHistoryItem(type, contentType, content) {
        // Check for exact duplicate in history list to bubble it up
        state.history = state.history.filter(item => !(item.type === type && item.content === content));

        const newItem = {
            id: Date.now().toString(),
            type, // "generate" or "scan"
            contentType, // "url", "text", "wifi", etc.
            content,
            timestamp: new Date().toLocaleString()
        };

        state.history.unshift(newItem); // Add to beginning

        // Max 50 items
        if (state.history.length > 50) {
            state.history.pop();
        }

        saveHistoryToStorage();
    }

    function renderHistory() {
        if (state.history.length === 0) {
            historyEmpty.style.display = "flex";
            btnClearHistory.style.display = "none";
            historyList.innerHTML = "";
            return;
        }

        historyEmpty.style.display = "none";
        btnClearHistory.style.display = "block";
        historyList.innerHTML = "";

        state.history.forEach(item => {
            const el = document.createElement("div");
            el.className = "history-item";

            const isGen = item.type === "generate";
            const iconClass = isGen ? "fa-solid fa-wand-magic-sparkles" : "fa-solid fa-camera";
            const iconTheme = isGen ? "history-icon-gen" : "history-icon-scan";
            const actionText = isGen ? "Generated" : "Scanned";

            el.innerHTML = `
                <div class="history-icon-wrapper ${iconTheme}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="history-info">
                    <div class="history-text">${escapeHtml(getDisplayContent(item.content, item.contentType))}</div>
                    <div class="history-meta">
                        <span class="history-type-badge">${item.contentType}</span>
                        <span>•</span>
                        <span>${actionText}</span>
                        <span>•</span>
                        <span>${item.timestamp}</span>
                    </div>
                </div>
                <div class="history-btn-actions">
                    <button class="btn-icon btn-icon-view" title="View details"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn-icon btn-icon-copy" title="Copy text"><i class="fa-solid fa-copy"></i></button>
                    <button class="btn-icon btn-icon-delete" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;

            // Bind events for buttons inside history item
            el.querySelector(".btn-icon-view").addEventListener("click", () => viewHistoryItem(item));
            el.querySelector(".btn-icon-copy").addEventListener("click", () => copyTextToClipboard(item.content, "Text copied!"));
            el.querySelector(".btn-icon-delete").addEventListener("click", () => deleteHistoryItem(item.id));

            historyList.appendChild(el);
        });
    }

    function getDisplayContent(content, type) {
        if (type === "wifi") {
            // extract SSID: WIFI:S:MySSID;T:WPA;P:password;;
            const match = content.match(/S:([^;]+)/);
            return match ? `Wi-Fi: ${match[1]}` : content;
        }
        if (type === "email") {
            const match = content.match(/mailto:([^?]+)/);
            return match ? `Email to: ${match[1]}` : content;
        }
        if (type === "sms") {
            const match = content.match(/SMSTO:([^:]+)/);
            return match ? `SMS to: ${match[1]}` : content;
        }
        return content;
    }

    function viewHistoryItem(item) {
        if (item.type === "generate") {
            switchTab("generate");
            switchGenerateType(item.contentType);
            
            // Populate matching fields
            populateGeneratorFields(item.content, item.contentType);
        } else {
            switchTab("scan");
            switchScanMode("file");
            handleScanSuccess(item.content);
        }
    }

    function populateGeneratorFields(content, contentType) {
        switch (contentType) {
            case "url":
                document.getElementById("url-val").value = content;
                break;
            case "text":
                document.getElementById("text-val").value = content;
                break;
            case "wifi":
                // Format: WIFI:S:SSID;T:WPA;P:PASSWORD;;
                const ssidMatch = content.match(/S:([^;]+)/);
                const passMatch = content.match(/P:([^;]+)/);
                const encMatch = content.match(/T:([^;]+)/);
                if (ssidMatch) document.getElementById("wifi-ssid").value = ssidMatch[1];
                if (passMatch) document.getElementById("wifi-pass").value = passMatch[1];
                if (encMatch) document.getElementById("wifi-enc").value = encMatch[1];
                break;
            case "email":
                // Format: mailto:to?subject=sub&body=body
                const emailTo = content.match(/mailto:([^?]+)/);
                const subMatch = content.match(/subject=([^&]+)/);
                const bodyMatch = content.match(/body=([^&]+)/);
                if (emailTo) document.getElementById("email-to").value = decodeURIComponent(emailTo[1]);
                if (subMatch) document.getElementById("email-subject").value = decodeURIComponent(subMatch[1]);
                if (bodyMatch) document.getElementById("email-body").value = decodeURIComponent(bodyMatch[1]);
                break;
            case "phone":
                const phoneMatch = content.match(/tel:(.+)/);
                if (phoneMatch) document.getElementById("phone-val").value = phoneMatch[1];
                break;
            case "sms":
                // Format: SMSTO:phone:body
                const smsParts = content.match(/SMSTO:([^:]+):(.*)/);
                if (smsParts) {
                    document.getElementById("sms-phone").value = smsParts[1];
                    document.getElementById("sms-msg").value = smsParts[2];
                }
                break;
            case "image":
                state.uploadedImageUrl = content;
                uploadedImageUrlInput.value = content;
                imageUrlResult.style.display = "flex";
                break;
        }
        generateQR();
    }

    function deleteHistoryItem(id) {
        state.history = state.history.filter(item => item.id !== id);
        saveHistoryToStorage();
        renderHistory();
        showToast("History item deleted.");
    }

    function clearAllHistory() {
        if (confirm("Are you sure you want to clear all history? This cannot be undone.")) {
            state.history = [];
            saveHistoryToStorage();
            renderHistory();
            showToast("History cleared.");
        }
    }

    function saveHistoryToStorage() {
        localStorage.setItem("qrglow_history", JSON.stringify(state.history));
    }

    function loadHistoryFromStorage() {
        const saved = localStorage.getItem("qrglow_history");
        if (saved) {
            try {
                state.history = JSON.parse(saved);
            } catch (err) {
                console.error("Failed to parse history:", err);
                state.history = [];
            }
        }
    }

    // === UTILITY FUNCTIONS ===
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function copyTextToClipboard(text, successMsg) {
        navigator.clipboard.writeText(text)
            .then(() => showToast(successMsg || "Copied to clipboard!"))
            .catch(err => {
                console.error("Text copy failure:", err);
                showToast("Failed to copy text. Please copy manually.");
            });
    }

    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // === IMAGE GENERATOR FUNCTIONS ===
    function loadApiKey() {
        const saved = localStorage.getItem("imgbb_api_key");
        if (saved) {
            state.imgbbApiKey = saved;
            if (imgbbApiKeyInput) imgbbApiKeyInput.value = saved;
        }
    }

    function handleGenImageFile(file) {
        if (!file.type.startsWith("image/")) {
            showToast("Please select an image file.");
            return;
        }
        if (!state.imgbbApiKey) {
            showToast("Please enter your ImgBB API Key first.");
            return;
        }

        // Show image preview locally
        const reader = new FileReader();
        reader.onload = (e) => {
            if (genImagePreview) genImagePreview.src = e.target.result;
            if (filePreviewContainerGen) filePreviewContainerGen.style.display = "flex";
        };
        reader.readAsDataURL(file);

        // Upload to ImgBB
        uploadImageToImgBB(file);
    }

    function uploadImageToImgBB(file) {
        if (imageUploadStatus) imageUploadStatus.style.display = "block";
        if (imageUrlResult) imageUrlResult.style.display = "none";
        if (imageProgressBar) imageProgressBar.style.width = "0%";
        if (imageStatusText) imageStatusText.textContent = "Connecting to ImgBB...";

        const formData = new FormData();
        formData.append("image", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.imgbb.com/1/upload?key=${state.imgbbApiKey}`, true);

        // Track progress
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && imageProgressBar && imageStatusText) {
                const percent = Math.round((e.loaded / e.total) * 100);
                imageProgressBar.style.width = percent + "%";
                imageStatusText.textContent = `Uploading: ${percent}%`;
            }
        };

        // Response handlers
        xhr.onload = () => {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success && response.data && response.data.url) {
                        state.uploadedImageUrl = response.data.url;
                        if (uploadedImageUrlInput) uploadedImageUrlInput.value = response.data.url;
                        if (imageStatusText) imageStatusText.textContent = "Upload complete!";
                        if (imageProgressBar) imageProgressBar.style.width = "100%";
                        if (imageUrlResult) imageUrlResult.style.display = "flex";
                        
                        showToast("Image uploaded and hosted!");
                        generateQR(); // Regenerate QR
                    } else {
                        const errorMsg = response.error ? response.error.message : "Unknown upload error";
                        throw new Error(errorMsg);
                    }
                } catch (err) {
                    handleUploadError(err.message);
                }
            } else {
                handleUploadError(`HTTP Error ${xhr.status}`);
            }
        };

        xhr.onerror = () => {
            handleUploadError("Network connection error.");
        };

        xhr.send(formData);
    }

    function handleUploadError(msg) {
        console.error("ImgBB Upload Failure:", msg);
        if (imageStatusText) imageStatusText.textContent = `Upload failed: ${msg}`;
        if (imageProgressBar) imageProgressBar.style.width = "0%";
        showToast("Upload failed. Make sure your API key is correct.");
    }

    function resetGenFileSelector() {
        if (genImageInput) genImageInput.value = "";
        if (genImagePreview) genImagePreview.src = "";
        if (filePreviewContainerGen) filePreviewContainerGen.style.display = "none";
        if (imageUploadStatus) imageUploadStatus.style.display = "none";
        if (imageUrlResult) imageUrlResult.style.display = "none";
        state.uploadedImageUrl = "";
        if (uploadedImageUrlInput) uploadedImageUrlInput.value = "";
        showToast("Image upload reset.");
        generateQR();
    }

    // Soft beep audio indicator using Web Audio API
    function playBeepSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = "sine";
            oscillator.frequency.value = 880; // High frequency beep
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // Low volume
            
            oscillator.start();
            // Beep duration: 100ms
            oscillator.stop(audioCtx.currentTime + 0.1); 
        } catch (e) {
            // Audio Context not allowed or unsupported
        }
    }
});
