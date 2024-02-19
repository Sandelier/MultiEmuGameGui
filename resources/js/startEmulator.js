

let isEmulationInProgress = {
    "state": false,
    "game": null,
    "emulator": null
};

const emulatorRunningElement = document.getElementById('emulatorRunning');

async function startEmulation(fileData) {
    console.log(`Starting emulation for ${fileData.path}`);

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
        command = `"${driveLetter}${emulatorPath}" "${fileData.path}"`;
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
                    console.log(`Process terminated with exit code: ${evt.detail.data}`);
                    isEmulationInProgress.state = false;
                    isEmulationInProgress.game = null;
                    isEmulationInProgress.emulator = null;
                    emulatorRunningElement.style.display = "none";
                    document.getElementById('overlay').style.display = "none";
                    changePlayBtn(false);

                    Neutralino.window.maximize();
                    Neutralino.window.unmaximize();
                    break;
            }
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
