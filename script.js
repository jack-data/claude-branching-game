let storyData = {};
let currentStage = 'start';
let storyHistory = [];
let visitedChoices = {};
let currentLanguage = 'en';
let currentStoryFile = '';
let discoveredEndings = new Set();
let totalEndings = 0;

function loadStory(storyFile, preserveStage = false) {
    currentStoryFile = storyFile;
    fetch(`./Stories/${storyFile}_${currentLanguage}.json`)
        .then(response => response.json())
        .then(data => {
            storyData = data;
            if (!preserveStage) {
                currentStage = 'start';
                storyHistory = [];
                visitedChoices = {};
                discoveredEndings.clear();
            }
            totalEndings = Object.keys(storyData).filter(key => key.startsWith('end')).length;
            updateEndingsTracker();
            updateStory();
            updateVisualization();
        })
        .catch(error => console.error('Error loading story data:', error));
}

function getUniqueEndingKey(choice) {
    const parts = choice.split('-');
    return `end_${currentStage}_${parseInt(parts[1]) + 1}`;
}

function updateStory() {
    if (!storyData[currentStage]) {
        console.error('Invalid story stage:', currentStage);
        return;
    }

    const storyText = document.getElementById('story-text');
    const choice1 = document.getElementById('choice1');
    const choice2 = document.getElementById('choice2');
    const choice3 = document.getElementById('choice3');
    const backButton = document.getElementById('back-button');

    storyText.textContent = storyData[currentStage].text;

    const choices = storyData[currentStage].choices;
    [choice1, choice2, choice3].forEach((button, index) => {
        if (index < choices.length) {
            button.textContent = choices[index].text;
            button.style.display = 'block';
            
            const choiceKey = `${currentStage}-${index}`;
            if (visitedChoices[choiceKey]) {
                button.classList.add('visited');
            } else {
                button.classList.remove('visited');
            }

            button.onclick = () => {
                visitedChoices[choiceKey] = true;
                storyHistory.push(currentStage);
                if (choices[index].next === 'end') {
                    currentStage = getUniqueEndingKey(choiceKey);
                    discoveredEndings.add(currentStage);
                    updateEndingsTracker();
                } else {
                    currentStage = choices[index].next;
                }
                updateStory();
                updateVisualization();
            };
        } else {
            button.style.display = 'none';
        }
    });

    if (currentStage.startsWith('end')) {
        showShareButtons();
    } else {
        hideShareButtons();
    }

    if (storyHistory.length > 0) {
        backButton.style.display = 'block';
    } else {
        backButton.style.display = 'none';
    }
}

function goBack() {
    if (storyHistory.length > 0) {
        currentStage = storyHistory.pop();
        updateStory();
        updateVisualization();
    }
}

function setTheme(theme) {
    console.log('Setting theme:', theme);
    document.body.className = '';
    document.body.classList.add(theme + '-theme');
    localStorage.setItem('theme', theme);
}

function showShareButtons() {
    document.getElementById('share-buttons').style.display = 'block';
}

function hideShareButtons() {
    document.getElementById('share-buttons').style.display = 'none';
}

function shareOnTwitter() {
    const text = encodeURIComponent("I just finished an amazing interactive story! Check it out:");
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
}

function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function setLanguage(language) {
    currentLanguage = language;
    localStorage.setItem('language', language);
    loadStory(currentStoryFile, true);
}

function saveProgress() {
    const saveData = {
        currentStage,
        storyHistory,
        visitedChoices,
        currentLanguage,
        currentStoryFile,
        discoveredEndings: Array.from(discoveredEndings)
    };
    localStorage.setItem('savedProgress', JSON.stringify(saveData));
    alert('Progress saved!');
}

function loadProgress() {
    const savedData = localStorage.getItem('savedProgress');
    if (savedData) {
        const { currentStage: savedStage, storyHistory: savedHistory, visitedChoices: savedChoices, currentLanguage: savedLanguage, currentStoryFile: savedStoryFile, discoveredEndings: savedEndings } = JSON.parse(savedData);
        currentStage = savedStage;
        storyHistory = savedHistory;
        visitedChoices = savedChoices;
        currentLanguage = savedLanguage;
        currentStoryFile = savedStoryFile;
        discoveredEndings = new Set(savedEndings);
        document.getElementById('language-choice').value = currentLanguage;
        loadStory(currentStoryFile, true);
        alert('Progress loaded!');
    } else {
        alert('No saved progress found.');
    }
}

function updateEndingsTracker() {
    document.getElementById('endings-count').textContent = discoveredEndings.size;
    document.getElementById('total-endings').textContent = totalEndings;
}

function updateVisualization() {
    const container = document.getElementById('story-visualization');
    container.innerHTML = '';

    const tree = document.createElement('ul');
    tree.className = 'tree';

    function createNode(stage, parent) {
        const node = document.createElement('li');
        const content = document.createElement('span');
        content.textContent = stage;
        if (stage === currentStage) {
            content.className = 'current';
        }
        node.appendChild(content);

        if (storyData[stage] && storyData[stage].choices) {
            const childrenList = document.createElement('ul');
            storyData[stage].choices.forEach(choice => {
                createNode(choice.next, childrenList);
            });
            node.appendChild(childrenList);
        }

        parent.appendChild(node);
    }

    createNode('start', tree);
    container.appendChild(tree);
}

function setFontSize(size) {
    document.getElementById('story-text').style.fontSize = size + 'px';
}

// Event Listeners
document.getElementById('back-button').addEventListener('click', goBack);
document.getElementById('theme-choice').addEventListener('change', function() {
    setTheme(this.value);
});
document.getElementById('share-twitter').addEventListener('click', shareOnTwitter);
document.getElementById('share-facebook').addEventListener('click', shareOnFacebook);
document.getElementById('story-choice').addEventListener('change', function() {
    loadStory(this.value);
});
document.getElementById('language-choice').addEventListener('change', function() {
    setLanguage(this.value);
});
document.getElementById('save-button').addEventListener('click', saveProgress);
document.getElementById('load-button').addEventListener('click', loadProgress);
document.getElementById('font-size').addEventListener('input', function() {
    setFontSize(this.value);
});

function setTheme(theme) {
    console.log('Setting theme:', theme);
    document.body.className = '';
    document.body.classList.add(theme + '-theme');
    localStorage.setItem('theme', theme);

    // Apply theme-specific styles
    switch (theme) {
        case 'default':
            document.documentElement.style.setProperty('--main-bg-color', '#f0f0f0');
            document.documentElement.style.setProperty('--main-text-color', '#333');
            document.documentElement.style.setProperty('--button-bg-color', '#4CAF50');
            document.documentElement.style.setProperty('--button-text-color', 'white');
            break;
        case 'dark':
            document.documentElement.style.setProperty('--main-bg-color', '#333');
            document.documentElement.style.setProperty('--main-text-color', '#f0f0f0');
            document.documentElement.style.setProperty('--button-bg-color', '#6a5acd');
            document.documentElement.style.setProperty('--button-text-color', 'white');
            break;
        case 'fantasy':
            document.documentElement.style.setProperty('--main-bg-color', '#e6f3ff');
            document.documentElement.style.setProperty('--main-text-color', '#4a4a4a');
            document.documentElement.style.setProperty('--button-bg-color', '#ff9966');
            document.documentElement.style.setProperty('--button-text-color', '#ffffff');
            break;
        case 'psychedelic':
            document.documentElement.style.setProperty('--main-bg-color', '#ff00ff');
            document.documentElement.style.setProperty('--main-text-color', '#00ffff');
            document.documentElement.style.setProperty('--button-bg-color', '#ffff00');
            document.documentElement.style.setProperty('--button-text-color', '#ff00ff');
            break;
        case 'retrogaming':
            document.documentElement.style.setProperty('--main-bg-color', '#000000');
            document.documentElement.style.setProperty('--main-text-color', '#00ff00');
            document.documentElement.style.setProperty('--button-bg-color', '#808080');
            document.documentElement.style.setProperty('--button-text-color', '#00ff00');
            document.body.style.fontFamily = "'Press Start 2P', cursive";
            break;
    }
}

// Initial setup
const savedTheme = localStorage.getItem('theme') || 'default';
setTheme(savedTheme);
document.getElementById('theme-choice').value = savedTheme;

const savedLanguage = localStorage.getItem('language') || 'en';
currentLanguage = savedLanguage;
document.getElementById('language-choice').value = savedLanguage;

// Load the first story by default
loadStory('storyData_1');

// Set initial font size
setFontSize(16);