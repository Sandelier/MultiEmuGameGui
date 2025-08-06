



const winrarPath = 'C:\\Program Files\\WinRAR\\WinRAR.exe';

function handleCompression(fileData, clickedBtn) {
    if (!fileData.compressionOnGoing) {

        fileData.compressionOnGoing = true;

        let command;

        // Unzip
        if (fileData.path.endsWith(".rar") && fileData.compressed) {
            command = `"${winrarPath}" x "${fileData.path}" "${fileData.path.substring(0, fileData.path.lastIndexOf("/"))}"`;
        // Zip
        } else {
            command = `"${winrarPath}" a -ep1 "${fileData.path.replace(/\.[^/.]+$/, "") + ".rar"}" "${fileData.path}"`;
        }
    
        executeCompressionCommand(command, fileData, clickedBtn);
    }
}

// Changes fileData values so we can compress and uncompress the same file again
function updateRomFilePath(fileData, clickedBtn) {
    const emulator = fileData.path.split("Roms/")[1]?.split("/")[0];
    const playBtn = clickedBtn.nextElementSibling;
    const romContainer = clickedBtn.parentNode.parentNode.parentNode;

    if (fileData.compressed) { // true if rar
        fileData.path = fileData.path.replace(/\.[^/.]+$/, "") + `${romStructure[emulator].extension}`;
        fileData.compressed = false;

        playBtn.classList.remove('compressedFile');
        playBtn.textContent = "Play Rom";
        clickedBtn.textContent = 'ZIP';
        romContainer.classList.remove('compressed-overlay');

    } else { // false if rom
        fileData.path = fileData.path.replace(/\.[^/.]+$/, "") + ".rar";
        fileData.compressed = true;

        playBtn.classList.add('compressedFile');
        playBtn.textContent = "Rom is compressed";
        clickedBtn.textContent = 'UNZIP';
        romContainer.classList.add('compressed-overlay');
    }
}

async function executeCompressionCommand(command, fileData, clickedBtn) {
    let winrarProcess = await Neutralino.os.spawnProcess(command);

    console.log(`Compressing/Uncompressing: ${fileData.path}`);

    Neutralino.events.on('spawnedProcess', async (evt) => {
        if (winrarProcess && winrarProcess.id == evt.detail.id) {
            switch (evt.detail.action) {
                case 'exit':

                    winrarProcess = null;

                    let oldPath = fileData.path;

                    const emulator = fileData.path.split("Roms/")[1]?.split("/")[0];
                    
                    let newPath;
                    if (fileData.path.endsWith('.rar')) {
                        newPath = fileData.path.replace(/\.[^/.]+$/, "") + `${romStructure[emulator].extension}`;
                    } else {
                        newPath = fileData.path.replace(/\.[^/.]+$/, "") + ".rar";
                    }

                    let fileSize = await getFileSize(newPath);

                    if (fileSize > 1) {

                        removeOldFile(fileData);

                        updateRomFilePath(fileData, clickedBtn);

                        storageSizes[fileData.path] = {
                            size: fileSize,
                            sizeElement: storageSizes[oldPath].sizeElement
                        };

                        delete storageSizes[oldPath];

                        if (storageSizes[fileData.path].uncompressedSize) {
                            storageSizes[fileData.path].uncompressedSize = null;
                        } else {
                            storageSizes[fileData.path].uncompressedSize = await getUncompressedSize(fileData.path); 
                        }

                        if (storageSizes[fileData.path].uncompressedSize) {
                            storageSizes[fileData.path].sizeElement.textContent = `${formatSize(fileSize)} / ${formatSize(storageSizes[fileData.path].uncompressedSize)}`;
                        } else {
                            storageSizes[fileData.path].sizeElement.textContent = `${formatSize(fileSize)}`;
                        }
                        
                        updateStorage();

                    } else {
                        console.error("Compression failed for file: " + newPath);
                        console.error("fileData: ", fileData);
                        console.error("Emulator: ", emulator);
                        console.error("newPath: ", newPath);

                    }

                    fileData.compressionOnGoing = false;
                    break;
            }
        }
    });
}

async function removeOldFile(fileData) {
    await Neutralino.filesystem.remove(fileData.path);
}