import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const chooseBtn = document.getElementById("chooseBtn");
const selected = document.getElementById("selected");
const controls = document.getElementById("controls");
const qualitySelect = document.getElementById("quality");
const compressBtn = document.getElementById("compressBtn");
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


// Handle PDF
function handleFile(file) {

    if (file.type !== "application/pdf") {

        alert("Please select a PDF file.");

        return;
    }

    selectedFile = file;

    selected.textContent =
        `Selected: ${file.name} (${formatBytes(file.size)})`;

    selected.hidden = false;

    controls.hidden = false;

    compressBtn.hidden = false;

    status.textContent =
        "PDF ready to compress.";

    results.innerHTML = "";

}


// Compress PDF
compressBtn.addEventListener("click", async () => {

    if (!selectedFile) {

        alert("Please select a PDF first.");

        return;
    }

    compressBtn.disabled = true;

    progress.hidden = false;

    progressBar.style.width = "0%";

    results.innerHTML = "";

    status.textContent =
        "Loading PDF...";

    try {

        const arrayBuffer =
            await selectedFile.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer
        }).promise;

        const totalPages = pdf.numPages;

        const pdfDoc =
            await PDFLib.PDFDocument.create();

        const quality =
            Number(qualitySelect.value);

        for (
            let pageNumber = 1;
            pageNumber <= totalPages;
            pageNumber++
        ) {

            status.textContent =
                `Compressing page ${pageNumber} of ${totalPages}...`;

            const page =
                await pdf.getPage(pageNumber);

            const originalViewport =
                page.getViewport({
                    scale: 1
                });

            const scale = 1.2;

            const viewport =
                page.getViewport({
                    scale: scale
                });

            const canvas =
                document.createElement("canvas");

            const context =
                canvas.getContext("2d");

            canvas.width =
                viewport.width;

            canvas.height =
                viewport.height;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            const imageData =
                canvas.toDataURL(
                    "image/jpeg",
                    quality
                );

            const imageBytes =
                dataURLToUint8Array(imageData);

            const image =
                await pdfDoc.embedJpg(imageBytes);

            const newPage =
                pdfDoc.addPage([
                    originalViewport.width,
                    originalViewport.height
                ]);

            newPage.drawImage(image, {
                x: 0,
                y: 0,
                width: originalViewport.width,
                height: originalViewport.height
            });

            const percentage =
                (pageNumber / totalPages) * 100;

            progressBar.style.width =
                `${percentage}%`;
        }

        status.textContent =
            "Creating compressed PDF...";

        const pdfBytes =
            await pdfDoc.save({
                useObjectStreams: true
            });

        const blob =
            new Blob(
                [pdfBytes],
                {
                    type: "application/pdf"
                }
            );

        const compressedSize =
            blob.size;

        const originalSize =
            selectedFile.size;

        const reduction =
            ((originalSize - compressedSize) /
                originalSize) * 100;

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            "fileflip-compressed.pdf";

        link.textContent =
            "Download Compressed PDF";

        link.className =
            "result-download";

        const resultItem =
            document.createElement("div");

        resultItem.className =
            "result-item";

        if (compressedSize < originalSize) {

            resultItem.innerHTML = `
                <span>
                    Original: ${formatBytes(originalSize)}
                    → Compressed: ${formatBytes(compressedSize)}
                    (${reduction.toFixed(1)}% smaller)
                </span>
            `;

        } else {

            resultItem.innerHTML = `
                <span>
                    Compressed file: ${formatBytes(compressedSize)}
                </span>
            `;

        }

        resultItem.appendChild(link);

        results.appendChild(resultItem);

        status.textContent =
            "PDF compressed successfully!";

    } catch (error) {

        console.error(error);

        status.textContent =
            "Something went wrong while compressing the PDF.";

        alert(
            "Something went wrong while compressing the PDF. Please try again."
        );

    }

    compressBtn.disabled = false;

});


// Convert Data URL to bytes
function dataURLToUint8Array(dataURL) {

    const base64 =
        dataURL.split(",")[1];

    const binaryString =
        atob(base64);

    const bytes =
        new Uint8Array(
            binaryString.length
        );

    for (
        let i = 0;
        i < binaryString.length;
        i++
    ) {

        bytes[i] =
            binaryString.charCodeAt(i);

    }

    return bytes;
}


// Format file size
function formatBytes(bytes) {

    if (bytes === 0) {
        return "0 Bytes";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];

    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

    return (
        parseFloat(
            (bytes /
                Math.pow(1024, index)
            ).toFixed(2)
        ) +
        " " +
        units[index]
    );
}