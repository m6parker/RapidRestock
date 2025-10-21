const container = document.querySelector('.shelf-container');

const table = document.createElement('table');
const draggingImage = document.querySelector('.dragging-image');

const rows = 5;
const cols = 3;

const groceryList = [
    'red', 'red', 'red', 
    'green', 'green', 'green', 
    'blue', 'blue', 'blue',
    'yellow','yellow','yellow',
    'pink', 'pink', 'pink'
    // 'purple','purple','purple'
];
let items = [];
let itemInHand = {}

groceryList.forEach(item => {
    const image = document.createElement('img');
    image.src = `img/${item}.png`;
    image.className = 'grocery-item';
    items.push({item, row: 0, col: 0})
});

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

for (let i = 0; i < rows; i++) {
    const row = document.createElement('tr');

    for (let j = 0; j < cols; j++) {
        const cell = document.createElement('td');
        row.appendChild(cell);

        cell.addEventListener('mouseover', function() {
            // console.log('drop item', `row: ${i+1}| col: ${j+1}`)
            if(isDragging){
                itemInHand.row = i;
                itemInHand.col = j;
            }
        });
        
        cell.addEventListener('mouseup', function() {
            if(!cell.classList.contains('full')){

                isDragging = false;
                placeOnShelf(itemInHand)
                itemInHand = {}
                draggingImage.classList.add('hidden');
            }
                
            checkRoomOnShelf(cell);
            checkSorted(cell);
        });
    }

    table.appendChild(row);
}

container.appendChild(table);
const groceryMap = assignRandomPositions(items, rows, cols)

// place items on the shelves
let isDragging = false;
groceryMap.forEach(item => {
    placeOnShelf(item)
});

function placeOnShelf(item){
    const row = table.rows[item.row];
    const cell = row.cells[item.col];
    const image = document.createElement('img');
    image.src = `img/${item.item}.png`;
    image.className = 'grocery-item';
    cell.appendChild(image)

    image.addEventListener('mousedown', function(e) {
        // dont let player pick up from sorted shelves
        if(cell.classList.contains('completed') || isDragging){ return; }

        isDragging = true;
        // console.log('pick up:', item.item)
        itemInHand = item;
        draggingImage.classList.remove('hidden');
        draggingImage.src = `img/${itemInHand.item}.png`;
        draggingImage.style.cursor = 'grabbing';
        this.remove();
        // checkRoomOnShelf(cell)
    });
}

document.addEventListener('mousemove', function(e) {
    if(isDragging){
        draggingImage.style.left = (e.clientX - 25) + 'px';
        draggingImage.style.top = (e.clientY - 25) + 'px';
    }
});

function checkRoomOnShelf(shelf){
    if(shelf.childElementCount === 3){
        // console.log('shelf full')
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
    const shelves = document.querySelectorAll('td');
    shelves.forEach(shelf => {
        if(shelf.classList.contains('completed') && shelf.classList.contains('full')){ sorted++; }
    });
    if(sorted === groceryList.length/3){
        // console.log('you win!');
        document.querySelector('.win-msg').classList.remove('hidden')
    }
}