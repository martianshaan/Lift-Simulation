let lift1 = document.querySelector(".lift1");
let lift2 = document.querySelector(".lift2");

const buildingElement=document.getElementById('building');
const startButton=document.getElementById('startSimulation');
const numFloorsInput=document.getElementById('numFloors');
const numLiftsInput=document.getElementById('numLifts')


const lifts = [];
let isLiftMoving = [];

const buttons = document.querySelectorAll("button");

//1
function initializeLifts() {
  lifts.push(lift1);
  lifts.push(lift2);
  isLiftMoving = new Array(lifts.length).fill(false);
}

initializeLifts();

//2
function handleButtonClick(event) {
  const floorNumber = getFloorNumberFromButton(event.target);
  handleLiftRequest(floorNumber);
}

//3
function getFloorNumberFromButton(button) {
  const floor = button.closest('.floor')
  return parseInt(floor.id.replace('floor', ''))
}

//4
function handleLiftRequest(targetFloor) {
  let selectedLift = null;
  let minDistance = Infinity;

  lifts.forEach((lift, index) => {
    if (!isLiftMoving[index]) {
      const currentFloor = parseInt(lift.getAttribute("data-floor")) || 1;
      const distance = Math.abs(targetFloor - currentFloor);
      if (distance < minDistance) {
        minDistance = distance;
        selectedLift = index;
      }
    }
  });

  if (selectedLift !== null) {
    moveLiftToFloor(selectedLift, targetFloor);
  } else {
    console.log("All lifts are currently busy.");
  }
}


function moveLiftToFloor(liftIndex, targetFloor) {
  const lift = lifts[liftIndex];
  const currentFloor = parseInt(lift.getAttribute("data-floor")) || 1;
  const distance = Math.abs(targetFloor - currentFloor);
  const duration = distance * 2;

  isLiftMoving[liftIndex] = true;

  lift.style.transition = `transform ${duration}s ease-in-out`;
  lift.style.transform = `translateY(-${(targetFloor - 1) * 150}px)`;
  lift.setAttribute("data-floor", targetFloor);

  setTimeout(() => {
    openLiftDoors(lift);
  }, duration * 1000);

  setTimeout(() => {
    closeLiftDoors(lift);
    isLiftMoving[liftIndex] = false;
  }, duration * 1000 + 3000);
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}
function openLiftDoors(lift) {
  const leftDoor = lift.querySelector(".left-door");
  const rightDoor = lift.querySelector(".right-door");

  leftDoor.classList.add("open-left");
  rightDoor.classList.add("open-right");

  console.log("Lift doors open");
  speak("Lift doors are opening")
}

function closeLiftDoors(lift) {
  const leftDoor = lift.querySelector(".left-door");
  const rightDoor = lift.querySelector(".right-door");

  leftDoor.classList.remove("open-left");
  rightDoor.classList.remove("open-right");
  console.log("Lift doors close");
  speak("Lift doors are closing")
}

//final step
document.addEventListener("DOMContentLoaded", () => {
  buttons.forEach((button) => {
    button.addEventListener("click", handleButtonClick);
  });
});
