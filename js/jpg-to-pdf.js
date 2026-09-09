const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const chooseBtn = document.getElementById("chooseBtn");
const preview = document.getElementById("preview");
const createBtn = document.getElementById("createBtn");
const status = document.getElementById("status");

let selectedFiles = [];

// Choose images button
chooseBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    fileInput.click();
});

// Dropzone click
dropzone.addEventListener("click", () => {
    fileInput.click();
});

// Files selected
fileInput.addEventListener("change", () => {
    selectedFiles = Array.from(fileInput.files);
    showPreview();
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

// Drop images
dropzone.addEventListener("drop", (event) => {
    event.preventDefault();

    dropzone.classList.remove("dragging");

    selectedFiles = Array.from(event.dataTransfer.files);

    showPreview();
});

// Show selected images
function showPreview() {
    preview.innerHTML = "";

    if (selectedFiles.length === 0) {
        createBtn.hidden = true;
        status.textContent = "";
        return;
    }

    const validFiles = selectedFiles.filter((file) =>
        ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );

    if (validFiles.length !== selectedFiles.length) {
        alert("Please select only JPG, PNG, or WebP images.");
    }

    selectedFiles = validFiles;

    if (selectedFiles.length === 0) {
        createBtn.hidden = true;
        status.textContent = "";
        return;
    }

    status.textContent =
        `${selectedFiles.length} image(s) selected.`;

    selectedFiles.forEach((file) => {
        const item = document.createElement("div");

        item.className = "result-item";
        item.textContent = file.name;

        preview.appendChild(item);
    });

    createBtn.hidden = false;
}

// Create PDF
createBtn.addEventListener("click", async () => {
    if (selectedFiles.length === 0) {
        alert("Please select at least one image.");
        return;
    }

    createBtn.disabled = true;
    status.textContent = "Creating PDF...";

    try {
        const pdfDoc = await PDFLib.PDFDocument.create();

        for (const file of selectedFiles) {
            let image;

            if (file.type === "image/jpeg") {
                const imageBytes = await file.arrayBuffer();
                image = await pdfDoc.embedJpg(imageBytes);
            }

            else if (file.type === "image/png") {
                const imageBytes = await file.arrayBuffer();
                image = await pdfDoc.embedPng(imageBytes);
            }

            else if (file.type === "image/webp") {
                const pngBytes = await convertWebPToPng(file);
                image = await pdfDoc.embedPng(pngBytes);
            }

            if (!image) {
                continue;
            }

            const page = pdfDoc.addPage([
                image.width,
                image.height
            ]);

            page.drawImage(image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height
            });
        }

        const pdfBytes = await pdfDoc.save();

        const blob = new Blob(
            [pdfBytes],
            { type: "application/pdf" }
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

        alert(
            "Something went wrong while creating the PDF."
        );
    }

    createBtn.disabled = false;
});

// Convert WebP to PNG
function convertWebPToPng(file) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        const url = URL.createObjectURL(file);

        image.onload = () => {
            const canvas = document.createElement("canvas");

            canvas.width = image.width;
            canvas.height = image.height;

            const context = canvas.getContext("2d");

            context.drawImage(
                image,
                0,
                0
            );

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(
                            new Error("Could not convert WebP image.")
                        );
                        return;
                    }

                    blob.arrayBuffer()
                        .then(resolve)
                        .catch(reject);
                },
                "image/png"
            );

            URL.revokeObjectURL(url);
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(
                new Error("Could not load WebP image.")
            );
        };

        image.src = url;
    });
}