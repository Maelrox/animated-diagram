let selectedImage = null;

function addImage() {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    
    group.classList.add('image-group');
    image.setAttribute('href', "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Test.svg/2560px-Test.svg.png");
    image.setAttribute('x', '100');
    image.setAttribute('y', '100');
    image.setAttribute('width', '100');
    image.setAttribute('height', '100');
    image.style.cursor = 'grab';
    image.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => addImage(e.target.result);
            reader.readAsDataURL(file);
        }
    });
    
    rect.setAttribute('x', '190');
    rect.setAttribute('y', '190');
    rect.setAttribute('width', '7');
    rect.setAttribute('height', '7');
    rect.setAttribute('fill', 'white');
    rect.classList.add('grab');
    rect.addEventListener('mousedown', startResizeImage);
    
    group.appendChild(image);
    group.appendChild(rect);
    
    group.addEventListener('mousedown', startDragImage);
    group.addEventListener('click', handleImageClick);
    svg.appendChild(group);

    return group;
}

function startDragImage(event) {
    selectedImage = event.currentTarget;

    // Convert mouse coordinates to SVG coordinates
    const svgPoint = svg.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const transformedPoint = svgPoint.matrixTransform(svg.getScreenCTM().inverse());

    // Get the current transformation of the group (if any)
    const transform = selectedImage.transform.baseVal.consolidate();
    let currentX = 0, currentY = 0;
    if (transform) {
        currentX = transform.matrix.e;
        currentY = transform.matrix.f;
    }

    // Store the offset relative to the group's position
    offset = {
        x: transformedPoint.x - currentX,
        y: transformedPoint.y - currentY
    };

    svg.addEventListener('mousemove', dragImage);
    svg.addEventListener('mouseup', endDragImage);
}

function dragImage(event) {
    if (!selectedImage) return;

    // Convert mouse coordinates to SVG coordinates
    const svgPoint = svg.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const transformedPoint = svgPoint.matrixTransform(svg.getScreenCTM().inverse());

    // Apply transformation to the group
    selectedImage.setAttribute('transform', `translate(${transformedPoint.x - offset.x}, ${transformedPoint.y - offset.y})`);
}

function endDragImage() {
    svg.removeEventListener('mousemove', drag);
    svg.removeEventListener('mouseup', endDragImage);
    selectedImage = null;
}

function startResizeImage(event) {
    event.stopPropagation();
    selectedImage = event.target.parentNode.querySelector('image');
    svg.addEventListener('mousemove', resizeImage);
    svg.addEventListener('mouseup', endResizeImage);
}

function resizeImage(event) {
    if (!selectedImage) return;
    let newSize = event.clientX - selectedImage.getBoundingClientRect().x;
    selectedImage.setAttribute('width', newSize);
    selectedImage.setAttribute('height', newSize);
}

function endResizeImage() {
    svg.removeEventListener('mousemove', resize);
    svg.removeEventListener('mouseup', endResizeImage);
    selectedImage = null;
}

function handleImageClick(evt) {
    if (!isConnectionMode) return;
    
    // Make sure we're working with the image element
    const image = evt.currentTarget.querySelector('image');
    
    if (!connectionStart) {
        connectionStart = image;
        // Add visual feedback for selected image
        image.style.outline = '2px solid #4CAF50';
    } else {
        const connectionEnd = image;
        if (connectionStart !== connectionEnd) {
            createConnection(connectionStart, connectionEnd);
        }
        // Remove visual feedback
        connectionStart.style.outline = 'none';
        connectionStart = null;
    }
    selectedShape = image;
}