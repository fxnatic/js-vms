var prompt = require('prompt-sync')();

class VM {
    constructor(instructions) {
        this.instructions = instructions;
        this.registers = Array(12).fill(0); // Setup with 12 registers
        this.globals = [prompt, ()=>{}]; // Global objects the vm needs access (ie: window, Math, JSON)
        this.pc = 0; // Program counter to track our current place in the instruction set
        this.running = true; // Flag to control whether we should continue running or not

        this.dataStack = [];       // For storing intermediate results and local variables
        this.callStack = [];       // To track return addresses and previous frames
        this.framePointer = 0;     // Points to the base of the current function frame
    }

    getOperation(instruction) {
        const { opcode } = instruction;

        switch (opcode) {
            case "PUSH": // PUSH: pushes a value onto the data stack
                return () => {
                    this.dataStack.push(this.registers[instruction.arg1]);
                };

            case "POP": // POP: pops the top of the stack to a register
                return () => {
                    if (this.dataStack.length === 0) throw new Error("Stack Underflow");
                    this.registers[instruction.target] = this.dataStack.pop();
                };

            case "ADD": // ADD: registers[arg1] + registers[arg2] -> registers[target]
                return () => {
                    this.registers[instruction.target] = this.registers[instruction.arg1] + this.registers[instruction.arg2];
                };

            case "EQUALS": // EQUALS: registers[arg1] == registers[arg2] -> registers[target]
                return () => {
                    this.registers[instruction.target] = this.registers[instruction.arg1] == this.registers[instruction.arg2];
                };

            case "LESS_THAN": // LESS_THAN: registers[arg1] < registers[arg2] -> registers[target]
                return () => {
                    this.registers[instruction.target] = this.registers[instruction.arg1] < this.registers[instruction.arg2];
                };

            case "LESS_THAN_EQUALS": // LESS_THAN: registers[arg1] < registers[arg2] -> registers[target]
                return () => {
                    this.registers[instruction.target] = this.registers[instruction.arg1] <= this.registers[instruction.arg2];
                };

            case "STORE": // STORE: arg1 -> registers[target]
                return () => {
                    this.registers[instruction.target] = instruction.arg1;
                };

            case "SET": // STORE: registers[arg1] -> registers[target]
                return () => {
                    this.registers[instruction.target] = this.registers[instruction.arg1];
                };

            case "LOAD_GLOBAL": // LOAD_GLOBAL: Load value from globals[arg1] -> registers[target]
                return () => {
                    const globalValue = this.globals[instruction.arg1];
                    this.registers[instruction.target] = globalValue;
                };

            case "PRINT": // PRINT: console.log(registers[arg1])
                return () => {
                    console.log(this.registers[instruction.arg1])
                };

            case "CALL_FUNC": // CALL_FUNC: For internal VM function calls
                return () => {
                    const funcAddress = this.registers[instruction.arg1];
                    const argCount = instruction.argCount || 0;

                    if (typeof funcAddress !== 'number') {
                        throw new Error(`Invalid function address: ${funcAddress}`);
                    }

                    this.callStack.push(this.pc);          // Save the return address
                    this.callStack.push(this.framePointer); // Save the current frame pointer
                    this.framePointer = this.dataStack.length - argCount; // New frame starts with arguments at base
                    this.pc = funcAddress; // Jump to function address
                };

            case "CALL_METHOD": // CALL_METHOD: For external/global method calls
                return () => {
                    const func = this.registers[instruction.arg1];
                    if (typeof func !== 'function') {
                        throw new Error(`registers[${instruction.arg1}] is not a function`);
                    }
                    const args = instruction.args.map(argIndex => this.registers[argIndex]);
                    const result = func(...args);
                    if (instruction.target !== undefined) {
                        this.registers[instruction.target] = result;
                    }
                    if (instruction.arg1 == 0) {
                        start = Date.now()
                    }
                };

            case "RETURN": // RETURN: Common return handling for internal function calls
                return () => {
                    if (this.callStack.length < 2) throw new Error("Call Stack Underflow");

                    const returnValue = this.dataStack.pop();

                    this.dataStack = this.dataStack.slice(0, this.framePointer); // Clear local frame data
                    this.framePointer = this.callStack.pop();                    // Restore frame pointer
                    this.pc = this.callStack.pop();                              // Restore program counter

                    if (returnValue !== undefined) {
                        this.dataStack.push(returnValue);
                    }
                };

            case "JUMP": // JUMP: target -> program counter 
                return () => {
                    this.pc = instruction.target;
                };

            case "JUMP_IF_TRUE": // JUMP_IF_TRUE: if(registers[arg1] == true) { target -> program counter }
                return () => {
                    if (this.registers[instruction.arg1] == true) {
                        this.pc = instruction.target;
                    }
                };

            case "JUMP_IF_FALSE": // JUMP_IF_FALSE: if(registers[arg1] == false) { target -> program counter }
                return () => {
                    if (this.registers[instruction.arg1] == false) {
                        this.pc = instruction.target;
                    }
                };

            case "EXIT":  // EXIT: prevent any further execution
                return () => {
                    this.running = false;
                };

            default:
                throw new Error(`UNKNOWN_OPCODE: ${opcode}`);
        }
    }

    run() {
        while (this.pc < this.instructions.length && this.running) {
            const instruction = this.instructions[this.pc++];
            const operation = this.getOperation(instruction);
            if (!operation) {
                throw new Error(`UNKNOWN_OPCODE: ${instruction.opcode}`);
            }
            operation();
        }
    }
}

const instructions = [

/* Start of main program */

/* 0 */  { opcode: "LOAD_GLOBAL", arg1: 0, target: 0 }, // Load prompt into registers[0]
/* 1 */  { opcode: "LOAD_GLOBAL", arg1: 1, target: 1 }, // Load console.log into registers[1]
/* 2 */  { opcode: "STORE", arg1: "Enter a number: ", target: 6 }, // Store prompt message at registers[6]
/* 3 */  { opcode: "CALL_METHOD", arg1: 0, args: [6], target: 7 }, // Prompt user and store input in registers[7]
/* 4 */  { opcode: "STORE", arg1: 1, target: 2 }, // Store increment value 1 in registers[2]
/* 5 */  { opcode: "STORE", arg1: 0, target: 3 }, // Initialize prev to 0 in registers[3]
/* 6 */  { opcode: "STORE", arg1: 1, target: 4 }, // Initialize curr to 1 in registers[4]
/* 7 */  { opcode: "STORE", arg1: 2, target: 5 }, // Initialize i to 2 in registers[5]
/* 8 */  { opcode: "STORE", arg1: 17, target: 9 },       // Store function address 17 in registers[9]
/* 9 */  { opcode: "CALL_METHOD", arg1: 1, args: [3] },  // Print prev
/* 10 */ { opcode: "CALL_METHOD", arg1: 1, args: [4] },  // Print curr
/* 11 */ { opcode: "CALL_FUNC", arg1: 9, target: 8 },   // Call Fibonacci function (located at index 10)
/* 12 */ { opcode: "CALL_METHOD", arg1: 1, args: [8] },  // Print next Fibonacci number
/* 13 */ { opcode: "ADD", arg1: 5, arg2: 2, target: 5 }, // Increment i (i++)
/* 14 */ { opcode: "LESS_THAN_EQUALS", arg1: 5, arg2: 7, target: 11 }, // Check if i <= user input
/* 15 */ { opcode: "JUMP_IF_TRUE", arg1: 11, target: 11 }, // Loop back if true
/* 16 */ { opcode: "EXIT" }, // Exit program

/* Start of Fibonnaci function */

/* 17 */ { opcode: "ADD", arg1: 3, arg2: 4, target: 8 }, // next = prev + curr
/* 18 */ { opcode: "SET", arg1: 4, target: 3 },          // prev = curr
/* 19 */ { opcode: "SET", arg1: 8, target: 4 },          // curr = next
/* 20 */ { opcode: "RETURN" }                            // Return result
];

const vm = new VM(instructions);
vm.run();