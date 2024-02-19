










function onWindowClose() {
    Neutralino.app.exit();
}

Neutralino.init();


Neutralino.events.on("windowClose", onWindowClose);





async function windowInitilization() {
    let display = await Neutralino.computer.getDisplays();
    const displayWidth = display[0].resolution.width;
    const displayHeight = display[0].resolution.height;

    const width = Math.round(displayWidth * 0.8); 
    const height = Math.round(displayHeight * 0.8); 

    await Neutralino.window.setSize({
        width: width,
        height: height
    });

    await Neutralino.window.center();

    await Neutralino.window.maximize();
}


windowInitilization();

function hideShowLoading(state) {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = state ? 'block' : 'none';
}