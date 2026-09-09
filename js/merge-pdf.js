const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const chooseBtn = document.getElementById("chooseBtn");
const preview = document.getElementById("preview");
const mergeBtn = document.getElementById("mergeBtn");
const status = document.getElementById("status");

let selectedFiles = [];


// Choose PDFs button
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


// Drop PDFs
dropzone.addEventListener("drop", (event) => {

    event.preventDefault();

    dropzone.classList.remove("dragging");

    selectedFiles = Array.from(
        event.dataTransfer.files
    );

    showPreview();

});


// Show selected PDFs
function showPreview() {

    preview.innerHTML = "";

    if (selectedFiles.length === 0) {

        mergeBtn.hidden = true;

        status.textContent = "";

        return;
    }


    const validFiles = selectedFiles.filter(
        (file) => file.type === "application/pdf"
    );


    if (validFiles.length !== selectedFiles.length) {

        alert("Please select only PDF files.");

    }


    selectedFiles = validFiles;


    if (selectedFiles.length === 0) {

        mergeBtn.hidden = true;

        status.textContent = "";

        return;
    }


    status.textContent =
        `${selectedFiles.length} PDF(s) selected.`;


    selectedFiles.forEach((file, index) => {

        const item =
            document.createElement("div");

        item.className =
            "result-item";

        item.textContent =
            `${index + 1}. ${file.name}`;

        preview.appendChild(item);

    });


    if (selectedFiles.length < 2) {

        mergeBtn.hidden = true;

        status.textContent =
            "Select at least two PDFs to merge.";

        return;
    }


    mergeBtn.hidden = false;

}


// Merge PDFs
mergeBtn.addEventListener("click", async () => {

    if (selectedFiles.length < 2) {

        alert("Please select at least two PDFs.");

        return;
    }


    mergeBtn.disabled = true;

    status.textContent =
        "Merging PDFs...";


    try {

        const mergedPdf =
            await PDFLib.PDFDocument.create();


        for (
            let i = 0;
            i < selectedFiles.length;
            i++
        ) {

            status.textContent =
                `Processing PDF ${i + 1} of ${selectedFiles.length}...`;


            const file =
                selectedFiles[i];

            const bytes =
                await file.arrayBuffer();


            const sourcePdf =
                await PDFLib.PDFDocument.load(bytes);


            const pageIndices =
                sourcePdf
                    .getPageIndices();


            const copiedPages =
                await mergedPdf.copyPages(
                    sourcePdf,
                    pageIndices
                );


            copiedPages.forEach((page) => {

                mergedPdf.addPage(page);

            });

        }


        status.textContent =
            "Creating merged PDF...";


        const mergedBytes =
            await mergedPdf.save();


        const blob =
            new Blob(
                [mergedBytes],
                {
                    type: "application/pdf"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;

        link.download =
            "fileflip-merged.pdf";


        document.body.appendChild(link);

        link.click();

        link.remove();


        URL.revokeObjectURL(url);


        status.textContent =
            "PDFs merged successfully!";


    } catch (error) {

        console.error(error);

        status.textContent =
            "Something went wrong while merging the PDFs.";


        alert(
            "Something went wrong while merging the PDFs. Please try again."
        );

    }


    mergeBtn.disabled = false;

});