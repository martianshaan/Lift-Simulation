// DOM elements
const buildingElement = document.getElementById('building');
const startButton = document.getElementById('startSimulation');
const numFloorsInput = document.getElementById('numFloors');
const numLiftsInput = document.getElementById('numLifts');

// Constants
const FLOOR_HEIGHT = 150;
const LIFT_WIDTH = 120;
const LIFT_SPACING = 80;
const MAX_LIFTS_PER_FLOOR = 2;
const DOOR_OPERATION_TIME = 1600; // 2.5 seconds for doors to open/close

// State variables
let lifts = [];
let isLiftMoving = [];
let isLiftDoorOperating = [];
let liftQueues = [];
let liftsPerFloor = {};

startButton.addEventListener('click', () => {
    const numFloors = numFloorsInput.value;
    const numLifts = numLiftsInput.value;

    function isPositiveInteger(value) {
        return Number.isInteger(Number(value)) && Number(value) > 0;
    }

    // Updated validation to check for floating numbers and exponent values
    // if (Number.isFinite(numFloors) || Number.isFinite(value) || !Number.isInteger(value) || !isFinite(numLifts) || numFloors <= 0 || numLifts <= 0) {
    //     alert('Please enter valid positive numbers for Floors and Lifts');
    //     return;
    // }

    if (!isPositiveInteger(numFloors) || !isPositiveInteger(numLifts)) {
        alert('Please enter valid positive integers for Floors and Lifts');
        return ;
    }

    initializeSimulation(parseInt(numFloors), parseInt(numLifts));
});

function initializeSimulation(numFloors, numLifts) {
    buildingElement.innerHTML = '';
    lifts = [];
    isLiftMoving = new Array(numLifts).fill(false);
    liftQueues = Array.from({ length: numLifts }, () => []);
    liftsPerFloor = {};

    updateBuildingSize(numFloors, numLifts);
    createBuilding(numFloors);
    initializeLifts(numLifts, numFloors);
    positionLifts(numLifts);
}

function updateBuildingSize(numFloors, numLifts) {
    const buildingHeight = numFloors * FLOOR_HEIGHT;
    const buildingWidth = Math.max(1215, (LIFT_WIDTH + LIFT_SPACING) * numLifts + LIFT_SPACING);
    console.log('buildingWidth', buildingWidth)

    buildingElement.style.setProperty('--building-height', `${buildingHeight}px`);
    buildingElement.style.setProperty('--building-width', `${buildingWidth}px`);
    buildingElement.style.width = `${buildingWidth}px`;
}

function createBuilding(numFloors) {
    for (let i = numFloors; i >= 0; i--) {
        const floor = document.createElement('div');
        floor.classList.add('floor');
        floor.id = `floor${i}`;

        const floorNumber = document.createElement('span');
        floorNumber.classList.add('floorNumber');
        floorNumber.textContent = `Floor ${i}`;

        const buttonGroup = document.createElement('div');
        buttonGroup.classList.add('buttonGroup');

        if (i < numFloors) {
            const upButton = createButton('Up', () => handleLiftRequest(i, 'up'));
            upButton.classList.add('upButton');
            upButton.setAttribute('data-floor', i);
            upButton.textContent = 'Up';
            buttonGroup.appendChild(upButton);
        }

        if (i > 0) {
            const downButton = createButton('Down', () => handleLiftRequest(i, 'down'));
            downButton.classList.add('downButton');
            downButton.setAttribute('data-floor', i);
            downButton.textContent = 'Down';
            buttonGroup.appendChild(downButton);
        }

        floor.appendChild(floorNumber);
        floor.appendChild(buttonGroup);
        buildingElement.appendChild(floor);
    }
}

function createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
}


document.addEventListener("click", (e) => {
    if (e.target.classList.contains("upButton") || e.target.classList.contains("downButton")) {
        if (e.target.disabled) return;
        const clickedFloor = parseInt(e.target.getAttribute('data-floor'));


        console.log('floor', e.target.classList.contains('floor'));
        console.log(`Button clicked for floor ${clickedFloor}`);

        // Disable the button
        e.target.disabled = true;
        e.target.classList.add("buttonDisabled");
        console.log(`Button for floor ${clickedFloor} disabled`);

    }
});

function initializeLifts(numLifts, numFloors) {
    for (let i = 0; i < numLifts; i++) {
        const lift = document.createElement('div');
        lift.classList.add(`lift${i + 1}`, 'lift');
        lift.innerHTML = `
            <div class="door left-door"></div>
            <div class="door right-door"></div>
        `;

        lift.setAttribute('data-floor', '0');
        lift.style.transform = 'translateY(0)';

        lifts.push(lift);
        buildingElement.appendChild(lift);
    }
}

function positionLifts(numLifts) {
    // lifts.forEach((lift, index) => {
    //     const position = LIFT_SPACING + (index * (LIFT_WIDTH + LIFT_SPACING));
    //     lift.style.left = `${position}px`;
    // });
    const lifts = document.querySelectorAll('.lift');
    const buildingWidth = parseInt(getComputedStyle(document.querySelector('.building')).width);
    const liftWidth = 120; // width of each lift
    const spacing = 80; // consistent with updateBuildingSize

    lifts.forEach((lift, index) => {
        const position = spacing + (index * (liftWidth + spacing));
        lift.style.setProperty('--lift-position', `${position}px`);
    });
}

function handleLiftRequest(targetFloor, direction) {

    const buttonGroup = document.getElementById(`floor${targetFloor}`).querySelector('.buttonGroup');
    const button = direction === 'up' ? buttonGroup.querySelector('.upButton') : buttonGroup.querySelector('.downButton');

    // Check if the button is disabled
    if (button.disabled) {
        console.log(`Button for floor ${targetFloor} is disabled. Request ignored.`);
        return; // Exit if the button is disabled
    }

    const availableLifts = lifts.filter((_, index) => !isLiftMoving[index] && !isLiftDoorOperating[index]);

    if (availableLifts.length === 0) {
        console.log('All lifts are busy or have doors in operation. Request queued.');
        queueRequest(targetFloor, direction);
        return;
    }

    // Checking  if the target floor already has 2 lifts
    const liftsOnTargetFloor = lifts.filter(lift => parseInt(lift.getAttribute('data-floor')) === targetFloor);
    if (liftsOnTargetFloor.length >= MAX_LIFTS_PER_FLOOR) {
        console.log(`Cannot move lift to floor ${targetFloor}. Maximum lifts per floor reached.`);
        return;
    }

    const nearestLift = findNearestLift(availableLifts, targetFloor, direction);
    moveLiftToFloor(nearestLift, targetFloor, button);
}

function findNearestLift(availableLifts, targetFloor, direction) {
    return availableLifts.reduce((nearest, lift) => {
        const liftFloor = parseInt(lift.getAttribute('data-floor'));
        const distance = Math.abs(targetFloor - liftFloor);
        const nearestDistance = Math.abs(targetFloor - parseInt(nearest.getAttribute('data-floor')));

        if (distance < nearestDistance) {
            return lift;
        } else if (distance === nearestDistance) {
            // If distances are equal, prefer the lift going in the same direction
            const liftDirection = targetFloor > liftFloor ? 'up' : 'down';
            return liftDirection === direction ? nearest : lift;
        }
        return lifts.indexOf(lift) < lifts.indexOf(nearest) ? lift : nearest;;
    });
}

function queueRequest(targetFloor, direction) {
    const shortestQueue = liftQueues.reduce((shortest, queue, index) =>
        queue.length < liftQueues[shortest].length ? index : shortest, 0);
    liftQueues[shortestQueue].push({ targetFloor, direction });
}

function moveLiftToFloor(lift, targetFloor, button) {
    const liftIndex = lifts.indexOf(lift);
    const currentFloor = parseInt(lift.getAttribute('data-floor'));
    const distance = Math.abs(targetFloor - currentFloor);
    const duration = distance * 2; // 2 seconds per floor

    if (isLiftMoving[liftIndex] || isLiftDoorOperating[liftIndex]) {
        console.log('Lift is busy or doors are in operation. Request queued.');
        queueRequest(targetFloor, targetFloor > currentFloor ? 'up' : 'down');
        return;
    }


    isLiftMoving[liftIndex] = true;

    lift.style.transition = `transform ${duration}s ease-in-out`;
    lift.style.transform = `translateY(-${targetFloor * FLOOR_HEIGHT}px)`;
    lift.setAttribute('data-floor', targetFloor);

    // setTimeout(() => {
    //     openLiftDoors(lift);
    //     setTimeout(() => {
    //         closeLiftDoors(lift);
    //         isLiftMoving[liftIndex] = false;
    //         checkQueue(liftIndex);
    //     }, DOOR_OPERATION_TIME * 2);
    // }, duration * 1000);

    setTimeout(() => {

        if (button) {
            button.disabled = false;
            button.classList.remove("buttonDisabled");
        }

        isLiftMoving[liftIndex] = false;
        openLiftDoors(lift, liftIndex);
    }, duration * 1000);
}

function openLiftDoors(lift, liftIndex) {
    // const leftDoor = lift.querySelector('.left-door');
    // const rightDoor = lift.querySelector('.right-door');

    // leftDoor.style.transform = 'translateX(-100%)';
    // rightDoor.style.transform = 'translateX(100%)';
    isLiftDoorOperating[liftIndex] = true;
    const leftDoor = lift.querySelector('.left-door');
    const rightDoor = lift.querySelector('.right-door');


    leftDoor.style.transition = 'transform 2.5s ease-in-out';
    rightDoor.style.transition = 'transform 2.5s ease-in-out';

    leftDoor.style.transform = 'translateX(-100%)';
    rightDoor.style.transform = 'translateX(100%)';

    // leftDoor.classList.add('open-left');
    // rightDoor.classList.add('open-right');


    setTimeout(() => {
        closeLiftDoors(lift, liftIndex);
    }, DOOR_OPERATION_TIME);

    console.log('Lift doors are opening');
}

function closeLiftDoors(lift, liftIndex) {
    // const leftDoor = lift.querySelector('.left-door');
    // const rightDoor = lift.querySelector('.right-door');

    // leftDoor.style.transform = 'translateX(0)';
    // rightDoor.style.transform = 'translateX(0)';

    const leftDoor = lift.querySelector('.left-door');
    const rightDoor = lift.querySelector('.right-door');

    leftDoor.style.transform = 'translateX(0)';
    rightDoor.style.transform = 'translateX(0)';

    // leftDoor.classList.remove('open-left');
    // rightDoor.classList.remove('open-right');

    setTimeout(() => {
        isLiftDoorOperating[liftIndex] = false;
        checkQueue(liftIndex);
    }, DOOR_OPERATION_TIME);

    console.log('Lift doors close');
}

function checkQueue(liftIndex) {
    if (liftQueues[liftIndex].length > 0) {
        const nextRequest = liftQueues[liftIndex].shift();
        moveLiftToFloor(lifts[liftIndex], nextRequest.targetFloor);
    }
}