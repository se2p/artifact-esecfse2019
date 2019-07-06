## Description

Whisker automates Scratch's IO for testing purposes. While Whisker 
is already usable, it is still in development and will undergo 
changes in the future.

The latest version of Whisker can be found at:
* https://github.com/se2p/whisker-main
* https://github.com/se2p/whisker-web

## Building Whisker

As a prerequisite to this process, we require the Node Package 
Manager (npm) to be installed on the system:

    on OsX: brew install npm
    on Debian: apt install npm

Then, the following steps should be taken on the command line:

    cd whisker-main
    npm install
    cd ../whisker-web
    npm install
    npm run build:prod

After conducting these steps, the file 'dist/index.html' (in 
the folder whisker-web) can be opened in the browser to
get access to the Whisker UI. 

## How to use

We demonstrate Whisker based on one of the Scratch projects that 
have been used to evaluate Whisker's performance. 

In the Web UI of Whisker, you can choose the file

    data/teacher-data/sample.sb3

as the Scratch project and the file

    data/test-seeded/test-random.js

as the tests to execute.

### Initialization and getting the test driver object

```javascript
const {WhiskerUtil} = require('whisker');

const whisker = new WhiskerUtil(scratchVM, scratchProject);
whisker.prepare();
const t = whisker.getTestDriver();

whisker.start();

/* Run the Scratch VM and control it with t. */
...

whisker.end();
```

### Coverage measurement

```javascript
const Thread = require('scratch-vm/src/engine/thread');
const {CoverageGenerator} = require('whisker');

CoverageGenerator.prepareThread(Thread);

/* After the project has been loaded. */
CoverageGenerator.prepare(scratchVm);

/* Run the Scratch program. (Can be run and reloaded multiple times.) */
...

const coverage = CoverageGenerator.getCoverage();

CoverageGenerator.restoreThread(Thread);
```

### Functions of the test driver object (t)

```javascript
/* Running the program. */
await t.run(condition, timeout, steps);
await t.runForTime(time);
await t.runUntil(condition, timeout);
await t.runUntilChanges(func);
await t.runForSteps(steps, timeout);
t.cancelRun();

/* Run information. */
t.getTotalTimeElapsed();
t.getTotalTimeElapsed();
t.getRunTimeElapsed();
t.getTotalStepsExecuted();
t.getRunStepsExecuted();
t.isProjectRunning();

/* Sprite information. */
t.getSprites(condition, skipStage);
t.getSpritesAtPoint(x, y);
t.getSpriteAtPoint(x, y);
t.getSprite(name);
t.getStage();
t.getNewSprites(condition);
t.onSpriteMoved(callback);
t.onSpriteVisualChange(func);

/* Callbacks. */
t.addCallback(func);
t.reAddCallback(callback);
t.removeCallback(callback);
t.clearCallbacks();

/* Inputs. */
t.addInput(time, ioData);
t.reAddInput(time, input);
t.inputImmediate(ioData);
t.removeInput(input);
t.clearInputs();
t.resetMouse();
t.resetKeyboard();
t.getMousePos();
t.isMouseDown();
t.isKeyDown(key);

/* Random inputs / Automated input generation. */
t.registerRandomInputs(inputs);
t.clearRandomInputs();
t.setRandomInputInterval(timeInterval);
t.detectRandomInputs(props);

/* Constraints. */
t.addConstraint(func, name);
t.reAddConstraint(constraint);
t.removeConstraint(constraint);
t.clearConstraints();
t.onConstraintFailure(action);

/* Other. */
t.greenFlag();
t.getStageSize();
t.end();
```

