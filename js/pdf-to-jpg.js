import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const convertBtn = document.getElementById("convertBtn");
const formatSelect = document.getElementById("format");
const scaleSelect = document.getElementById("scale");
const progress = document.getElementById("progress");
const results = document.getElementById("results");

let selectedFile = null;

fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        selectedFile = fileInput.files[0];
        showSelectedFile();
    }
});

dropZone.addEventListener("click", () => {
    fileInput.click();
});

dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragging");
});

dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");

    if (event.dataTransfer.files.length > 0) {
        selectedFile = event.dataTransfer.files[0];
        showSelectedFile();
    }
});

function showSelectedFile() {
    dropZone.querySelector(".drop-title").textContent =
        selectedFile.name;

    dropZone.querySelector(".drop-subtitle").textContent =
        "Ready to convert";
}

convertBtn.addEventListener("click", async () => {
    if (!selectedFile) {
        alert("Please select a PDF first.");
        return;
    }

    if (selectedFile.type !== "application/pdf") {
        alert("Please select a PDF file.");
        return;
    }

    results.innerHTML = "";
    progress.style.width = "0%";
    convertBtn.disabled = true;

    try {
        const arrayBuffer = await selectedFile.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer
        }).promise;

        const totalPages = pdf.numPages;

        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);

            let scale = 1.5;

            if (scaleSelect.value === "high") {
                scale = 2;
            }

            if (scaleSelect.value === "very-high") {
                scale = 3;
            }

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

            const imageData = canvas.toDataURL(
                mimeType,
                0.92
            );

            const link = document.createElement("a");

            link.href = imageData;

            link.download =
                `fileflip-page-${pageNumber}.${format}`;

            link.textContent =
                `Download Page ${pageNumber}`;

            link.className = "result-download";

            const resultItem = document.createElement("div");

            resultItem.className = "result-item";

            resultItem.innerHTML = `
                <span>Page ${pageNumber}</span>
            `;

            resultItem.appendChild(link);

            results.appendChild(resultItem);

            const percentage =
                (pageNumber / totalPages) * 100;

            progress.style.width =
                `${percentage}%`;
        }

    } catch (error) {
        console.error(error);
        alert("Something went wrong while converting the PDF.");
    }

    convertBtn.disabled = false;
});