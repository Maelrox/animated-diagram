
function toggleConnectionMode() {
    isConnectionMode = !isConnectionMode;
    connectionStart = null;
    document.querySelector('button:last-child').style.backgroundColor = 
        isConnectionMode ? '#4CAF50' : '';
}

function toggleOrderEditMode() {
    isOrderEditMode = !isOrderEditMode;
    document.getElementById('edit-order-btn').style.backgroundColor = 
        isOrderEditMode ? '#4CAF50' : '';
    
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
    
    // Create input element for order editing
    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    foreignObject.setAttribute('width', '40');
    foreignObject.setAttribute('height', '20');
    foreignObject.style.display = 'none';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.padding = '0';
    input.style.margin = '0';
    input.style.border = '1px solid #666';
    input.style.borderRadius = '3px';
    foreignObject.appendChild(input);

    // Create direction controls
    const directionControls = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    directionControls.classList.add('direction-controls');
    //directionControls.style.display = 'none';
    
    // Forward button
    const directionBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    directionBtn.classList.add('direction-btn', 'forward-btn');
    directionBtn.innerHTML = `
        <circle cx="0" cy="0" r="8" fill="white" stroke="#666"/>
        <path d="M-4 0 L4 0 M1 -1 L4 0 L1 3" stroke="#666" fill="none"/>
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
        
    });

    // Handle direction button clicks
    directionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pathDirections.set(connection, 1);
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
    pathDirections.set(connection, 1);

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

function createDirectionControls(connection) {
    const controls = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    controls.classList.add('direction-controls');
    //controls.style.display = 'none';

    // Forward button
    const forwardBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    forwardBtn.innerHTML = `
        <circle cx="0" cy="0" r="8" fill="white" stroke="#666"/>
        <path d="M-4 0 L4 0 M1 -3 L4 0 L1 3" stroke="#666" fill="none"/>
    `;
    forwardBtn.classList.add('direction-btn', 'forward-btn');

    // Reverse button
    const reverseBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    reverseBtn.innerHTML = `
        <circle cx="0" cy="0" r="8" fill="white" stroke="#666"/>
        <path d="M4 0 L-4 0 M-1 -3 L-4 0 L-1 3" stroke="#666" fill="none"/>
    `;
    reverseBtn.classList.add('direction-btn', 'reverse-btn');

    controls.appendChild(forwardBtn);
    controls.appendChild(reverseBtn);

    // Add click handlers
    forwardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pathDirections.set(connection, 1);
        updateAnimationDirection(connection);
    });

    reverseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pathDirections.set(connection, -1);
        updateAnimationDirection(connection);
    });

    return controls;
}
