

let isEmulationInProgress = {
    "state": false,
    "game": null,
    "emulator": null
};

let emulationStartTime = null;

const emulatorRunningElement = document.getElementById('emulatorRunning');

async function startEmulation(fileData) {
    console.log(`Starting emulation for ${fileData.entry}`);

    let emulatorName;
    let emulatorPath;
    let command;

    if (fileData.executable) {
        // bat files
        command = `"${fileData.path}"`;
        emulatorName = "Batch";
    } else {
        // Emulators
        emulatorName = fileData.path.split("Roms/")[1]?.split("/")[0];
        emulatorPath = romStructure[emulatorName].command;
        command = `"${driveLetter}:${emulatorPath}" "${fileData.path}"`;
    }

    if (!isEmulationInProgress.state) {

        let emulator = await spawnEmulator(command, emulatorName, fileData);
        handleEmulatorExitEvent(emulator);
        await Neutralino.window.minimize();

    } else {
        console.log(isEmulationInProgress);
    }
}



// Function to spawn the emulator process
async function spawnEmulator(command, emulatorName, fileData) {
    let emulator = await Neutralino.os.spawnProcess(command);
    emulationStartTime = Date.now();
    isEmulationInProgress.state = true;
    isEmulationInProgress.game = fileData.entry;
    isEmulationInProgress.emulator = emulatorName.split('-')[1]?.trim() || "Batch"; // Since we dont need the part before - like "3DS -" part

    emulatorRunningElement.textContent = `${isEmulationInProgress.emulator} is running ${fileData.entry}`;
    emulatorRunningElement.style.display = "block";
    document.getElementById('overlay').style.display = "block";
    changePlayBtn(true);

    return emulator;
}

// Function to handle emulator events
function handleEmulatorExitEvent(emulator) {
    Neutralino.events.on('spawnedProcess', (evt) => {
        if (emulator.id == evt.detail.id) {
            switch (evt.detail.action) {
                case 'exit':
                    if (emulationStartTime != null) {
                        console.log(`Process terminated with exit code: ${evt.detail.data}`);
                        const endTime = Date.now();
                        const playDuration = endTime - emulationStartTime;
                        emulationStartTime = null;

                        updateGameTime(isEmulationInProgress.game, playDuration).then(() => {
                            isEmulationInProgress.state = false;
                            isEmulationInProgress.game = null;
                            isEmulationInProgress.emulator = null;
                        
                            emulatorRunningElement.style.display = "none";
                            document.getElementById('overlay').style.display = "none";
                            changePlayBtn(false);
                        
                            Neutralino.window.maximize();
                            Neutralino.window.unmaximize();
                        });
                    }
                    break;
            }
        }
    });
}

async function updateGameTime(gameName, msPlayed) {
    if (!gameTimeData[gameName]) {
        gameTimeData[gameName] = { time: 0 };
    }

    if (typeof gameTimeData[gameName].time !== 'number') {
        gameTimeData[gameName].time = 0;
    }

    gameTimeData[gameName].time += msPlayed;

    await Neutralino.filesystem.writeFile("gameTime.json", JSON.stringify(gameTimeData, null, 2));
    updateGameTimeInUi(gameName, gameTimeData[gameName].time);
    console.log(`Updated ${gameName} playtime: +${msPlayed}ms`);
}
function updateGameTimeInUi(entryName, timePlayed) {
    const fileNameElements = document.querySelectorAll('p.fileName');

    fileNameElements.forEach(p => {
        if (p.textContent.startsWith(entryName)) {
            p.removeChild(p.lastChild);

            const totalSeconds = Math.floor(timePlayed / 1000);
            const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const seconds = String(totalSeconds % 60).padStart(2, '0');
            p.append(`${hours}:${minutes}:${seconds}`);
        }
    });
}

function changePlayBtn(isTrue) {
    var elements = document.querySelectorAll('.playRomBtn');

    elements.forEach(function(element) {
        if (isTrue) {
            element.style.backgroundColor = 'rgba(255, 102, 102, 0.7)'; 
            element.style.cursor = "not-allowed";
        } else {
            element.style.backgroundColor = 'rgba(102, 255, 102, 0.7)'; 
            element.style.cursor = "pointer";

        }
    });
}
