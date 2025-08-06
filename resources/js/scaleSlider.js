



var slider = document.getElementById("slider");

slider.addEventListener("input", function() {
    zoomMainContent(slider.value);
});


const mainContainer = document.getElementById('neutralinoapp');
function zoomMainContent(value) {
    mainContainer.style.zoom = value;
}