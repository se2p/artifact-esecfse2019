/* eslint-disable eqeqeq */
/* eslint-disable no-loop-func */
/* eslint-disable max-len */

// ==================== Helper Functions =======================================

const isBowl = sprite => sprite.name.toLowerCase().match(/bowl/);
const isApple = sprite => sprite.name.toLowerCase().match(/(apfel|apple)/);
const isBanana = sprite => sprite.name.toLowerCase().match(/banan/);
const isTime = sprite => sprite.name.toLowerCase().match(/(zeit|time)/);
const isScore = sprite => sprite.name.toLowerCase().match(/(punkt|point|score)/);
const gameOverRegex = /(end|over)/;

/**
 * Retrieves requested sprites and variables used in the program by their name.
 * @param {TestDriver} t The test driver.
 * @param {string[]} request A list containing the names of sprites to retrieve.
 * @return {{stage: Sprite, bowl: Sprite, apple: Sprite, banana: Sprite, time: Variable, score: Variable}}
 *         The sprites and variables.
 */
const getSpritesAndVariables = function (t, request) {
    const rv = {};
    rv.stage = t.getStage();

    if (request.indexOf('bowl') !== -1) {
        rv.bowl = t.getSprites(s => s.isOriginal && isBowl(s))[0];
        t.assume.ok(typeof rv.bowl !== 'undefined', 'Could not find sprite bowl.');
    }

    if (request.indexOf('apple') !== -1) {
        rv.apple = t.getSprites(s => s.isOriginal && isApple(s))[0];
        t.assume.ok(typeof rv.apple !== 'undefined', 'Could not find sprite apple.');
    }

    if (request.indexOf('banana') !== -1) {
        rv.banana = t.getSprites(s => s.isOriginal && isBanana(s))[0];
        t.assume.ok(typeof rv.banana !== 'undefined', 'Could not find sprite banana.');
    }

    if (request.indexOf('time') !== -1) {
        rv.time = rv.stage.getVariables(isTime)[0];
        t.assume.ok(typeof rv.time !== 'undefined', 'Could not find variable time.');
    }

    if (request.indexOf('score') !== -1) {
        rv.score = rv.stage.getVariables(isScore)[0];
        t.assume.ok(typeof rv.score !== 'undefined', 'Could not find variable score.');
    }

    return rv;
};

/**
 * Follows a sprite with the bowl by simulating left and right arrow key presses.
 * Tries to move the bowl to the same x position as the sprite.
 * Works with "good" movement (i.e. "if key pressed" in a loop) and "bad" movement (i.e. "when key pressed" hats).
 * @param {TestDriver} t The test driver.
 * @param {number} bowlX The x coordinate of the bowl,
 * @param {number} spriteX The x coordinate of the sprite to follow.
 */
const followSprite = function (t, bowlX, spriteX) {
    /* Stop if the bowl is near enough. */
    if (Math.abs(bowlX - spriteX) <= 10) {
        if (t.isKeyDown('Left')) {
            t.inputImmediate({device: 'keyboard', key: 'Left', isDown: false});
        }
        if (t.isKeyDown('Right')) {
            t.inputImmediate({device: 'keyboard', key: 'Right', isDown: false});
        }

    } else if (bowlX > spriteX) {
        t.inputImmediate({device: 'keyboard', key: 'Right', isDown: false});
        t.inputImmediate({device: 'keyboard', key: 'Left', isDown: true});

        /* Trick "when key pressed" hats to fire by letting go of the key and immediately pressing it again. */
        t.inputImmediate({device: 'keyboard', key: 'Left', isDown: false});
        t.inputImmediate({device: 'keyboard', key: 'Left', isDown: true});

    } else if (bowlX < spriteX) {
        t.inputImmediate({device: 'keyboard', key: 'Left', isDown: false});
        t.inputImmediate({device: 'keyboard', key: 'Right', isDown: true});

        /* Trick "when key pressed" hats to fire by letting go of the key and immediately pressing it again. */
        t.inputImmediate({device: 'keyboard', key: 'Right', isDown: false});
        t.inputImmediate({device: 'keyboard', key: 'Right', isDown: true});
    }
};

/**
 * Returns the newest clone of the given sprite/clone, or the sprite/clone itself, if it is the newest clone or there
 * are no clones of the sprite.
 * @param {Sprite} sprite The sprite.
 * @return {Sprite} The newest clone of the given sprite.
 */
const getNewestClone = function (sprite) {
    const newClones = sprite.getNewClones();
    if (newClones.length) {
        /* There should not be more than one new clone after one execution step. */
        return newClones[0];
    }
    return sprite;
};

/**
 * Checks if a given sprite touches the bowl or the ground (red line).
 * @param {Sprite} sprite The sprite.
 * @param {Sprite} bowl The bowl.
 * @return {(string|boolean)} 'bowl', 'ground' or false, depending on if the sprite touches the bowl, ground or nothing.
 */
const spriteTouchingGround = function (sprite, bowl) {
    if (sprite.visible && sprite.exists) {
        if (sprite.isTouchingColor([255, 0, 0])) {
            return 'ground';
        } else if (sprite.isTouchingSprite(bowl.name)) {
            return 'bowl';
        }
    }
    return 'nothing';
};

/**
 * Asserts that the game is over by checking that no apple or banana moved and no variable changed in the last step.
 * @param {TestDriver} t The test driver.
 * @param {Sprite} apple And apple sprite from the game.
 * @param {Sprite} banana And apple sprite from the game.
 * @param {Variable} time The time variable from the game.
 * @param {Variable} score The score variable from the game.
 */
const assertGameOver = function (t, apple, banana, time, score) {
    for (const appleInstance of apple.getClones(true)) {
        t.assert.equal(appleInstance.x, appleInstance.old.x,
            'Apple must not move after game is over (should be over).');
    }
    for (const bananaInstance of banana.getClones(true)) {
        t.assert.equal(bananaInstance.x, bananaInstance.old.x,
            'Bananas must not move after game is over (should be over).');
    }
    t.assert.equal(time.value, time.old.value, 'Time must not change after game is over (should be over).');
    t.assert.equal(score.value, score.old.value, 'Score must not change after game is over (should be over).');
};

const test = async function (t) {
    t.seedScratch('seed');

    let {bowl, apple, banana, time, score} = getSpritesAndVariables(t, ['bowl', 'apple', 'banana', 'time', 'score']);
    const stageBorder = (t.getStageSize().width / 2) - 50;

    t.onConstraintFailure('nothing');

    /* Give the program some time to initialize. */
    await t.runForTime(500);

    const bowlInitCorrect = (bowl.x === 0 && bowl.y === -145);

    // ==================== Information Tracking ===================================

    let gameOver = false;
    t.addCallback(() => {
        if (t.getRunTimeElapsed() >= 25000) {
            gameOver = true;
        }
    });

    /* Track when which fruit touched which object (nothing, bowl, ground). */
    const appleTouched = [{
        object: spriteTouchingGround(apple, bowl),
        time: t.getRunTimeElapsed(),
        score: score.value
    }];
    const bananaTouched = [{
        object: spriteTouchingGround(banana, bowl),
        time: t.getRunTimeElapsed(),
        score: score.value
    }];
    t.onSpriteMoved(sprite => {
        const spriteIsApple = isApple(sprite);
        const spriteIsBanana = isBanana(sprite);
        if (spriteIsApple || spriteIsBanana) {
            const spriteTouched = spriteIsApple ? appleTouched : bananaTouched;
            const spriteTouching = spriteTouchingGround(sprite, bowl);
            if (spriteTouching !== spriteTouched[spriteTouched.length - 1].object) {
                spriteTouched.unshift({ // unshift instead of push so we can iterate backwards with a for-each loop
                    object: spriteTouching,
                    time: t.getRunTimeElapsed(),
                    score: score.value
                });
                if (spriteIsApple && spriteTouching == 'ground') {
                    gameOver = true;
                }
            }
        }
    });

    /* Track the spawn position of fruits. */
    let oldApples = t.getSprites(sprite => sprite.visible && isApple(sprite) && sprite.y > 100);
    let oldBananas = t.getSprites(sprite => sprite.visible && isApple(sprite) && sprite.y > 100);
    const appleSpawnPositions = [];
    const bananaSpawnPositions = [];
    t.addCallback(() => {
        let apples = t.getSprites(sprite => isApple(sprite) && sprite.visible && sprite.y > 100);
        let bananas = t.getSprites(sprite => isBanana(sprite) && sprite.visible && sprite.y > 100);

        for (const _apple of [...apples]) {
            apples = apples.filter(s => s === _apple || (s.x !== _apple.x && s.y !== _apple.y));
        }
        for (const _banana of [...bananas]) {
            bananas = bananas.filter(s => s === _banana || (s.x !== _banana.x && s.y !== _banana.y));
        }

        for (const _apple of apples) {
            if (oldApples.indexOf(_apple) === -1) {
                appleSpawnPositions.push(_apple.pos);
            }
        }
        for (const _banana of bananas) {
            if (oldBananas.indexOf(_banana) === -1) {
                bananaSpawnPositions.push(_banana.pos);
            }
        }

        oldApples = apples;
        oldBananas = bananas;
    });


    /* Track if apples / bananas fall at all. */
    let appleFellTimestamp = -1;
    let bananaFellTimestamp = -1;
    t.addCallback(() => {
        if (apple.y !== apple.old.y) {
            appleFellTimestamp = t.getRunTimeElapsed();
        }
        if (banana.y !== banana.old.y) {
            bananaFellTimestamp = t.getRunTimeElapsed();
        }
    });

    /* Track if the time ever changed. */
    let timeChanged = false;
    t.addCallback(() => {
        if (time.value !== time.old.value) {
            timeChanged = true;
        }
    });

    // ==================== Constraints ============================================

    const constraints = [];

    // -------------------- Initialization -----------------------------------------

    const timerInit = t.addConstraint(() => {
        if (t.getRunTimeElapsed() < 400) {
            t.assert.ok(Number(time.value) === 29 || Number(time.value) === 30, 'Timer must start at 30');
        }
    }, 'Timer Initialization Constraint');
    constraints.push(timerInit);

    const bowlInit = t.addConstraint(() => {
        /* Placeholder because this is checked in the end.
         * We can't check the initialization of the bowl position during the run,
         * because inputs may be simulated immediately. */
    }, 'Bowl Initialization Constraint');
    constraints.push(bowlInit);

    const fruitSize = t.addConstraint(() => {
        t.assert.equal(apple.size, 50, 'Apples must have a size of 50%');
        t.assert.equal(banana.size, 50, 'Bananas must have a size of 50%');
    }, 'Fruit Size Constraint');
    constraints.push(fruitSize);

    // -------------------- Bowl Movement ------------------------------------------

    const bowlMove = t.addConstraint(() => {
        if (!gameOver &&
            bowl.x <= stageBorder &&
            bowl.x >= -stageBorder) {
            const leftDown = t.isKeyDown('left arrow');
            const rightDown = t.isKeyDown('right arrow');

            if (leftDown && !rightDown) {
                t.assert.less(bowl.x, bowl.old.x, 'Bowl must move left when left arrow key is pressed.');
            } else if (rightDown && !leftDown) {
                t.assert.greater(bowl.x, bowl.old.x, 'Bowl must move right when right arrow key is pressed.');
            } else if (!leftDown && !rightDown) {
                t.assert.equal(bowl.x, bowl.old.x, 'Bowl must not move when no arrow key is pressed.');
            }

            t.assert.equal(bowl.y, bowl.old.y, 'Bowl must never move vertically.');
        }
    }, 'Bowl Movement Constraint');
    constraints.push(bowlMove);

    const bowlMoveDetails = t.addConstraint(() => {
        if (!gameOver &&
            bowl.x <= stageBorder &&
            bowl.x >= -stageBorder) {

            const leftDown = t.isKeyDown('left arrow');
            const rightDown = t.isKeyDown('right arrow');

            if (leftDown && !rightDown) {
                t.assert.equal(bowl.x, bowl.old.x - 10,
                    'Bowl must move left with a speed of 10 when left arrow key is pressed.');
            } else if (rightDown && !leftDown) {
                t.assert.equal(bowl.x, bowl.old.x + 10,
                    'Bowl must move right with a speed of 10 when right arrow key is pressed.');
            } else if (!leftDown && !rightDown) {
                t.assert.equal(bowl.x, bowl.old.x, 'Bowl must not move when no arrow key is pressed.');
            }

            t.assert.equal(bowl.y, bowl.old.y, 'Bowl must never move vertically.');
        }
    }, 'Bowl Movement Details Constraint');
    constraints.push(bowlMoveDetails);

    // -------------------- Fruit Falling ------------------------------------------

    const appleFalling = t.addConstraint(() => {
        /* Placeholder because this is checked in the end. */
    }, 'Apple Falling Constraint');
    constraints.push(appleFalling);

    const appleFallingDetails = t.addConstraint(() => {
        t.assert.ok(apple.y === apple.old.y ||
            apple.y - apple.old.y === -5 || // apple falling down
            apple.y - apple.old.y > 100, // apple teleported up after touching bowl / ground
        'Apple must fall down in steps of size 5.');
        if (apple.y < apple.old.y) {
            t.assert.equal(apple.x, apple.old.x, 'Apple must fall down in a straight line.');
        }
    }, 'Apple Falling Details');
    constraints.push(appleFallingDetails);

    const bananaFalling = t.addConstraint(() => {
        /* Placeholder because this is checked in the end. */
    }, 'Banana Falling Constraint');
    constraints.push(bananaFalling);

    const bananaFallingDetails = t.addConstraint(() => {
        t.assert.ok(banana.y === banana.old.y ||
            banana.y - banana.old.y === -7 || // banana falling down
            banana.y - banana.old.y > 100, // banana teleported up after touching bowl / ground
        'Banana must fall down in steps of size 7.');
        if (banana.y < banana.old.y) {
            t.assert.equal(banana.x, banana.old.x, 'Banana must fall down in a straight line.');
        }
    }, 'Banana Falling Details');
    constraints.push(bananaFallingDetails);

    // -------------------- Fruit Spawn --------------------------------------

    const appleSpawn = t.addConstraint(() => {
        /* Placeholder because this is checked in the end. */
    }, 'Apple Spawn Constraint');
    constraints.push(appleSpawn);

    const appleSpawnRandomXPosition = t.addConstraint(() => {
        if (appleSpawnPositions.length >= 3) {
            const firstAppleX = appleSpawnPositions[0].x;
            let positionsDiffer = false;

            for (const pos of appleSpawnPositions) {
                if (pos.x !== firstAppleX) {
                    positionsDiffer = true;
                }
            }

            t.assert.ok(positionsDiffer, 'Apples must spawn at random x positions.');
        }
    }, 'Apple Spawn Random X Position Constraint');
    constraints.push(appleSpawnRandomXPosition);

    const appleSpawnYPosition = t.addConstraint(() => {
        for (const applePos of appleSpawnPositions) {
            t.assert.ok(applePos.y === 170 || applePos.y === 165, 'Apples must spawn at y = 170.');
        }
    }, 'Apple Spawn Y Position Constraint');
    constraints.push(appleSpawnYPosition);

    const bananaSpawn = t.addConstraint(() => {
        /* Placeholder because this is checked in the end. */
    }, 'Banana Spawn Constraint');
    constraints.push(bananaSpawn);

    const bananaSpawnRandomXPosition = t.addConstraint(() => {
        if (bananaSpawnPositions.length >= 3) {
            const firstBananaX = bananaSpawnPositions[0].x;
            let positionsDiffer = false;

            for (const pos of bananaSpawnPositions) {
                if (pos.x !== firstBananaX) {
                    positionsDiffer = true;
                }
            }

            t.assert.ok(positionsDiffer, 'Bananas must spawn at random x positions.');
        }
    }, 'Banana Spawn Random X Position Constraint');
    constraints.push(bananaSpawnRandomXPosition);

    const bananaSpawnYPosition = t.addConstraint(() => {
        for (const bananaPos of bananaSpawnPositions) {
            t.assert.ok(bananaPos.y === 170 || bananaPos.y === 163, 'Bananas must spawn at y = 170.');
        }
    }, 'Banana Spawn Y Position Constraint');
    constraints.push(bananaSpawnYPosition);

    const onlyOneApple = t.addConstraint(() => {
        const apples = t.getSprites(s => s.visible && isApple(s));
        if (apples.length > 2) {
            const fruitPos = apples[0].pos;
            for (let i = 1; i < apples.length; i++) {
                t.assert.ok(apples[i].x === fruitPos.x && apples[i].y === fruitPos.y,
                    'There can only be one apple on the screen at a time.');
            }
        }
    }, 'Only One Apple Constraint');
    constraints.push(onlyOneApple);

    const onlyOneBanana = t.addConstraint(() => {
        const bananas = t.getSprites(s => s.visible && isBanana(s));
        if (bananas.length > 2) {
            const fruitPos = bananas[0].pos;
            for (let i = 1; i < bananas.length; i++) {
                t.assert.ok(bananas[i].x === fruitPos.x && bananas[i].y === fruitPos.y,
                    'There can only be one banana on the screen at a time.');
            }
        }
    }, 'Only One Banana Constraint');
    constraints.push(onlyOneBanana);

    const bananaDelayBeginning = t.addConstraint(() => {
        if (t.getRunTimeElapsed() < 400) {
            t.assert.equal(banana.y, banana.old.y,
                'Banana must not fall in the first second.');
            t.assert.ok(!banana.visible,
                'Banana must be invisible for the first second.');
        }
    }, 'Banana Beginning Delay Constraint');
    constraints.push(bananaDelayBeginning);

    let checkedBananaDelayRespawn = false;
    const bananaDelayRespawn = t.addConstraint(() => {
        const timeElapsed = t.getRunTimeElapsed();
        if (!gameOver) {
            for (const touched of bananaTouched) {
                if (timeElapsed - touched.time >= 1800) {
                    break;
                } else if (touched.object === 'ground' && timeElapsed - touched.time >= 1200) {
                    t.assert.equal(banana.y, banana.old.y,
                        'Banana must not fall for a second after it spawned.');
                    t.assert.ok(!banana.visible,
                        'Banana must be invisible for a second after it spawned.');
                    checkedBananaDelayRespawn = true;
                    break;
                }
            }
        }
    }, 'Banana Respawn Delay Constraint');
    constraints.push(bananaDelayRespawn);

    // -------------------- Fruit Interaction ---------------------------------

    let checkedApplePoints = false;
    const applePoints = t.addConstraint(() => {
        const timeElapsed = t.getRunTimeElapsed();
        if (!gameOver) {
            for (const touched of appleTouched) {
                if (timeElapsed - touched.time >= 200) {
                    break;
                } else if (touched.object === 'bowl' && timeElapsed - touched.time >= 100) {
                    if (Math.abs(timeElapsed - bananaTouched[0].time) >= 200) {
                        checkedApplePoints = true;
                        t.assert.ok(Number(score.value) === Number(touched.score) + 5,
                            'Apples must give 5 points when they hit the bowl.');
                        break;
                    }
                }
            }
        }
    }, 'Apple Points Constraint');
    constraints.push(applePoints);

    let checkedAppleGameOver = false;
    const appleGameOver = t.addConstraint(() => {
        const timeElapsed = t.getRunTimeElapsed();
        if (timeElapsed <= 25000) {
            for (const touched of appleTouched) {
                if (timeElapsed - touched.time >= 4000) {
                    break;
                } else if (touched.object === 'ground' && timeElapsed - touched.time >= 3000) {
                    checkedAppleGameOver = true;
                    assertGameOver(t, apple, banana, time, score);
                    break;
                }
            }
        }
    }, 'Apple Game Over Constraint');
    // constraints.push(appleGameOver);

    let checkedAppleGameOverMessage = false;
    const appleGameOverMessage = t.addConstraint(() => {
        const timeElapsed = t.getRunTimeElapsed();
        if (timeElapsed <= 25000) {
            for (const touched of appleTouched) {
                if (timeElapsed - touched.time >= 600) {
                    break;
                } else if (touched.object === 'ground' && timeElapsed - touched.time >= 500) {
                    checkedAppleGameOverMessage = true;
                    t.assert.ok(apple.sayText, 'Apple must display a message if it hits the ground.');
                    t.assert.matches(apple.sayText.toLowerCase(), gameOverRegex,
                        'Apple must display \'Game over!\' when an it hits the ground.');
                }
            }
        }
    }, 'Apple Game Over Message Constraint');
    // constraints.push(appleGameOverMessage);

    let checkedBananaBowlPoints = false;
    const bananaBowlPoints = t.addConstraint(() => {
        const timeElapsed = t.getRunTimeElapsed();
        if (!gameOver) {
            for (const touched of bananaTouched) {
                if (timeElapsed - touched.time >= 200) {
                    break;
                } else if (touched.object === 'bowl' && timeElapsed - touched.time >= 100) {
                    if (Math.abs(timeElapsed - appleTouched[0].time) >= 200) {
                        checkedBananaBowlPoints = true;
                        t.assert.ok(Number(score.value) === Number(touched.score) + 8,
                            'Bananas must give 8 points when they hit the bowl.');
                        break;
                    }
                }
            }
        }
    }, 'Banana Bowl Points Constraint');
    constraints.push(bananaBowlPoints);

    let checkedBananaGroundPoints = false;
    const bananaGroundPoints = t.addConstraint(() => {
        const timeElapsed = t.getRunTimeElapsed();
        if (!gameOver) {
            for (const touched of bananaTouched) {
                if (timeElapsed - touched.time >= 200) {
                    break;
                } else if (touched.object === 'ground' && timeElapsed - touched.time >= 100) {
                    checkedBananaGroundPoints = true;
                    if (Math.abs(timeElapsed - appleTouched[0].time) >= 200) {
                        t.assert.ok(Number(score.value) === Number(touched.score) - 8,
                            'Bananas must subtract 8 points when they hit the floor.');
                    }
                }
            }
        }
    }, 'Banana Ground Points Constraint');
    constraints.push(bananaGroundPoints);

    let checkedBananaGroundMessage = false;
    const bananaGroundMessage = t.addConstraint(() => {
        const timeElapsed = t.getRunTimeElapsed();
        if (!gameOver) {
            for (const touched of bananaTouched) {
                if (timeElapsed - touched.time >= 600) {
                    break;
                } else if (touched.object === 'ground' && timeElapsed - touched.time >= 500) {
                    checkedBananaGroundMessage = true;
                    t.assert.ok(banana.sayText, 'Banana must display a message when it hits the ground.');
                    t.assert.matches(banana.sayText, /-\s?8/, 'Banana must display \'-8\' when it hits the ground.');
                }
            }
        }
    }, 'Banana Ground Message Constraint');
    constraints.push(bananaGroundMessage);

    // -------------------- Timer --------------------------------------------------

    const timerTick = t.addConstraint(() => {
        if (!gameOver) {
            t.assert.ok(time.value == time.old.value || time.value == time.old.value - 1, 'Time must only tick down.');
        }
    }, 'Timer Tick Constraint');
    constraints.push(timerTick);

    const timerGameOver = t.addConstraint(() => {
        const timeElapsed = t.getRunTimeElapsed();
        if (timeElapsed >= 35000) {
            assertGameOver(t, apple, banana, time, score);
        } else if (timeElapsed >= 30000) {
            t.assert.ok(appleFellTimestamp >= 20000 || bananaFellTimestamp >= 20000,
                'The game must run for at least 20 seconds.');
        }
    }, 'Timer Game Over Constraint');
    constraints.push(timerGameOver);

    let bowlMessageTimestamp;
    const timerGameOverMessage = t.addConstraint(() => {
        if (typeof bowlMessageTimestamp === 'undefined') {
            if (bowl.sayText) {
                bowlMessageTimestamp = t.getRunTimeElapsed();
                t.assert.greaterOrEqual(bowlMessageTimestamp, 20000,
                    'Bowl must not display a message before 20 seconds.');
            } else {
                t.assert.lessOrEqual(t.getRunTimeElapsed(), 35000, 'Bowl must display a message after 30 seconds.');
            }
        } else {
            const timeElapsed = t.getRunTimeElapsed();
            if (timeElapsed - bowlMessageTimestamp >= 500 && timeElapsed - bowlMessageTimestamp <= 600) {
                t.assert.ok(bowl.sayText, 'Bowl must display a message when the time is up.');
                t.assert.matches(bowl.sayText.toLowerCase(), gameOverRegex,
                    'Bowl must display \'Ende!\' when the time is up.');
            }
        }
    }, 'Timer Game Over Message Constraint');
    constraints.push(timerGameOverMessage);

    // ==================== Test ===================================================

    /* Catch apples with the bowl. Always use the newest apple and banana if clones are used. */
    t.addCallback(() => {
        followSprite(t, bowl.x, apple.x);
        apple = getNewestClone(apple);
        banana = getNewestClone(banana);
    });

    await t.runForTime(40000);

    // ==================== Filter Constraints =====================================

    if (!bowlInitCorrect) {
        bowlInit.disable();
    }

    if (appleFellTimestamp === -1) {
        appleFalling.disable();
        appleFallingDetails.disable();
        appleFallingDetails.skip = 'Apple did not fall';
    }

    if (bananaFellTimestamp === -1) {
        bananaFalling.disable();
        bananaFallingDetails.disable();
        bananaFallingDetails.skip = 'Banana did not fall.';
        bananaDelayBeginning.disable();
    }

    if (appleSpawnPositions.length < 2) {
        appleSpawn.disable();
        appleSpawnRandomXPosition.disable();
        appleSpawnRandomXPosition.skip = 'Too few apples spawned.';
        appleSpawnYPosition.disable();
        appleSpawnYPosition.skip = 'Too few apples spawned.';
        onlyOneApple.disable();
        onlyOneApple.skip = 'Too few apples spawned.';
    }

    if (bananaSpawnPositions.length < 2) {
        bananaSpawn.disable();
        bananaSpawnRandomXPosition.disable();
        bananaSpawnRandomXPosition.skip = 'Too few bananas spawned.';
        bananaSpawnYPosition.disable();
        bananaSpawnYPosition.skip = 'Too few bananas spawned.';
        onlyOneBanana.disable();
        onlyOneBanana.skip = 'Too few bananas spawned.';
    }

    if (!checkedBananaDelayRespawn) {
        bananaDelayRespawn.disable();
    }

    let appleTouchedBowl = false;
    let appleTouchedGround = false;
    for (const touched of appleTouched) {
        if (touched.object === 'bowl') {
            appleTouchedBowl = true;
        } else if (touched.object === 'ground') {
            appleTouchedGround = true;
        }
    }
    if (appleFellTimestamp === -1 || !appleTouchedBowl) {
        applePoints.disable();
        applePoints.skip = 'Apple did not touch the bowl.';
    }
    if (appleFellTimestamp === -1 || !appleTouchedGround) {
        appleGameOver.disable();
        appleGameOver.skip = 'Apple did not touch the ground.';
        appleGameOverMessage.disable();
        appleGameOverMessage.skip = 'Apple did not touch the ground.';
    }

    let bananaTouchedBowl = false;
    let bananaTouchedGround = false;
    for (const touched of bananaTouched) {
        if (touched.object === 'bowl') {
            bananaTouchedBowl = true;
        } else if (touched.object === 'ground') {
            bananaTouchedGround = true;
        }
    }
    if (bananaFellTimestamp === -1 || !bananaTouchedBowl) {
        bananaBowlPoints.disable();
        bananaBowlPoints.skip = 'Banana did not touch the bowl.';
    }
    if (bananaFellTimestamp === -1 || !bananaTouchedGround) {
        bananaGroundPoints.disable();
        bananaGroundPoints.skip = 'Banana did not touch the ground.';
        bananaGroundMessage.disable();
        bananaGroundMessage.skip = 'Banana did not touch the ground.';
    }

    if (!checkedBananaBowlPoints) {
        bananaBowlPoints.disable();
        bananaBowlPoints.skip = 'Banana bowl points could not be checked.';
    }
    if (!checkedBananaGroundPoints) {
        bananaGroundPoints.disable();
        bananaGroundPoints.skip = 'Banana ground points could not be checked.';
    }
    if (!checkedBananaGroundMessage) {
        bananaGroundMessage.disable();
        bananaGroundMessage.skip = 'Banana ground message could not be checked.';
    }
    if (!checkedApplePoints) {
        applePoints.disable();
        applePoints.skip = 'Apple points could not be checked.';
    }
    if (!checkedAppleGameOver) {
        appleGameOver.disable();
        appleGameOver.skip = 'Apple game over could not be checked.';
    }
    if (!checkedAppleGameOverMessage) {
        appleGameOverMessage.disable();
        appleGameOverMessage.skip = 'Apple game over message could not be checked.';
    }

    if (!timeChanged) {
        timerTick.disable();
        timerTick.skip = 'Timer did not tick at all.';
    }

    if (appleTouchedGround && t.getRunTimeElapsed() < 35000) {
        timerGameOver.disable();
        timerGameOver.skip = 'Program did not run long enough.';
        timerGameOverMessage.disable();
        timerGameOverMessage.skip = 'Program did not run long enough';
    }


    // ==================== Log the Constraints ====================================

    for (let i = 0; i < constraints.length; i++) {
        const constraint = constraints[i];

        let status;
        let message;

        if (constraint.isActive()) {
            status = 'pass';
        } else if (constraint.hasOwnProperty('skip')) {
            status = 'skip';
        } else {
            status = 'fail';
        }

        if (constraint.hasOwnProperty('skip')) {
            message = constraint.skip;
        } else if (constraint.error === null) {
            message = '';
        } else {
            message = constraint.error.message;
        }

        const log = {
            id: i + 1,
            name: constraint.name,
            status: status,
            message: message
        };

        t.log(log);
    }
};

module.exports = [
    {
        test: test,
        name: 'Test',
        description: 'Test various constraints in a 40 second run. The bowl is controlled to catch apples.',
        categories: []
    }
];

/*
 * 01: fruitSize
 * 02: timerInit
 * 03: bowlInit
 * 04: bowlMove
 * 05: bowlMoveDetails
 * 06: appleFalling
 * 07: appleFallingDetails
 * 08: bananaFalling
 * 09: bananaFallingDetails
 * 10: appleSpawn
 * 11: appleSpawnYPosition
 * 12: appleSpawnRandomXPosition
 * 13: bananaSpawn
 * 14: bananaSpawnYPosition
 * 15: bananaSpawnRandomXPosition
 * 16: onlyOneApple
 * 17: onlyOneBanana
 * 18: bananaDelayBeginning
 * 19: bananaDelayRespawn
 * 20: applePoints
 * 21: bananaBowlPoints
 * 22: bananaGroundPoints
 * 23: bananaGroundMessage
 * 24: timerTick
 * 25: timerGameOver
 * 26: timerGameOverMessage
 */
