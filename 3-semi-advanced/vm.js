var prompt = require('prompt-sync')();

class VM {
    constructor(instructions) {
        this.instructions = instructions;
        this.registers = Array(10).fill(0); // Example setup with 10 registers
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

            case "STORE": // STORE: arg1 -> registers[target]
                return () => {
                    this.registers[instruction.target] = instruction.arg1;
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
/* 2 */  { opcode: "STORE", arg1: "Enter a number: ", target: 2 }, // Store prompt message
/* 3 */  { opcode: "STORE", arg1: 0, target: 4 }, // Store value of 0 in registers[4]
/* 4 */  { opcode: "STORE", arg1: "Not a negative number", target: 5 }, // Store value of "Not a negative number" in registers[5]
/* 5 */  { opcode: "STORE", arg1: "Is a negative number", target: 6 }, // Store value of "Is a negative number" in registers[6]
/* 6 */  { opcode: "STORE", arg1: "exit", target: 7 }, // Store value of "exit" in registers[7]
/* 7 */  { opcode: "CALL", arg1: 0, args: [2], target: 3 }, // Calls the function stored at registers[0] with arguments of (registers[2]) and stores the return value at registers[3]
/* 8 */  { opcode: "EQUALS", arg1: 3, arg2: 7, target: 8 }, // Check if registers[3] is equal to registers[7] and stores the value in registers[8]
/* 9 */  { opcode: "JUMP_IF_TRUE", arg1: 8, target: 16 }, // If registers[8] is equal to true, jump to instructions[16]
/* 10 */ { opcode: "LESS_THAN", arg1: 3, arg2: 4, target: 8 }, // Check if registers[3] is less than registers[4] and store the boolean in registers[8]
/* 11 */ { opcode: "JUMP_IF_TRUE", arg1: 8, target: 14 }, // If registers[8] is equal to true, jump to instructions[14]
/* 12 */ { opcode: "CALL", arg1: 1, args: [5] }, // Calls the function stored at registers[1] with arguments of (registers[5])
/* 13 */ { opcode: "JUMP", target: 7 }, // Jumps to instructions[7]
/* 14 */ { opcode: "CALL", arg1: 1, args: [6] }, // Calls the function stored at registers[1] with arguments of (registers[6])
/* 15 */ { opcode: "JUMP", target: 7 }, // Jumps to instructions[7]
/* 16 */ { opcode: "EXIT" }, // Exits the program
];

const vm = new VM(instructions);
vm.run();