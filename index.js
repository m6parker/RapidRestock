const container = document.querySelector('.shelf-container');
const backgroundContainerLeft = document.querySelector('.left-shelf-container');
const backgroundContainerRight = document.querySelector('.right-shelf-container');
const draggingImage = document.querySelector('.dragging-image');
const levelName = document.querySelector('.level-name');
const winPopup = document.querySelector('.win-msg');
const DRAGGING_DISTANCE = 100;

let isPaused = false;
let numberOfMoves = 0;
let items = [];
let itemInHand = {};
let originalItem = {};
let level = 1;

const cakeList = [
    'cake1','cake1','cake1',
    'cake2','cake2','cake2',
    'cake3','cake3','cake3',
    'cake4','cake4','cake4',
    'cake5','cake5','cake5',
    'cake6','cake6','cake6',
];

const potionList = [
    'green_one','green_one','green_one',
    'green_two','green_two','green_two',
    'pink_one','pink_one','pink_one',
    'orange_one','orange_one','orange_one'
];

const testList = [
    'red', 'red', 'red', 
    'green', 'green', 'green', 
    'blue', 'blue', 'blue',
    'yellow','yellow','yellow',
    'pink', 'pink', 'pink',
    'purple','purple','purple',
    'orange', 'orange', 'orange',
    'brown', 'brown', 'brown',
    'white', 'white', 'white'
];

// name of directory containing images - also displayed above shelf
const themes = [
    'cakes',
    'potions',
    'tests',
];

// which filenames to chose for images
const imageLists = [
    cakeList,
    potionList,
    testList
]

// controlling levels
let gameState = {
    level: level,
    rows: 3,
    cols: 3,
    theme: themes[level-1],
    list: cakeList
};

function createGroceryList(groceryList){
    // create each item image
    groceryList.forEach(item => {
        const image = document.createElement('img');
        image.src = `img/${gameState.theme}/${item}.png`;
        image.className = 'grocery-item';
        items.push({item, row: 0, col: 0})
    });

    // assign items to random row/col and place on the shelves
    const groceryMap = assignRandomPositions(items, gameState.rows, gameState.cols)
    groceryMap.forEach(item => {
        placeOnShelf(item)
    });
}

function assignRandomPositions(items, maxRows, maxCols) {
    if (items.length > maxCols * maxRows * 3) {
        return null;
    }

    // allows three items per shelf
    const positionCounts = {};

    return items.map(item => {
        let col;
        let row;
        let position;
        do {
            col = Math.floor(Math.random() * maxCols);
            row = Math.floor(Math.random() * maxRows);
            position = `${col},${row}`;
        } while ((positionCounts[position] || 0) >= 3);

        positionCounts[position] = (positionCounts[position] || 0) + 1;
        return { ...item, col, row };
    });
}

function createTable(){
    //remove old table
    container.firstChild?.remove();
    
    const table = document.createElement('table');
    table.className = 'main-table';
    for (let i = 0; i < gameState.rows; i++) {
        const row = document.createElement('tr');
        
        for (let j = 0; j < gameState.cols; j++) {
            const cell = document.createElement('td');
            cell.className = 'mainCell';
            row.appendChild(cell);
        }
        
        table.appendChild(row);
    }
    container.appendChild(table);
}

//----------------------------------------------------
//                  Start Game                      ||
//----------------------------------------------------

function setGame(){
    levelName.textContent = gameState.theme;
    createTable();
    createGroceryList(gameState.list);
}
setGame();


let isDragging = false;
function placeOnShelf(item){
    const table = document.querySelector('.main-table')
    if (!item || !item.item || item.row === undefined || item.col === undefined) {
        console.log('missing item:', item);
        return;
    }
    const row = table.rows[item.row];
    const cell = row.cells[item.col];
    if (cell.classList.contains('full') || cell.classList.contains('completed')) {
        // Revert to original position
        item.row = originalItem.row;
        item.col = originalItem.col;
    }
    const image = document.createElement('img');
    image.src = `img/${gameState.theme}/${item.item}.png`;
    image.className = 'grocery-item';
    cell.appendChild(image)

    image.addEventListener('mousedown', function(e) {
        if (isPaused) return;

        // allows to pick up items not on the far right of the cell
        e.preventDefault();
        
        // dont let player pick up from sorted shelves
        if(cell.classList.contains('completed') || isDragging){ return; }

        document.body.style.cursor = 'grabbing';

        isDragging = true;
        itemInHand = item;
        //save item location if it needs to be sent back
        originalItem = {...item}
        draggingImage.classList.remove('hidden');
        draggingImage.src = `img/${gameState.theme}/${itemInHand.item}.png`;
        draggingImage.style.cursor = 'grabbing';
        draggingImage.style.left = e.clientX - DRAGGING_DISTANCE + 'px';
        draggingImage.style.top = e.clientY - DRAGGING_DISTANCE + 'px';
        this.remove();
    });
}

document.addEventListener('mouseup', function(e) {
    if (!isDragging) return;
    isDragging = false;
    draggingImage.classList.add('hidden');
    document.body.style.cursor = '';
    const cell = document.elementFromPoint(e.clientX, e.clientY).closest('td');
    checkRoomOnShelf(cell)
    if (cell && !cell.classList.contains('full') && !cell.classList.contains('completed')) {
        itemInHand.row = parseInt(cell.parentNode.rowIndex);
        itemInHand.col = cell.cellIndex;
        placeOnShelf(itemInHand);
        checkSorted(cell)
        numberOfMoves++;
    } else {
        //return to original position
        placeOnShelf(originalItem);
    }
    itemInHand = {};
});

document.addEventListener('mousemove', function(e) {
    e.preventDefault();

    if(isDragging){
        draggingImage.style.left = (e.clientX - DRAGGING_DISTANCE) + 'px';
        draggingImage.style.top = (e.clientY - DRAGGING_DISTANCE) + 'px';
    }
});

function checkRoomOnShelf(shelf){
    if(!shelf) return;
    if(shelf.childElementCount === 3){
        shelf.classList.add('full')
        checkSorted(shelf)
    }else{
        shelf.classList.remove('full')
    }
}

function checkSorted(shelf){
    const firstItem = shelf.children[0];
    if(shelf.children.length === 3 && Array.from(shelf.children).every(item => item.src === firstItem.src)){
        shelf.classList.add('completed');
        checkAllShelves();
    }
}

function checkAllShelves(){
    let sorted = 0;
    const shelves = document.querySelectorAll('.mainCell');
    shelves.forEach(shelf => {
        if(shelf.classList.contains('completed')){ sorted++; }
    });
    if(sorted === gameState.list.length/3){
        // console.log('you win!');
        winLevel();
    }
}

function winLevel(){
    winPopup.classList.remove('hidden')
    document.querySelector('.moves-count').textContent = `moves: ${numberOfMoves}`;
    document.querySelector('.time').textContent = document.querySelector('.timer').textContent;
    stopTimer();
}

const reloadButton = document.querySelector('.play-button');
reloadButton.addEventListener('click', () =>{
    // location.reload();

    // create new level
    gameState.level++;
    gameState.theme = themes[gameState.level-1];
    gameState.rows = 5;
    gameState.list = imageLists[gameState.level-1];
    items = []

    // todo: create game completed popup
    if(gameState.level > themes.length){ location.reload(); } //for continuous play
    setGame();
    
    //remove win popup
    numberOfMoves = 0;
    winPopup.classList.add('hidden');

    document.querySelectorAll('table').forEach(table => table.classList.add('themeTwo'));
    document.querySelectorAll('td').forEach(td => td.classList.add('themeTwo'));

    resetTimer();
    startTimer();
});

// --------------------------------------
// |              timer                 |
// --------------------------------------

// const pauseScreen = document.querySelector('.pause-container');
const pauseButton = document.querySelector('.pause-button');
const resumeButton = document.querySelector('.resume-button');
pauseButton.addEventListener('click', () => {
    isPaused = true;
    // pauseScreen.classList.toggle('hidden');
    stopTimer();
    pauseButton.disabled = true;
    resumeButton.disabled = false;
});

resumeButton.addEventListener('click', () => {
    isPaused = false;
    startTimer();
    resumeButton.disabled = true;
    pauseButton.disabled = false;
});

let startTime;
let timerInterval;
let elapsedTime = 0;
const timerDisplay = document.querySelector('.timer');

startTimer();

function formatTime(ms) {
    let date = new Date(ms);
    let hours = date.getUTCHours().toString().padStart(2, '0');
    let minutes = date.getUTCMinutes().toString().padStart(2, '0');
    let seconds = date.getUTCSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function startTimer() {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(function() {
        elapsedTime = Date.now() - startTime;
        timerDisplay.textContent = formatTime(elapsedTime);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function resetTimer() {
    clearInterval(timerInterval);
    elapsedTime = 0;
    timerDisplay.textContent = '00:00:00';
}