let lift1 = document.querySelector(".lift1");
let lift2 = document.querySelector(".lift2");

const buildingElement = document.getElementById('building');
const startButton = document.getElementById('startSimulation');
const numFloorsInput = document.getElementById('numFloors');
const numLiftsInput = document.getElementById('numLifts')
// console.log('numLiftsInput', parseInt(numLiftsInput.value));


const lifts = [];
let isLiftMoving = [];
let prevFloor = 0;


const buttons = document.querySelectorAll("button");

startButton.addEventListener('click', () => {

    const numFloors = parseInt(numFloorsInput.value);
    const numLifts = parseInt(numLiftsInput.value);

    if (!numFloors && !numLifts) {
        alert('Please enter correct number to generate Floors and Lifts')
    } else if (numFloors > 15) {
        alert('Please enter floor number in range 1-15')
    } else if (numLifts > 4) {
        alert('Maximum Lifts allowed is 4 ')
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

        //lifts=[];
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

            lift.setAttribute('data-floor', 1);
            lift.dataset.currentLocation = 1;
            lifts.push(lift);
            buildingElement.appendChild(lift);

        }
    }

    function createBuilding(numFloors) {
        for (let i = numFloors; i >= 1; i--) {
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
            upButton.addEventListener('click', () => handleLiftRequest(i, 'up'));

            const downButton = document.createElement('button');
            downButton.classList.add('downButton');
            downButton.textContent = 'Down';
            downButton.addEventListener('click', () => handleLiftRequest(i, 'down'));


            if (i === numFloors) {
                floor.appendChild(floorNumber);
                floor.appendChild(downButton);
            } else if (i === 1) {
                floor.appendChild(floorNumber);
                floor.appendChild(upButton);
            } else {
                floor.appendChild(floorNumber);
                buttonGroup.appendChild(upButton);
                buttonGroup.appendChild(downButton);
                floor.appendChild(buttonGroup);
            }

            buildingElement.appendChild(floor);
        }
    }

    function updateBuildingSize(numFloors, numLifts) {
        const building = document.querySelector('.building');
        const floorHeight = 150; // eqaul to height of each floor
        // buildingWidth = 100; // base width + width for each lift
        const buildingHeight = numFloors * floorHeight;

        // building.style.setProperty('--building-width', `${buildingWidth}px`);
        building.style.setProperty('--building-height', `${buildingHeight}px`);
    }

    function positionLifts(numLifts) {
        const lifts = document.querySelectorAll('.lift');
        const buildingWidth = parseInt(getComputedStyle(document.querySelector('.building')).width);
        const liftWidth = 120; // width of each lift
        const spacing = (buildingWidth - (numLifts * liftWidth)) / (numLifts + 1);

        lifts.forEach((lift, index) => {
            const position = spacing + (index * (liftWidth + spacing));
            lift.style.setProperty('--lift-position', `${position}px`);
        });
    }


    function handleLiftRequest(targetFloor, direction) {
        let selectedLift = null;
        let minDistance = Infinity;

        lifts.forEach((lift, index) => {
            if (!isLiftMoving[index]) {
                const currentFloor = parseInt(lift.getAttribute('data-floor'));
                const distance = Math.abs(targetFloor - currentFloor);

                if (distance < minDistance) {
                    minDistance = distance;
                    selectedLift = index
                }
            }
        });

        if (selectedLift != null) {
            moveLiftToNextFloor(selectedLift, targetFloor)
        } else {
            console.log('All lifts are currently busy');
        }
    }

    function moveLiftToNextFloor(liftIndex, selectedFloor) {
        const lift = lifts[liftIndex];
        let currentFloor = parseInt(lift.getAttribute('data-floor'));

        let distance = Math.abs(selectedFloor - currentFloor);
        let duration = distance * 2;

        isLiftMoving[liftIndex] = true;

        lift.style.transition = `transform ${duration}s ease-in-out`;
        lift.style.transform = `translateY(-${(selectedFloor - 1) * 150}px)`;
        lift.setAttribute('data-floor', selectedFloor);
        lift.classList.add("engaged");

        setTimeout(() => {
            openLiftDoors(lift);
        }, duration * 1000);

        setTimeout(() => {
            closeLiftDoors(lift);
            isLiftMoving[liftIndex] = false;
        }, duration * 1000 );

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
        speak('Lift doors are opening');
    }

    function closeLiftDoors(lift) {
        const leftDoor = lift.querySelector('.left-door');
        const rightDoor = lift.querySelector('.right-door');

        leftDoor.style.transform = 'translateX(0)';
        rightDoor.style.transform = 'translateX(0)';

        leftDoor.classList.remove('open-left');
        rightDoor.classList.remove('open-right');

        console.log('Lift doors close');
        speak('Lift doors are closing');
    }

    // function speak(text) {
    //     const utterance = new SpeechSynthesisUtterance(text);
    //     speechSynthesis.speak(utterance);
    // }

})
