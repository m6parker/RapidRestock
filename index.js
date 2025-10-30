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
let shelves = [];

// a map of stores and how many items they have (dirName, fileCount)
const stores = new Map([
    ['cakes', 8],
    ['deserts', 18]
]);

const storesList = Array.from(stores.keys());
const itemsCount = Array.from(stores.values());

// controlling levels
let gameState = {
    level: level,
    rows: 3,
    cols: 3,
    store: stores.entries().next().value[0]
};

function createItems(storeName){
    // console.log(items)
    const numOfItems = stores.get(storeName);
    const imagesPath = `img/${storeName}/`;

    //loop thru each item inthe store
    for(let i = 1; i < numOfItems; i++){
        //create images using each path
        const itemName = `item (${i})`;
        const image = document.createElement('img');
        image.src = `${imagesPath}${itemName}.png`;

        //add them to the objects list to assign random positions
        image.className = 'grocery-item';
        items.push({name:itemName, image:image, row: 0, col: 0, slot: 0})
        items = assignRandomPositions(items, gameState.rows, gameState.cols)
    }
    console.log('items', items)

    // put each item on the shelf in the store
    items.forEach(item => {
        placeOnShelf(item)
    });
}

function assignRandomPositions(items, maxRows, maxCols, maxPerShelf = 3) {
    if (items.length > maxCols * maxRows * maxPerShelf) {
        console.warn("Not enough slots for all items.");
        return null;
    }

    const usedPositions = new Set();

    return items.map(item => {
        let col, row, slot, position;
        do {
            col = Math.floor(Math.random() * maxCols);
            row = Math.floor(Math.random() * maxRows);
            slot = Math.floor(Math.random() * maxPerShelf);
            position = `${col},${row},${slot}`;
        } while (usedPositions.has(position));

        usedPositions.add(position);
        return { ...item, col, row, slot };
    });
}


function createTable(){
    //remove old table
    container.firstChild?.remove();
    
    //create table based off gamestates rows and cols
    const table = document.createElement('table');
    table.className = 'main-table';
    for (let i = 0; i < gameState.rows; i++) {
        const row = document.createElement('tr');
        
        for (let j = 0; j < gameState.cols; j++) {
            const cell = document.createElement('td');
            cell.className = 'shelf';
            row.appendChild(cell);

            const slotContainer = document.createElement('div');
            slotContainer.className = 'slot-container';
            cell.appendChild(slotContainer);

            // each cell of the table can fit 3 items
            for(let k=0; k<3; k++){
                const slot = document.createElement('div');
                slot.className = 'slot empty';
                slotContainer.appendChild(slot)
                const id = `${i}${j}${k}`;
                slot.id = id;
                const shelf = {slot, id, hovered:false};

                shelves.push(shelf)
                //getting slot on hover
                slot.addEventListener('mouseover', () => {
                    shelf.hovered = true;
                })
                slot.addEventListener('mouseout', () => {
                    shelf.hovered = false;
                })
            }
        }
        
        table.appendChild(row);
    }
    container.appendChild(table);
}

//----------------------------------------------------
//                  Start Game                      ||
//----------------------------------------------------

function setGame(gameState){
    // levelName.textContent = gameState.store;
    levelName.innerHTML = `
        <img src="img/signs/${gameState.store} (2).png" alt="">
        <img src="img/signs/${gameState.store} (1).png" alt="">
        <img src="img/signs/${gameState.store} (3).png" alt="">
    `;
    createTable();
    createItems(gameState.store)
    createItems(gameState.store)
    createItems(gameState.store)
    checkSlots()
}
setGame(gameState);


let isDragging = false;
function placeOnShelf(item){
    const table = document.querySelector('.main-table')
    if (!item || !item.image || item.row === undefined || item.col === undefined) {
        console.log('missing item:', item);
        return;
    }
    
    //get the item's random posisitons
    const row = table.rows[item.row];
    const cell = row.cells[item.col];
    const slot = cell.children[0].children[item.slot] || item.slot;

    //add item image to the slot on the shelf
    slot.appendChild(item.image)
    slot.classList.remove('empty');
    
    item.image.addEventListener('mousedown', (e) => { 
        if (isPaused) return;
        // allows to pick up items not on the far right of the cell
        e.preventDefault();
        
        // dont let player pick up from sorted shelves
        if(cell.classList.contains('completed') || isDragging){ return; }
        document.body.style.cursor = 'grabbing';
        isDragging = true;
        
        //save item location if it needs to be sent back
        originalItem = item;
        itemInHand = item;
        console.log('item', item, 'original', originalItem, 'itemInHand', itemInHand)
        
        draggingImage.classList.remove('hidden');
        draggingImage.src = item.image.src;
        draggingImage.style.cursor = 'grabbing';
        draggingImage.style.left = e.clientX - DRAGGING_DISTANCE + 'px';
        draggingImage.style.top = e.clientY - DRAGGING_DISTANCE + 'px';
        item.image.remove();
    });
}


document.addEventListener('mouseup', function(e) {
    if (!isDragging) return;

    isDragging = false;
    draggingImage.classList.add('hidden');
    document.body.style.cursor = '';
    let selectedSlot = null;
    shelves.forEach(shelf => {if(shelf.hovered){ selectedSlot = shelf.slot;}} );

    if (selectedSlot && slotHasSpace(selectedSlot)) {
        itemInHand.slot = selectedSlot;
        placeOnShelf(itemInHand);
        checkSorted(selectedSlot.id)
        numberOfMoves++;
    } else {
        //return to original position
        console.log("SPOT IS TAKEN")
        placeOnShelf(originalItem);
    }
    checkSlots()
    itemInHand = {};
    originalItem = {};
    shelves.forEach(shelf => shelf.slot.classList.remove('highlighted'));
});

document.addEventListener('mousemove', function(e) {
    e.preventDefault();

    if(isDragging){
        shelves.forEach(shelf => {
            if(shelf.hovered){
                shelf.slot.classList.add('highlighted')
            }else{
                shelf.slot.classList.remove('highlighted')
            }

        });

        // enlarged image follows the mouse
        draggingImage.style.left = (e.clientX - DRAGGING_DISTANCE) + 'px';
        draggingImage.style.top = (e.clientY - DRAGGING_DISTANCE) + 'px';
    }
});

function slotHasSpace(slot){
    return slot.classList.contains('empty');
}

function checkSlots(){
    const slots = document.querySelectorAll('.slot');
    slots.forEach(slot => {
        if(slot.childElementCount === 0){
            slot.classList.add('empty')
        }else{
            slot.classList.remove('empty')
        }
    });
}

function checkSorted(posisitons){
    const table = document.querySelector('.main-table')
    const position = posisitons.split('');
    console.log(posisitons)
    const row = position[0];
    const col = position[1];
    let allMatch = true;
    const cell = Array.from(table.rows[row].cells[col].children[0].children);
    if(cell[0]?.children[0]?.src !== cell[1]?.children[0]?.src) allMatch = false;
    if(cell[0]?.children[0]?.src !== cell[2]?.children[0]?.src) allMatch = false;
    if(cell[1]?.children[0]?.src !== cell[2]?.children[0]?.src) allMatch = false;
    if(allMatch){
        table.rows[row].cells[col].children[0].classList.add('completed')
        //check all shelves if the game is finiahed
        checkAllShelves();
    }
    return allMatch;
}

function checkAllShelves(){
    let sorted = 0;
    const shelves = document.querySelectorAll('.slot-container');
    shelves.forEach(shelf => {
        if(shelf.classList.contains('completed')){ sorted++; }
    });
    console.log(sorted, itemsCount[level-1])
    if(sorted === itemsCount[level-1]-1){
        winLevel();
    }
}

//testing
document.querySelector('.skip-button').addEventListener('click', () => winLevel());

function winLevel(){
    winPopup.classList.remove('hidden')
    document.querySelector('.win-level').textContent = `Level ${gameState.level} Complete`;
    document.querySelector('.moves-count').textContent = `Moves: ${numberOfMoves}`;
    document.querySelector('.time').textContent = document.querySelector('.timer').textContent;
    stopTimer();
}

const nextLevelButton = document.querySelector('.play-button'); // next level button
nextLevelButton.addEventListener('click', () => {
    // location.reload();

    // create new level
    gameState.level++;
    gameState.rows = gameState.rows+2;
    gameState.cols = gameState.cols+1;
    items = [];
    gameState.store = storesList[gameState.level-1];
console.log(gameState,storesList)

    // todo: create game completed popup
    if(gameState.level > stores.length){ location.reload(); } //for continuous play
    setGame(gameState);
    
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
    pauseButton.classList.toggle('hidden')
    resumeButton.classList.toggle('hidden')
});

resumeButton.addEventListener('click', () => {
    isPaused = false;
    startTimer();
    resumeButton.disabled = true;
    pauseButton.disabled = false;
    pauseButton.classList.toggle('hidden')
    resumeButton.classList.toggle('hidden')
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