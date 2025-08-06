
// Checkboxes
const checkboxes = document.querySelectorAll('header .checkbox-stack input[type="checkbox"]');

function updateVisibility() {
    const roms = document.querySelectorAll('.romContainer');
    const activeFilters = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.dataset.id);

    roms.forEach(item => {
        const itemState = item.dataset.state;

        const shouldShow = activeFilters.length === 0 || activeFilters.includes(itemState);
        item.classList.toggle('hiddenRom', !shouldShow);
    });
}   

checkboxes.forEach(cb => cb.addEventListener('change', updateVisibility));




(function() {
	const container = document.getElementById('neutralinoapp');
	const shownRomsEle = document.getElementById('shownRoms');
    const timePlayedEle = document.getElementById('timePlayed');

	if (!container) return;


	const timePlayed = (visibleChildren) => {

        let totalTime = 0;

		visibleChildren.forEach(child => {
			const fileNameElements = child.querySelectorAll('.tooltip > .fileName');
			fileNameElements.forEach(el => {
                const romName = el.innerHTML.split('<br>')[0].trim();

                if (gameTimeData[romName] && gameTimeData[romName].time) {
					totalTime += gameTimeData[romName].time;
				}
			});
		});

        const totalSeconds = Math.floor(totalTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        // Format 00h 00m 00s
        const formattedTime = `Time played: ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
        
        timePlayedEle.textContent = formattedTime;
	};

	// Currently shown
	const startObserving = () => {
		const config = {
			childList: true
		};
		const childAttributeConfig = {
			attributes: true,
			attributeFilter: ['style', 'class']
		};

		const updateVisibleCount = () => {
			const visibleChildren = Array.from(container.children).filter(child => {
				return child.style.display !== 'none' && !child.classList.contains('hiddenRom');
			});

			shownRomsEle.textContent = `Shown roms: ${visibleChildren.length}`;

			timePlayed(visibleChildren);
		};

		const containerObserver = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach(node => {
						if (node.nodeType === 1) {
							childObserver.observe(node, childAttributeConfig);
						}
					});

					mutation.removedNodes.forEach(() => {
						childObserver.disconnect();
						Array.from(container.children).forEach(child => {
							childObserver.observe(child, childAttributeConfig);
						});
					});

					updateVisibleCount();
				}
			});
		});

		const childObserver = new MutationObserver(updateVisibleCount);

		Array.from(container.children).forEach(child => {
			childObserver.observe(child, childAttributeConfig);
		});

		containerObserver.observe(container, config);
		updateVisibleCount();
	};

	document.body.addEventListener('finished', () => {
		startObserving();
	});
})();