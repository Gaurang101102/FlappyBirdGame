var GRAVITY = -0.1;
var JUMP_SPEED = 0.1;
const TIMER_INTERVAL_MS = 17;

const PIPE_PLACEMENT_RADIUS = 80 //metres, its the radius of the circle made by all the pipes
const NUM_PIPES = 16;
const PIPE_COLOUR = '#A52A2A';
const OVERALL_PIPES_HEIGHT = 30;//metres

var ANGULAR_SPEED = 7;//degrees per second. Its basically the speed of the bird.

var birdYAcceleration = GRAVITY;
var birdYSpeed = 0;
var birdY = Bird.getY();
var intervalsPerSecond = 1000 / TIMER_INTERVAL_MS;

var pipeObjects = [];
var pipeData = [];
var score = 0;
var gameIsEnded = true;

var currentDegrees = 10;
var nextPipeIndex = 1;

if (AFRAME.utils.device.isMobile()) {
    ParticleSystem.turnEmitterOff();
}

initGameMap();

window.requestAnimationFrame(gameLoop)

function gameLoop() {
    if (gameIsEnded == false) {

        if (score != 0 && score % 6 == 0) {
            ANGULAR_SPEED = ANGULAR_SPEED + 0.02;
            GRAVITY = GRAVITY - 0.001;
            JUMP_SPEED = JUMP_SPEED + 0.0005;
        }

        birdYSpeed = birdYSpeed + (GRAVITY / intervalsPerSecond)
        birdY = birdY + birdYSpeed;


        if (birdY <= 0.5) {
            birdY = 0.5;
            gameOver();
        }

        if (birdY >= OVERALL_PIPES_HEIGHT - 1) {
            birdY = OVERALL_PIPES_HEIGHT - 1;
        }
        Bird.setY(birdY);

        let pos = degreesToPosition(currentDegrees);
        Bird.setX(pos.x);
        Bird.setZ(pos.z);

        let rot = degreesToPlayerRotation(currentDegrees)
        Bird.setRotationY(rot.y);

        if (checkCollisions() == true) {
            gameOver();
        }

        currentDegrees = currentDegrees + (ANGULAR_SPEED / intervalsPerSecond);

    }
    window.requestAnimationFrame(gameLoop)/* recursion. Function calling itself
                                        to keep the animation going */
}

function gameOver() {
    CollisionSound.playSound();
    gameIsEnded = true;
    GameOverText.setText("You died! Tap or click anywhere to play again.")
    GameOverText.setVisible(true);
}

function degreesToPosition(degrees) {
    let radians = Hatch.degreesToRadians(degrees)
    let z = Math.cos(radians) * PIPE_PLACEMENT_RADIUS;
    let x = -1 * Math.sin(radians) * PIPE_PLACEMENT_RADIUS;
    return { x, z };
}

function degreesToPlayerRotation(degrees) {
    return { y: 90 - degrees };
}

function checkCollisions() {
    if (nextPipeIndex >= pipeData.length) {
        return false;
    }

    var upcomingPipeData = pipeData[nextPipeIndex]

    if (currentDegrees > upcomingPipeData.degrees) {
        incrementScore();
        nextPipeIndex++;

        if (nextPipeIndex >= pipeData.length) {
            nextPipeIndex = 0;
            currentDegrees = currentDegrees - 360;
        }

        ScorePointSound.playSound();

        return false;

    }

    if (currentDegrees > upcomingPipeData.degrees - 1) {
        var gapBottom = upcomingPipeData.gapStartY;
        var gapTop = upcomingPipeData.gapEndY;

        if (birdY > gapTop) {
            return true;
        }

        else if (birdY < gapBottom) {
            return true;
        }

        else {
            return false;

        }
    }

    return false; /* this one is executed when the bird is 
                      somewhere in the middle of two pipes as
                       during this time the condition of both 
                       if's is not satisfied. */


}

function incrementScore() {
    score = score + 1;
    ScoreText.setText(score + "")
}

function restartGame() {
    score = 0;
    ScoreText.setText(score + "");
    GRAVITY = -0.1;
    JUMP_SPEED = 0.1;
    ANGULAR_SPEED = 7;
    birdY = 15;
    birdYSpeed = 0;
    currentDegrees = 10;
    nextPipeIndex = 1;
    GameOverText.setVisible(false);
    gameIsEnded = false;
}

function doJump() {
    WingFlapSound.stopSound(); //In case the sound is already playing.
    WingFlapSound.playSound();
    birdYSpeed = JUMP_SPEED;
}

Hatch.onKeyDown(function (event) {

    if (event.key == ' ') {
        doJump();
    }
});


Hatch.onSceneClicked(function (event) {
    if (gameIsEnded == true) {
        restartGame();
    }
    else {
        doJump();
    }

});


Hatch.onSceneTouched(function (event) {

    if (gameIsEnded == true) {
        restartGame();
    }
    else {
        doJump();
    }

});



async function initGameMap() {
    var degreeInterval = 360 / NUM_PIPES;
    var degreeCounter = 0;
    var gap = 5;
    var radius = 2;

    var bottomPipe;
    var topPipe;


    for (var i = 0; i < NUM_PIPES; i++) {
        bottomPipe = await Hatch.createObject('cylinder');
        topPipe = await Hatch.createObject('cylinder');

        var pos = degreesToPosition(degreeCounter);

        bottomPipe.setX(pos.x);
        bottomPipe.setZ(pos.z);
        bottomPipe.setColor(PIPE_COLOUR);
        bottomPipe.setAttribute('geometry', 'radius', radius); /* 'radius' is  the name of the attribute 
                                                                     and radius is the variable. */

        topPipe.setX(pos.x);
        topPipe.setZ(pos.z);
        topPipe.setColor(PIPE_COLOUR);
        topPipe.setAttribute('geometry', 'radius', radius);


        var bottomHeight = Hatch.getRandomNumber(5, 20);
        var topHeight = OVERALL_PIPES_HEIGHT - (bottomHeight + gap);

        topPipe.setAttribute('geometry', 'height', topHeight);
        bottomPipe.setAttribute('geometry', 'height', bottomHeight);

        bottomPipe.setY(bottomHeight / 2);
        topPipe.setY((bottomHeight + gap) + topHeight / 2);

        pipeObjects[i] = {
            bottom: bottomPipe,
            top: topPipe
        };

        pipeData[i] = {

            degrees: degreeCounter,
            gapStartY: bottomHeight,
            gapEndY: bottomHeight + gap

        };

        degreeCounter += degreeInterval;


    }

}
