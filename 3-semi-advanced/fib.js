var prompt = require('prompt-sync')();

class VM {
    constructor(instructions) {
        this.instructions = instructions;
        this.registers = Array(10).fill(0); // Setup with 10 registers
        this.globals = [prompt, console.log]; // Global objects the vm needs access (ie: window, Math, JSON)
        this.pc = 0; // Program counter to track our current place in the instruction set
        this.running = true; // Flag to control whether we should continue running or not
    }

    getOperation(instruction) {
        const { opcode } = instruction;

        switch (opcode) {
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

            case "CALL": // CALL: calls function in registers[arg1] with args in specified registers
                return () => {
                    const func = this.registers[instruction.arg1];
                    if (typeof func !== 'function') {
                        throw new Error(`registers[${instruction.arg1}] is not a function`);
                    }
                    // Collect arguments from specified registers and call the function
                    const args = instruction.args.map(argIndex => this.registers[argIndex]);
                    const result = func(...args);
                    if (instruction.target !== undefined) {
                        this.registers[instruction.target] = result;
                    }
                };

            case "JUMP": // JUMP: target -> program counter 
                return () => {
                    this.pc = instruction.target;
                };

            case "JUMP_IF_TRUE": // JUMP: if(registers[arg1] == true) { target -> program counter }
                return () => {
                    if (this.registers[instruction.arg1] == true) {
                        this.pc = instruction.target;
                    }
                };

            case "JUMP_IF_FALSE": // JUMP: if(registers[arg1] == false) { target -> program counter }
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
/* 0 */  { opcode: "LOAD_GLOBAL", arg1: 0, target: 0, }, // Loads globals[0] into registers[0]
/* 1 */  { opcode: "LOAD_GLOBAL", arg1: 1, target: 1, }, // Loads globals[1] into registers[1]
/* 2 */  { opcode: "STORE", arg1: 1, target: 2 }, // Store 1 for incrementing in registers[2]
/* 3 */  { opcode: "STORE", arg1: 0, target: 3 }, // Initialize prev to 0
/* 4 */  { opcode: "STORE", arg1: 1, target: 4 }, // Initialize curr to 1
/* 5 */  { opcode: "STORE", arg1: 2, target: 5 }, // Initialize i to 2 (start index for loop)
/* 6 */  { opcode: "STORE", arg1: "Enter a number: ", target: 6 }, // Store prompt message
/* 7 */  { opcode: "CALL", arg1: 0, args: [6], target: 7 }, // Calls the function stored at registers[0] with arguments of (registers[6]) and stores the return value at registers[7]
/* 8 */  { opcode: "CALL", arg1: 1, args: [3] },  // Print prev
/* 9 */  { opcode: "CALL", arg1: 1, args: [4] },  // Print curr
/* 10 */ { opcode: "ADD", arg1: 3, arg2: 4, target: 8 }, // next = prev + curr
/* 11 */ { opcode: "SET", arg1: 4, target: 3 }, // Set prev = curr
/* 12 */ { opcode: "SET", arg1: 8, target: 4 }, // Set curr = next
/* 13 */ { opcode: "CALL", arg1: 1, args: [8] }, // Calls the function stored at registers[1] with arguments of (registers[8])
/* 14 */ { opcode: "ADD", arg1: 5, arg2: 2, target: 5 }, // Increment i (i++)
/* 15 */ { opcode: "LESS_THAN_EQUALS", arg1: 5, arg2: 7, target: 9 }, // Check if i is less than or equal to the user input and stores the value in registers[9]
/* 16 */ { opcode: "JUMP_IF_TRUE", arg1: 9, target: 10 }, // If true, loop back to next Fibonacci calculation
/* 17 */ { opcode: "EXIT" }, // Exits the program
];

const vm = new VM(instructions);
vm.run();