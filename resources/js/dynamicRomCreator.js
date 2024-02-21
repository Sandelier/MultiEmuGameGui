


// case sensitivity issue since we are using the entry name for the lookup of the directory.
const romStructure = {
    "3DS - Citra": {
        "extension": ".3ds",
        // Every emulator uses "exePath romPath" to launch the rom
        "command": ":/Gaming/Portable emulators/Citra/citra-qt.exe"
    },
    "DS - MelonDS": {
        "extension": ".nds",
        "command": ":/Gaming/Portable emulators/melonDs/melonDS.exe"
    },
    "Gameboy advance - mGBA": {
        "extension": ".gba",
        "command": ":/Gaming/Portable emulators/mGBA-0.10.3-win64/mGBA.exe"
    },
    "Gamecube - Dolphin": {
        "extension": ".rvz",
        "command": ":/Gaming/Portable emulators/Dolphin-x64/Dolphin.exe"
    },
    "PS1 - Duckstation": {
        "extension": ".bin",
        "command": ":/Gaming/Portable emulators/duckstation-windows-x64-release/duckstation-qt-x64-ReleaseLTCG.exe"
    },
    "PS2 - ppcsx2": {
        "extension": ".iso",
        "command": ":/Gaming/Portable emulators/pcsx2-v1.7.5552-windows-x64-Qt/pcsx2-qt.exe"
    },
    "PSP - PPSSPP": {
        "extension": ".iso",
        "command": ":/Gaming/Portable emulators/ppsspp_win/PPSSPPWindows64.exe"
    },
    "Wii - Dolphin": {
        "extension": ".rvz",
        "command": ":/Gaming/Portable emulators/Dolphin-x64/Dolphin.exe"
    }
};

function createFileElement(fileData) {
    const fileContainer = document.createElement('div');
    fileContainer.classList.add('romContainer');

    // tooltip
    const tooltip = createTooltip(fileData);
    tooltip.classList.add('tooltip');

    fileContainer.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
    });

    fileContainer.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });

    fileContainer.appendChild(tooltip);
    //

    setBackgroundImage(fileData.path, fileContainer);

    if (fileData.compressed) {
        fileContainer.classList.add('compressed-overlay');
    }

    return fileContainer;
}

/* Tooltip */

function createTooltip(fileData) {
    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');

    if (!fileData.executable) {
        const fileSize = document.createElement('p');
        fileSize.classList.add('fileSize');
        fileSize.textContent = '';
        tooltip.appendChild(fileSize);
    }

    const fileName = document.createElement('p');
    fileName.textContent = fileData.entry;
    tooltip.appendChild(fileName);


    tooltip.appendChild(createToolTipButton(fileData));

    tooltip.style.display = 'none';

    return tooltip;
}


function createToolTipButton(fileData) {
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    const playButton = document.createElement('button');
    playButton.classList.add('playRomBtn');

    playButton.textContent = fileData.executable ? 'Play Exe' : 'Play Rom';

    // rvz files are already compressed a lot so by compressing the file you wont save a lot of size which is why i disabled the zip button for rvz files. I tried compressing multiple rvz files and i only noticed an difference of about 5% file size or less.
    if (!fileData.executable && !fileData.path.endsWith(".rvz")) {
        const zipButton = document.createElement('button');
        zipButton.classList.add('zipBtn');

        if (fileData.compressed) {
            playButton.classList.add('compressedFile');
            playButton.textContent = 'Rom is compressed';
            zipButton.textContent = 'UNZIP';
        } else {
            zipButton.textContent = 'ZIP';
        }

        zipButton.addEventListener('click', () => {
            handleCompression(fileData, zipButton);
        });

        buttonContainer.appendChild(zipButton);
    }

    playButton.addEventListener('click', () => {
        if (!fileData.compressed) {
            startEmulation(fileData);
        }
    });

    buttonContainer.appendChild(playButton);

    return buttonContainer;
}

function setBackgroundImage(filePath, fileContainer) {
    const directoryPath = filePath.substring(0, filePath.lastIndexOf('/') + 1);
    const imagePath = directoryPath + 'banner.png';

    Neutralino.filesystem.readBinaryFile(imagePath)
        .then((imgData) => {
            const blob = new Blob([imgData], { type: 'image/png' });

            const imageDataUrl = URL.createObjectURL(blob);

            fileContainer.style.backgroundImage = `url(${imageDataUrl})`;
        })
        .catch((err) => {
            console.error(err);
        });
}


/* Retrieving roms */

function filterFiles(data, extension) {
    return data.filter(item => {
        return item.type === "FILE" && item.entry.endsWith(extension) || item.entry.endsWith(".rar");
    });
}

async function getAllRoms() {
    try {
        const fragment = document.createDocumentFragment();
        const romPaths = {}; 
        for (const folderToSearch in romStructure) {
            const extension = romStructure[folderToSearch].extension;
            const data = await Neutralino.filesystem.readDirectory(`${driveLetter}:/Gaming/Roms/${folderToSearch}`, { recursive: true });
            if (data.length > 0) {
                const filteredData = filterFiles(data, extension);
                filteredData.forEach(item => {
                    item.entry = item.entry.split('.').slice(0, -1).join('.'); 
                    item.entry = item.entry.replace(/\([^)]*\)/g, ''); 
                    if (item.path.endsWith(".rar")) {
                        item.compressed = true;
                    }
                    const fileElement = createFileElement(item);

                    romPaths[item.path] = fileElement.querySelector('.fileSize');
                    fragment.appendChild(fileElement);
                });
            } else {
                console.error(`No directories found in the ${folderToSearch} directory.`);
            }
        }
        const mainContainer = document.getElementById('neutralinoapp');
        mainContainer.appendChild(fragment);
        await getCurrentUsedStorage(romPaths);
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

async function getAllExecutables() {
    try {
        const fragment = document.createDocumentFragment();
        const data = await Neutralino.filesystem.readDirectory(`${driveLetter}:/Gaming/Executables/Shortcuts`, { recursive: true });
        if (data.length > 0) {

            const filteredData = filterFiles(data, ".bat");
            filteredData.forEach(item => {

                item.entry = item.entry.split('.').slice(0, -1).join('.'); 
                item.entry = item.entry.replace(/\([^)]*\)/g, ''); 
                item.executable = true;
                
                const fileElement = createFileElement(item);

                fragment.appendChild(fileElement);
            });
        } else {
            console.error(`No directories found in the shortcuts directory.`);
        }
        const mainContainer = document.getElementById('neutralinoapp');
        mainContainer.appendChild(fragment);
        fragment.childNodes.length

    } catch (error) {
        console.error("An error occurred:", error);
    }
}




let driveLetter;

async function domInitiilization() {
    try {
        const data = await Neutralino.os.execCommand('cmd /c echo %cd%', {});
        driveLetter = data.stdOut.trim().charAt(0).toUpperCase();

        await Promise.all([getAllRoms(), getAllExecutables()]);

        hideShowLoading(false);

    } catch (error) {
        console.error('Failed to retrieve drive letter.', error);
    }
}

window.onload = function() {
    domInitiilization();
};