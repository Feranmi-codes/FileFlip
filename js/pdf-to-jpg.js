import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const chooseBtn = document.getElementById("chooseBtn");
const selected = document.getElementById("selected");
const controls = document.getElementById("controls");
const formatSelect = document.getElementById("format");
const scaleSelect = document.getElementById("scale");
const convertBtn = document.getElementById("convertBtn");
const progress = document.getElementById("progress");
const progressBar = document.getElementById("progressBar");
const status = document.getElementById("status");
const results = document.getElementById("results");

let selectedFile = null;

// Choose PDF button
chooseBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    fileInput.click();
});

// Dropzone click
dropzone.addEventListener("click", () => {
    fileInput.click();
});

// File selected
fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
    }
});

// Drag over
dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("dragging");
});

// Drag leave
dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragging");
});

// Drop file
dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragging");

    if (event.dataTransfer.files.length > 0) {
        handleFile(event.dataTransfer.files[0]);
    }
});

// Handle selected file
function handleFile(file) {
    if (file.type !== "application/pdf") {
        alert("Please select a PDF file.");
        return;
    }

    selectedFile = file;

    selected.textContent = `Selected: ${file.name}`;
    selected.hidden = false;

    controls.hidden = false;
    convertBtn.hidden = false;

    status.textContent = "PDF ready to convert.";
}

// Convert PDF
convertBtn.addEventListener("click", async () => {
    if (!selectedFile) {
        alert("Please select a PDF first.");
        return;
    }

    convertBtn.disabled = true;
    progress.hidden = false;
    progressBar.style.width = "0%";
    results.innerHTML = "";
    status.textContent = "Loading PDF...";

    try {
        const arrayBuffer = await selectedFile.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer
        }).promise;

        const totalPages = pdf.numPages;

        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
            status.textContent =
                `Converting page ${pageNumber} of ${totalPages}...`;

            const page = await pdf.getPage(pageNumber);

            const scale = Number(scaleSelect.value);

            const viewport = page.getViewport({
                scale: scale
            });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            const format = formatSelect.value;

            const mimeType =
                format === "png"
                    ? "image/png"
                    : "image/jpeg";

            const extension =
                format === "png"
                    ? "png"
                    : "jpg";

            const imageData = canvas.toDataURL(
                mimeType,
                0.92
            );

            const link = document.createElement("a");

            link.href = imageData;
            link.download =
                `fileflip-page-${pageNumber}.${extension}`;

            link.textContent =
                `Download Page ${pageNumber}`;

            link.className = "result-download";

            const resultItem = document.createElement("div");

            resultItem.className = "result-item";

            const pageLabel = document.createElement("span");

            pageLabel.textContent =
                `Page ${pageNumber}`;

            resultItem.appendChild(pageLabel);
            resultItem.appendChild(link);

            results.appendChild(resultItem);

            const percentage =
                (pageNumber / totalPages) * 100;

            progressBar.style.width =
                `${percentage}%`;
        }

        status.textContent =
            `Done! ${totalPages} page${totalPages === 1 ? "" : "s"} converted.`;

    } catch (error) {
        console.error(error);

        status.textContent =
            "Something went wrong while converting the PDF.";

        alert(
            "Something went wrong while converting the PDF. Please try again."
        );
    }

    convertBtn.disabled = false;
});