
function toggleConnectionMode() {
    isConnectionMode = !isConnectionMode;
    connectionStart = null;
    document.querySelector('button:last-child').style.backgroundColor = 
        isConnectionMode ? '#911a1a' : '';
}

function toggleOrderEditMode() {
    isOrderEditMode = !isOrderEditMode;
    document.getElementById('edit-order-btn').style.backgroundColor = 
        isOrderEditMode ? '#911a1a' : '';
    
    // Enable/disable pointer events on order numbers
    const orderTexts = document.querySelectorAll('.order-text');
    orderTexts.forEach(text => {
        text.style.pointerEvents = isOrderEditMode ? 'auto' : 'none';
    });
    const directionControls = document.querySelectorAll('.direction-controls');

    directionControls.forEach(control => {
        control.style.display = isOrderEditMode ? 'block' : 'none';
    })
}

function createConnection(start, end) {
    const connection = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    connection.classList.add('connection');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.classList.add('connection-path');
    path.setAttribute('marker-end', 'url(#arrow)');

    const orderText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    orderText.textContent = currentOrder++;
    orderText.classList.add('order-text');
    
    // input element for order editing
    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    foreignObject.setAttribute('width', '40');
    foreignObject.setAttribute('height', '20');
    foreignObject.style.display = 'none';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.classList.add('svg-input-order');
    foreignObject.appendChild(input);

    // Create direction controls
    const directionControls = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    directionControls.classList.add('direction-controls');
    directionControls.style.display = 'none';
    
    const directionBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    directionBtn.classList.add('direction-btn', 'forward-btn');
    directionBtn.innerHTML = `
        <circle cx="0" cy="0" r="8" fill="white" stroke="#fff"/>
        <path d="M-4 0 L4 0 M1 -1 L4 0 L1 3" stroke="#fff" fill="none"/>
    `;
    directionControls.appendChild(directionBtn);

    // Handle hover events on the path
    connection.addEventListener('mouseenter', (event) => {
        const pathElement = event.currentTarget.querySelector('.connection-path');
        const bbox = pathElement.getBBox();
        const midX = bbox.x + bbox.width / 2;
        const midY = bbox.y + bbox.height / 2;
        
        // Position the controls
        directionBtn.setAttribute('transform', `translate(${midX + 20}, ${midY})`);
        directionControls.style.display = 'block';
    });

    // Handle direction button clicks
    directionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateAnimationDirection(connection);
    });

    // Handle order text click
    orderText.addEventListener('click', (event) => {
        if (!isOrderEditMode) return;
        
        const bbox = orderText.getBBox();
        foreignObject.setAttribute('x', bbox.x - 5);
        foreignObject.setAttribute('y', bbox.y - 5);
        foreignObject.style.display = 'block';
        input.value = orderText.textContent;
        input.focus();
    });

    // Handle input blur and enter
    input.addEventListener('blur', finishEditing);
    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') finishEditing();
    });

    function finishEditing() {
        const newOrder = parseInt(input.value) || 1;
        orderText.textContent = newOrder;
        foreignObject.style.display = 'none';
        
        // Update connection order
        const conn = connections.find(c => c.element === connection);
        if (conn) {
            conn.order = newOrder;
        }
        
        // Restart animations
        stopAnimations();
        setTimeout(() => loopAnimations(), 100);
    }

    connection.appendChild(path);
    connection.appendChild(orderText);
    connection.appendChild(foreignObject);
    connection.appendChild(directionControls);
    
    svg.insertBefore(connection, svg.firstChild);

    const connObj = {
        element: connection,
        start: start,
        end: end,
        order: parseInt(orderText.textContent)
    };
    
    connections.push(connObj);
    updateConnections();
    addFlowAnimation(connection);
}

function updateConnections() {
    connections.forEach(conn => {
        const startPos = getShapeCenter(conn.start);
        const endPos = getShapeCenter(conn.end);
        
        const path = conn.element.querySelector('path');
        const orderText = conn.element.querySelector('.order-text');
        
        path.setAttribute('d', `M ${startPos.x} ${startPos.y} L ${endPos.x} ${endPos.y}`);
        orderText.setAttribute('d', `M ${startPos.x} ${startPos.y} L ${endPos.x} ${endPos.y}`);

        const midX = (startPos.x + endPos.x) / 2;
        const midY = (startPos.y + endPos.y) / 2;
        orderText.setAttribute('x', midX);
        orderText.setAttribute('y', midY - 8);
    });
}

function getShapeCenter(element) {
    if (element.tagName === 'image') {
        // For images, we need to consider the group transformation
        const group = element.parentNode;
        const image = group.querySelector('image');
        
        // Get base position and dimensions
        const x = parseFloat(image.getAttribute('x'));
        const y = parseFloat(image.getAttribute('y'));
        const width = parseFloat(image.getAttribute('width'));
        const height = parseFloat(image.getAttribute('height'));
        
        // Calculate center point
        let centerX = x + width / 2;
        let centerY = y + height / 2;
        
        // Apply group transformation if it exists
        const transform = group.getAttribute('transform');
        if (transform) {
            const match = transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
            if (match) {
                centerX += parseFloat(match[1]);
                centerY += parseFloat(match[2]);
            }
        }
        
        return { x: centerX, y: centerY };
    } else {
        // For regular shapes, use existing logic
        const bbox = element.getBBox();
        return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
    }
}