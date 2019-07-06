const detectInputs = async function (t) {
    let mouseInput = false;
    let keyboardInput = false;
    let textInput = false;

    for (const target of t.vm.runtime.targets) {
        if (target.hasOwnProperty('blocks')) {
            for (const blockId of Object.keys(target.blocks._blocks)) {
                const block = target.blocks.getBlock(blockId);

                if (typeof block.opcode === 'undefined')
                    continue;

                const fields = target.blocks.getFields(block);

                switch (target.blocks.getOpcode(block)) {
                case 'event_whenkeypressed':
                case 'sensing_keyoptions':
                    keyboardInput = true;
                    break;

                case 'sensing_askandwait':
                case 'sensing_answer':
                    textInput = true;
                    break;

                case 'sensing_mousex':
                case 'sensing_mousey':
                case 'event_whenthisspriteclicked':
                case 'event_whenstageclicked':
                case 'sensing_mousedown':
                    mouseInput = true;
                case 'sensing_touchingobjectmenu':
                    if (fields.hasOwnProperty('DISTANCETOMENU') && fields.DISTANCETOMENU.value === '_mouse_')
                        mouseInput = true;
                case 'sensing_distancetomenu':
                    if (fields.hasOwnProperty('DISTANCETOMENU') && fields.DISTANCETOMENU.value === '_mouse_')
                        mouseInput = true;
                    break;
                }
            }
        }
    }

    t.log(JSON.stringify({
        mouse: mouseInput,
        keyboard: keyboardInput,
        text: textInput
    }));
};

const countBlocks = async function (t) {
    const blockIds = new Set();
    let numScripts = 0;
    let numSprites = 0;

    const addBlocks = function (targetBlocks, blockId) {
        if (blockIds.has(blockId))
            return;
        blockIds.add(blockId);

        /* Add branches of C-shaped blocks. */
        let branchId = targetBlocks.getBranch(blockId, 1);
        for (let i = 2; branchId !== null; i++) {
            addBlocks(targetBlocks, branchId);
            branchId = targetBlocks.getBranch(blockId, i);
        }

        /* Add the next block. */
        const nextId = targetBlocks.getNextBlock(blockId);
        if (nextId !== null) {
            addBlocks(targetBlocks, nextId);
        }
    }

    for (const target of t.vm.runtime.targets) {
        numSprites++;
        if (target.hasOwnProperty('blocks')) {
            const targetName = target.getName();
            for (const scriptId of target.blocks.getScripts()) {
                numScripts++;
                addBlocks(target.blocks, scriptId);
            }
        }
    }

    t.log(JSON.stringify({
        sprites: numSprites,
        scripts: numScripts,
        blocks: blockIds.size
    }));
};

module.exports = [
    {
        test: detectInputs,
        name: 'Detect Inputs'
    },
    {
        test: countBlocks,
        name: 'Count Blocks'
    }
];
