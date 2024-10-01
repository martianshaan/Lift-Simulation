
const buildingElement = document.getElementById('building');
const startButton = document.getElementById('startSimulation');
const numFloorsInput = document.getElementById('numFloors');
const numLiftsInput = document.getElementById('numLifts')

let prevFloor = 0;

const maxLiftsPerFloor = 2;
const liftsPerFloor = {};

// Constants
const FLOOR_HEIGHT = 150;
const LIFT_WIDTH = 120;
const LIFT_SPACING = 60;
const MAX_LIFTS_PER_FLOOR = 2;
const DOOR_OPERATION_TIME = 2500; // 2.5 seconds for doors to open/close

// State variables
let lifts = [];
let isLiftMoving = [];

const buttons = document.querySelectorAll("button");

startButton.addEventListener('click', () => {

    const numFloors = parseInt(numFloorsInput.value);
    const numLifts = parseInt(numLiftsInput.value);

    if (!numFloors && !numLifts) {
        alert('Please enter correct number to generate Floors and Lifts')
    } else if (numFloors <= 0 || numLifts <= 0) {
        alert('Only positive values are allowed')
    }

    buildingElement.innerHTML = ''

    updateBuildingSize(numFloors, numLifts);
    initializeLifts(numLifts, numFloors);
    createBuilding(numFloors);
    positionLifts(numLifts)


    function initializeLifts(numLifts, numFloors) {
        isLiftMoving = new Array(numLifts).fill(false);

        console.log('lifts', lifts);
        console.log('numLifts', numLifts);

        //logic to generate lifts
        for (let i = 0; i < numLifts; i++) {
            const lift = document.createElement('div');
            lift.classList.add(`lift${i + 1}`, 'lift');
            lift.innerHTML = `
            <div class="door left-door"></div>
            <div class="door right-door"></div>
            `;

            lift.setAttribute('data-floor', 0);
            lift.dataset.currentLocation = 0;
            lifts.push(lift);
            buildingElement.appendChild(lift);

            lift.style.left = `${i * (160) + 100}px`;
            lift.style.transform = 'translateY(0)';  // Set initial position to ground 
        }
    }

    function createBuilding(numFloors) {
        for (let i = numFloors ; i >= 0; i--) {
            const floor = document.createElement('div');
            floor.classList.add('floor');
            floor.id = `floor${i}`;

            const floorNumber = document.createElement('span');
            floorNumber.classList.add('floorNumber');
            floorNumber.textContent = `Floor ${i}`;


            const buttonGroup = document.createElement('div');
            buttonGroup.classList.add('buttonGroup');

            const upButton = document.createElement('button');
            upButton.classList.add('upButton');
            upButton.textContent = 'Up';
            upButton.addEventListener('click', (event) => handleLiftRequest(i, 'up'));

            const downButton = document.createElement('button');
            downButton.classList.add('downButton');
            downButton.textContent = 'Down';
            downButton.addEventListener('click', (event) => handleLiftRequest(i, 'down'));


            if (i === numFloors) {
                floor.appendChild(floorNumber);
                floor.appendChild(downButton);
            } else if (i === 0) {
                floor.appendChild(floorNumber);
                floor.appendChild(upButton);
            } else {
                floor.appendChild(floorNumber);
                buttonGroup.appendChild(upButton);
                buttonGroup.appendChild(downButton);
                floor.appendChild(buttonGroup);
            }

            buildingElement.appendChild(floor)

        }
    }

    function updateBuildingSize(numFloors, numLifts) {
        const building = document.querySelector('.building');
        const floorHeight = 150; // equal to height of each floor
        const liftWidth = 120; // width of each lift
        const spacing = 60; // spacing between lifts
        const buildingHeight = numFloors * floorHeight;
        let buildingWidth = 0;
        if (numLifts < 7) {
            buildingWidth = 1215
            console.log('width', buildingWidth);
        } else {
            buildingWidth = (liftWidth + spacing) * (numLifts - 1) + spacing;
            console.log('width', buildingWidth);
        }
        building.style.setProperty('--building-height', `${buildingHeight}px`);
        building.style.setProperty('--building-width', `${buildingWidth}px`);
        building.style.width = `${buildingWidth}px`; // Set the width 
    }

    function positionLifts(numLifts) {
        const lifts = document.querySelectorAll('.lift');
        const buildingWidth = parseInt(getComputedStyle(document.querySelector('.building')).width);
        const liftWidth = 120; // width of each lift
        const spacing = 40; // consistent with updateBuildingSize

        lifts.forEach((lift, index) => {
            const position = spacing + (index * (liftWidth + spacing));
            lift.style.setProperty('--lift-position', `${position}px`);
        });
    }


    function handleLiftRequest(targetFloor, direction) {
        const liftbutton = event.target;
        if (liftbutton.disabled) return;

        liftbutton.disabled = true;
        setTimeout(() => {
            liftbutton.disabled = false;
        }, 2000);

        // Initializing the count of lifts going to this floor
        liftsPerFloor[targetFloor] = (liftsPerFloor[targetFloor] || 0) + 1;

        if (liftsPerFloor[targetFloor] > maxLiftsPerFloor) {
            console.log(`Already ${maxLiftsPerFloor} lifts heading to floor ${targetFloor}`);
            liftsPerFloor[targetFloor]--;
            return;
        }

        let selectedLift = null;
        let minDistance = Infinity;

        lifts.forEach((lift, index) => {
            if (!isLiftMoving[index]) {
                const currentFloor = parseInt(lift.getAttribute('data-floor'));
                const distance = Math.abs(targetFloor - currentFloor);

                if (distance < minDistance) {
                    minDistance = distance;
                    selectedLift = index;
                }
            }
        });

        if (selectedLift != null) {
            moveLiftToNextFloor(selectedLift, targetFloor);
        } else {
            console.log('All lifts are currently busy');
            liftsPerFloor[targetFloor]--;
        }
    }

    function moveLiftToNextFloor(liftIndex, selectedFloor) {
        const lift = lifts[liftIndex];
        let currentFloor = parseInt(lift.getAttribute('data-floor'));

        let distance = Math.abs(selectedFloor - currentFloor);
        let duration = distance * 2;

        isLiftMoving[liftIndex] = true;

        lift.style.transition = `transform ${duration}s ease-in-out`;
        lift.style.transform = `translateY(-${selectedFloor * 150}px)`;
        lift.setAttribute('data-floor', selectedFloor);
        lift.classList.add("engaged");

        setTimeout(() => {
            openLiftDoors(lift);
        }, duration * 1000);

        setTimeout(() => {
            closeLiftDoors(lift);
            isLiftMoving[liftIndex] = false;
        }, duration * 1000);

        setTimeout(() => {
            lift.children[0].style.transform = "translateX(-100%)";
            lift.children[1].style.transform = "translateX(100%)";
        }, duration * 1000 + 1000);

        setTimeout(() => {
            lift.children[0].style.transform = "none";
            lift.children[1].style.transform = "none";
        }, duration * 1000 + 4000);

        // Remove the busy status
        setTimeout(() => {
            lift.classList.remove("engaged");
            isLiftMoving[liftIndex] = false;
            // Decrement the count of lifts for this floor when the lift arrives
            liftsPerFloor[selectedFloor]--;
        }, duration * 1000 + 5000);


    }

    function openLiftDoors(lift) {
        const leftDoor = lift.querySelector('.left-door');
        const rightDoor = lift.querySelector('.right-door');


        leftDoor.style.transition = 'transform 2.5s ease-in-out';
        rightDoor.style.transition = 'transform 2.5s ease-in-out';

        leftDoor.style.transform = 'translateX(-100%)';
        rightDoor.style.transform = 'translateX(100%)';

        leftDoor.classList.add('open-left');
        rightDoor.classList.add('open-right');

        console.log('Lift doors open');

    }

    function closeLiftDoors(lift) {
        const leftDoor = lift.querySelector('.left-door');
        const rightDoor = lift.querySelector('.right-door');

        leftDoor.style.transform = 'translateX(0)';
        rightDoor.style.transform = 'translateX(0)';

        leftDoor.classList.remove('open-left');
        rightDoor.classList.remove('open-right');

        console.log('Lift doors close');

    }

})
