const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const createPdfBtn = document.getElementById("createPdfBtn");
const results = document.getElementById("results");
const status = document.getElementById("status");

let selectedFiles = [];

fileInput.addEventListener("change", () => {
    selectedFiles = Array.from(fileInput.files);
    showPreview();
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

    selectedFiles = Array.from(
        event.dataTransfer.files
    );

    showPreview();
});

function showPreview() {
    results.innerHTML = "";

    if (selectedFiles.length === 0) {
        status.textContent = "";
        return;
    }

    status.textContent =
        `${selectedFiles.length} image(s) selected.`;

    selectedFiles.forEach((file) => {
        const item = document.createElement("div");

        item.className = "result-item";

        item.textContent = file.name;

        results.appendChild(item);
    });
}

createPdfBtn.addEventListener("click", async () => {
    if (selectedFiles.length === 0) {
        alert("Please select at least one image.");
        return;
    }

    createPdfBtn.disabled = true;

    status.textContent = "Creating PDF...";

    try {
        const pdfDoc = await PDFLib.PDFDocument.create();

        for (const file of selectedFiles) {
            let imageBytes = await file.arrayBuffer();

            let image;

            if (file.type === "image/png") {
                image = await pdfDoc.embedPng(imageBytes);
            } else if (file.type === "image/jpeg") {
                image = await pdfDoc.embedJpg(imageBytes);
            } else if (file.type === "image/webp") {
                const convertedData =
                    await convertWebPToPng(file);

                image = await pdfDoc.embedPng(
                    convertedData
                );
            } else {
                continue;
            }

            const width = image.width;
            const height = image.height;

            const page = pdfDoc.addPage([
                width,
                height
            ]);

            page.drawImage(image, {
                x: 0,
                y: 0,
                width: width,
                height: height
            });
        }

        const pdfBytes = await pdfDoc.save();

        const blob = new Blob(
            [pdfBytes],
            {
                type: "application/pdf"
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "fileflip-document.pdf";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

        status.textContent =
            "PDF created successfully!";

    } catch (error) {
        console.error(error);

        status.textContent =
            "Something went wrong while creating the PDF.";
    }

    createPdfBtn.disabled = false;
});

function convertWebPToPng(file) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        const url = URL.createObjectURL(file);

        image.onload = () => {
            const canvas =
                document.createElement("canvas");

            canvas.width = image.width;
            canvas.height = image.height;

            const context =
                canvas.getContext("2d");

            context.drawImage(
                image,
                0,
                0
            );

            canvas.toBlob(
                (blob) => {
                    blob.arrayBuffer()
                        .then(resolve)
                        .catch(reject);
                },
                "image/png"
            );

            URL.revokeObjectURL(url);
        };

        image.onerror = reject;

        image.src = url;
    });
}