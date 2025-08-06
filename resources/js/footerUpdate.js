


// Search bar.
document.getElementById("searchBar").addEventListener("input", function() {
    var searchText = this.value.toLowerCase();
    var pElements = document.querySelectorAll('.tooltip p');
    
    pElements.forEach(function(pElement) {
        var pText = pElement.textContent.toLowerCase();
        if (searchText === "" || pText.includes(searchText)) {
            pElement.parentNode.parentNode.style.display = "flex";
        } else {
            if (searchText.startsWith("-")) {
                var searchTerm = searchText.substring(1).trim();
                if (pText.includes(searchTerm) && searchTerm != "") {
                    pElement.parentNode.parentNode.style.display = "none";
                } else {
                    pElement.parentNode.parentNode.style.display = "flex";
                }
            } else {
                pElement.parentNode.parentNode.style.display = "none";
            }
        }
    });
});


// Games found.

function updateGamesFound() {
    const element = document.getElementById('gamesFound');

    let allGames = 0;
    let unCompressedGames = 0;

    for (const key in storageSizes) {
        if (Object.prototype.hasOwnProperty.call(storageSizes, key)) {
            const storage = storageSizes[key];
            if (!storage.uncompressedSize) {
                unCompressedGames++;
            }
            allGames++;
        }
    }

    element.textContent = `Roms found: ${unCompressedGames}/${allGames}`;
}




// Storage


// Gonna optimize this code when needed but for now we can just loop through all the keys and do all the calculations everytime when we call this since we dont have too many keys.
function updateStorage() {
    const storageUsedElement = document.getElementById('storageUsed');
    let usedStorage = 0;
    let unCompressed = 0;

    for (const key in storageSizes) {
        if (Object.prototype.hasOwnProperty.call(storageSizes, key)) {
            const storage = storageSizes[key];
            usedStorage += storage.size;
            if (storage.uncompressedSize) {
                unCompressed += storage.uncompressedSize;
            } else {
                unCompressed += storage.size;
            }
        }
    }

    storageUsedElement.textContent = `Storage: ${formatSize(usedStorage)} / ${formatSize(unCompressed)}`;
    updateGamesFound();
}

function formatSize(size) {
    if (size >= 1024 * 1024 * 1024 * 1024) {
        return (size / (1024 * 1024 * 1024 * 1024)).toFixed(2) + ' TB';
    } else if (size >= 1024 * 1024 * 1024) {
        return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    } else if (size >= 1024 * 1024) {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
    } else if (size >= 1024) {
        return (size / 1024).toFixed(2) + ' KB';
    } else {
        return size + ' bytes';
    }
}




const storageSizes = {};

const rarPath = "C:\\Program Files\\WinRAR\\RAR.exe";

async function getCurrentUsedStorage(pathsObject) {
    const pathsArray = Object.keys(pathsObject);

    // Start progress
    for (let i = 0; i < pathsArray.length; i++) {
        const filePath = pathsArray[i];
        updateLoadingText(`Retrieving rom sizes. (${i + 1}, ${pathsArray.length})`);
        //setProgressBar(i, pathsArray.length);

        try {
            const stats = await Neutralino.filesystem.getStats(filePath);
            const fileSize = stats.size;
            const fileElement = pathsObject[filePath];

            storageSizes[filePath] = {
                size: fileSize,
                sizeElement: fileElement
            };

            if (filePath.endsWith('.rar')) {
                fileElement.textContent = `${formatSize(fileSize)} / ...`;
            } else {
                fileElement.textContent = formatSize(fileSize);
            }
        } catch (error) {
            console.log(`Error occurred while trying to get stats. ${error}`);
        }
    }

    updateLoadingText(`Retrieving rom uncompressed sizes.`);
    const rarFiles = pathsArray.filter(p => p.endsWith('.rar'));
    const uncompressedSizes = await getAllUncompressedSizes(pathsArray);

    rarFiles.forEach((filePath, index) => {
        const fileElement = pathsObject[filePath];
        const fileSize = storageSizes[filePath].size;
        const uncompressedSize = uncompressedSizes[index];

        storageSizes[filePath].uncompressedSize = uncompressedSize;
        fileElement.textContent = `${formatSize(fileSize)} / ${formatSize(uncompressedSize)}`;
    });
    
    updateStorage();
}

async function getFileSize(filePath) {
    try {
        const stats = await Neutralino.filesystem.getStats(filePath);
        return stats.size;
    } catch (error) {
        console.log(`Error occurred while trying to get stats. ${error}`);
        return null;
    }
}


function getSizeFromArchiveDetails(details) {
    const lines = details.split('\n');
    let size = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('Attributes')) {
            const parts = lines[i + 2].trim().split(/\s+/);
            size = parseInt(parts[1], 10);
            break;
        }
    }

    return size;
}






// Made it cache the results since its quite an expensive call which took us before multiple seconds to finish for like 40 roms.

const cacheFilePath = 'uncompressedSizes.json';

async function loadCache() {
    try {
        const files = await Neutralino.filesystem.readDirectory('.');
        if (files.find(f => f.entry === cacheFilePath)) {
            const data = await Neutralino.filesystem.readFile(cacheFilePath);
            return JSON.parse(data);
        }
    } catch (e) {
        console.warn('Error reading cache:', e);
    }
    return {};
}

async function saveCache(cache) {
    try {
        await Neutralino.filesystem.writeFile(cacheFilePath, JSON.stringify(cache, null, 2));
    } catch (e) {
        console.error('Error writing cache:', e);
    }
}

async function getUncompressedSize(filePath) {
    try {
        let info = await Neutralino.os.execCommand(`"${rarPath}" l -s "${filePath}"`);
        return getSizeFromArchiveDetails(info.stdOut);
    } catch (error) {
        console.log(error);
        return null;
    }
}

async function getAllUncompressedSizes(pathsArray) {
    const cache = await loadCache();
    const rarFiles = pathsArray.filter(p => p.endsWith('.rar'));

    const results = await Promise.all(rarFiles.map(async (filePath) => {
        if (cache[filePath] != null) {
            return cache[filePath];
        }
        const size = await getUncompressedSize(filePath);
        if (size != null) {
            cache[filePath] = size;
        }
        return size;
    }));

    await saveCache(cache);
    return results;
}