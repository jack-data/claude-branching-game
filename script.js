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
            totalEndings = Object.keys(storyData).filter(key => key.startsWith('end_')).length;
            updateEndingsTracker();
            updateStory();
            updateVisualization();
        })
        .catch(error => console.error('Error loading story data:', error));
}

function getUniqueEndingKey(stage, choiceIndex) {
    return `end_${stage}_${choiceIndex + 1}`;
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
                if (choices[index].next.startsWith('end_')) {
                    currentStage = choices[index].next;
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

    if (currentStage.startsWith('end_')) {
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
    document.body.className = theme + '-theme';
    localStorage.setItem('theme', theme);

    // Apply theme-specific styles
    const root = document.documentElement;
    switch (theme) {
        case 'default':
            root.style.setProperty('--main-bg-color', '#f0f0f0');
            root.style.setProperty('--main-text-color', '#333');
            root.style.setProperty('--button-bg-color', '#4CAF50');
            root.style.setProperty('--button-text-color', 'white');
            root.style.setProperty('--font-family', 'Arial, sans-serif');
            break;
        case 'dark':
            root.style.setProperty('--main-bg-color', '#222');
            root.style.setProperty('--main-text-color', '#e0e0e0');
            root.style.setProperty('--button-bg-color', '#6a5acd');
            root.style.setProperty('--button-text-color', 'white');
            root.style.setProperty('--font-family', "'Roboto', sans-serif");
            break;
        case 'fantasy':
            root.style.setProperty('--main-bg-color', '#f3e5ab');
            root.style.setProperty('--main-text-color', '#4a2700');
            root.style.setProperty('--button-bg-color', '#8b4513');
            root.style.setProperty('--button-text-color', '#f3e5ab');
            root.style.setProperty('--font-family', "'Cinzel', serif");
            document.body.style.backgroundImage = "url('https://example.com/parchment-texture.jpg')";
            break;
        case 'psychedelic':
            root.style.setProperty('--main-bg-color', '#ff00ff');
            root.style.setProperty('--main-text-color', '#00ffff');
            root.style.setProperty('--button-bg-color', '#ffff00');
            root.style.setProperty('--button-text-color', '#ff00ff');
            root.style.setProperty('--font-family', "'Monoton', cursive");
            break;
        case 'retrogaming':
            root.style.setProperty('--main-bg-color', '#000000');
            root.style.setProperty('--main-text-color', '#00ff00');
            root.style.setProperty('--button-bg-color', '#808080');
            root.style.setProperty('--button-text-color', '#00ff00');
            root.style.setProperty('--font-family', "'Press Start 2P', cursive");
            break;
    }
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
        
        // Check if this is an ending node
        if (stage === 'end' && currentStage.startsWith('end_')) {
            content.textContent = currentStage; // Use the unique ending key
        } else {
            content.textContent = stage;
        }
        
        if (stage === currentStage || (stage === 'end' && currentStage.startsWith('end_'))) {
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
    document.body.className = theme + '-theme';
    localStorage.setItem('theme', theme);

    // Reset all custom styles
    document.body.style = '';
    document.documentElement.style = '';

    // Apply theme-specific styles
    const root = document.documentElement;
    switch (theme) {
        case 'default':
            root.style.setProperty('--main-bg-color', '#f0f0f0');
            root.style.setProperty('--main-text-color', '#333');
            root.style.setProperty('--button-bg-color', '#4CAF50');
            root.style.setProperty('--button-text-color', 'white');
            root.style.setProperty('--font-family', 'Arial, sans-serif');
            break;
        case 'dark':
            root.style.setProperty('--main-bg-color', '#222');
            root.style.setProperty('--main-text-color', '#092e3a');
            root.style.setProperty('--button-bg-color', '#6a5acd');
            root.style.setProperty('--button-text-color', 'white');
            root.style.setProperty('--font-family', "'Roboto', sans-serif");
            break;
        case 'fantasy':
            root.style.setProperty('--main-bg-color', '#f3e5ab');
            root.style.setProperty('--main-text-color', '#4a2700');
            root.style.setProperty('--button-bg-color', '#8b4513');
            root.style.setProperty('--button-text-color', '#f3e5ab');
            root.style.setProperty('--font-family', "'Cinzel', serif");
            document.body.style.backgroundImage = "url('https://example.com/parchment-texture.jpg')";
            break;
        case 'psychedelic':
            root.style.setProperty('--main-bg-color', '#ff00ff');
            root.style.setProperty('--main-text-color', '#0f4141');
            root.style.setProperty('--button-bg-color', '#ffff00');
            root.style.setProperty('--button-text-color', '#ff00ff');
            root.style.setProperty('--font-family', "'Monoton', cursive");
            break;
        case 'retrogaming':
            root.style.setProperty('--main-bg-color', '#000000');
            root.style.setProperty('--main-text-color', '#00ff00');
            root.style.setProperty('--button-bg-color', '#808080');
            root.style.setProperty('--button-text-color', '#00ff00');
            root.style.setProperty('--font-family', "'Press Start 2P', cursive");
            break;
    }

    // Force a repaint to ensure all styles are applied correctly
    document.body.offsetHeight;
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

// Make sure this event listener is at the end of your script.js file
document.addEventListener('DOMContentLoaded', (event) => {
    const savedTheme = localStorage.getItem('theme') || 'default';
    setTheme(savedTheme);
    document.getElementById('theme-choice').value = savedTheme;
});