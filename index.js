const container = document.querySelector('.shelf-container');

const table = document.createElement('table');
const draggingImage = document.querySelector('.dragging-image');

table.border = '1';

const rows = 5;
const cols = 3;

const groceryList = ['carrot', 'beehive', 'bee'];
let items = [];
let itemInHand = {}

groceryList.forEach(item => {
    const image = document.createElement('img');
    image.src = `img/${item}.png`;
    image.className = 'grocery-item';
    items.push({item, row: 1, col: 2})
    console.log(items)
});

for (let i = 0; i < rows; i++) {
    const row = document.createElement('tr');

    for (let j = 0; j < cols; j++) {
        const cell = document.createElement('td');
        // cell.textContent = `row: ${i+1}| col: ${j+1}`;
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
                console.log(itemInHand)
                itemInHand = {}
                draggingImage.classList.add('hidden');
            }
                
            checkRoomOnShelf(cell);
        });
    }

    table.appendChild(row);
}

container.appendChild(table);

// place items on the shelves
let isDragging = false;
items.forEach(item => {
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
        isDragging = true;
        // console.log('pick up:', item.item)
        itemInHand = item;
        draggingImage.classList.remove('hidden');
        draggingImage.src = `img/${itemInHand.item}.png`;
        draggingImage.style.cursor = 'grabbing';
        this.remove();
        checkRoomOnShelf(cell)
    });
    
}

document.addEventListener('mousemove', function(e) {
    if(isDragging){
        console.log('moving item')
        draggingImage.style.left = (e.clientX - 25) + 'px';
        draggingImage.style.top = (e.clientY - 25) + 'px';
    }
});

function checkRoomOnShelf(shelf){
    if(shelf.childElementCount === 2){
        console.log('shelf full')
        shelf.classList.add('full')
    }else{
        shelf.classList.remove('full')
    }
}