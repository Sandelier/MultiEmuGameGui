


// case sensitivity issue since we are using the entry name for the lookup of the directory.
const romStructure = {
    "3DS - Citra": {
        "extension": ".3ds",
        // Every emulator uses "exePath romPath" to launch the rom
        "command": "/Gaming/Rom gaming/Portable emulators/Citra/citra-qt.exe"
    },
    "DS - MelonDS": {
        "extension": ".nds",
        "command": "/Gaming/Rom gaming/Portable emulators/melonDs/melonDS.exe"
    },
    "Gameboy advance - mGBA": {
        "extension": ".gba",
        "command": "/Gaming/Rom gaming/Portable emulators/mGBA-0.10.3-win64/mGBA.exe"
    },
    "Gameboy Color - mGBA": {
        "extension": ".gbc",
        "command": "/Gaming/Rom gaming/Portable emulators/mGBA-0.10.3-win64/mGBA.exe"
    },
    "Gamecube - Dolphin": {
        "extension": ".rvz",
        "command": "/Gaming/Rom gaming/Portable emulators/Dolphin-x64/Dolphin.exe"
    },
    "PS1 - Duckstation": {
        "extension": ".bin",
        "command": "/Gaming/Rom gaming/Portable emulators/duckstation-windows-x64-release/duckstation-qt-x64-ReleaseLTCG.exe"
    },
    "PS2 - ppcsx2": {
        "extension": ".iso",
        "command": "/Gaming/Rom gaming/Portable emulators/pcsx2-v1.7.5552-windows-x64-Qt/pcsx2-qt.exe"
    },
    "PSP - PPSSPP": {
        "extension": ".iso",
        "command": "/Gaming/Rom gaming/Portable emulators/ppsspp_win/PPSSPPWindows64.exe"
    },
    "Wii - Dolphin": {
        "extension": ".rvz",
        "command": "/Gaming/Rom gaming/Portable emulators/Dolphin-x64/Dolphin.exe"
    },
    "Switch - Ryujinx": {
        "extension": ".nsp",
        "command": "/Gaming/Rom gaming/Portable emulators/ryujinx-1.1.1403-win_x64/Ryujinx.exe",
    }
};




function createFileElement(fileData) {
    const fileContainer = document.createElement('div');
    fileContainer.classList.add('romContainer');

    const hour = 60 * 60 * 1000;
    
    if (gameTimeData[fileData.entry] && gameTimeData[fileData.entry].state === "complete") {
        fileContainer.style.border = "2px solid lightgreen";
        fileContainer.dataset.state = gameTimeData[fileData.entry].state;

    } else if (gameTimeData[fileData.entry] && gameTimeData[fileData.entry].time >= hour) {
        fileContainer.style.border = "2px solid #ffff97";
        fileContainer.dataset.state = "playing";

    } else {
        fileContainer.dataset.state = "unplayed";
    }

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
    fileName.classList.add('fileName');
    fileName.textContent = fileData.entry;

    if (gameTimeData[fileData.entry] && typeof gameTimeData[fileData.entry].time === 'number') {
        fileName.appendChild(document.createElement('br'));
    
        const totalSeconds = Math.floor(gameTimeData[fileData.entry].time / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
    
        fileName.append(`${hours}:${minutes}:${seconds}`);
    }

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

    // rvz and nsp files are already compressed a lot so by compressing the file you wont save a lot of size which is why i disabled the zip button for rvz files. I tried compressing multiple rvz files and i only noticed an difference of about 5% file size or less.
    if (!fileData.executable && !fileData.path.endsWith(".rvz") && !fileData.path.endsWith(".nsp")) {
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
    const extensions = Array.isArray(extension) ? extension : [extension];

    return data.filter(item => {
        return item.type === "FILE" && (
            extensions.some(ext => item.entry.endsWith(ext)) ||
            item.entry.endsWith(".rar")
        );
    });
}



async function getAllRoms() {
    try {
        const fragment = document.createDocumentFragment();
        const romPaths = {}; 
        for (const folderToSearch in romStructure) {
            const extension = romStructure[folderToSearch].extension;
            const data = await Neutralino.filesystem.readDirectory(`../Roms/${folderToSearch}`, { recursive: true });
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
        const data = await Neutralino.filesystem.readDirectory(`../Executables/Shortcuts`, { recursive: true });
        if (data.length > 0) {

            const filteredData = filterFiles(data, [".bat", ".exe"]);
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
    } catch (error) {
        console.error("An error occurred:", error);
    }
}



let gameTimeData = {};

async function loadGameTime() {
    try {
        const content = await Neutralino.filesystem.readFile("gameTime.json");
        gameTimeData = JSON.parse(content || '{}');

        let totalTime = 0;
        for (const game of Object.values(gameTimeData)) {
            if (typeof game.time === 'number') {
                totalTime += game.time;
            }
        }

        const hours = Math.floor(totalTime / (1000 * 60 * 60));
        const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((totalTime % (1000 * 60)) / 1000);

        const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        console.log("Total time:", formattedTime);
    } catch (error) {
        console.log(error);
        await Neutralino.filesystem.writeFile("gameTime.json", JSON.stringify({}, null, 2));
    }
}

let driveLetter;

async function domInitiilization() {
    try {
        const data = await Neutralino.os.execCommand('cmd /c echo %cd%', {});
        driveLetter = data.stdOut.trim().charAt(0).toUpperCase();

        await loadGameTime();
        updateLoadingText(`Finding games...`);
        await Promise.all([getAllRoms(), getAllExecutables()]);
        hideShowLoading(false);

        const finished = new CustomEvent('finished');
        document.body.dispatchEvent(finished);

    } catch (error) {
        console.error('Failed to retrieve drive letter.', error);
    }
}

window.onload = function() {
    domInitiilization();
};