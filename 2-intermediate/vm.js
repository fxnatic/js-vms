class VM {
    constructor(instructions) {
        this.instructions = instructions;
        this.registers = Array(10).fill(0); // Setup with 10 registers
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

            case "LESS_THAN": // LESS_THAN: registers[arg1] < registers[arg2] -> registers[target]
                return () => {
                    this.registers[instruction.target] = this.registers[instruction.arg1] < this.registers[instruction.arg2];
                };

            case "STORE": // STORE: arg1 -> registers[target]
                return () => {
                    this.registers[instruction.target] = instruction.arg1;
                };

            case "PRINT": // PRINT: console.log(registers[arg1])
                return () => {
                    console.log(this.registers[instruction.arg1])
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

var input = -10 //Input of the program

const instructions = [
/* 0 */  { opcode: "STORE", arg1: input, target: 0, }, // Store value of input in registers[0]
/* 1 */  { opcode: "STORE", arg1: 0, target: 1, }, // Store value of 0 in registers[1]
/* 2 */  { opcode: "STORE", arg1: "Not a negative number", target: 2 }, // Store value of "Not a negative number" in registers[2]
/* 3 */  { opcode: "STORE", arg1: "Is a negative number", target: 3, }, // Store value of "Is a negative number" in registers[3]
/* 4 */  { opcode: "LESS_THAN", arg1: 0, arg2: 1, target: 0 }, // Check if registers[0] is less than registers[1] and store the boolean in registers[0]
/* 5 */  { opcode: "JUMP_IF_TRUE", arg1: 0, target: 8 }, // If registers[0] is equal to true, jump to instructions[9]
/* 6 */  { opcode: "PRINT", arg1: 2 }, // Prints registers[2] to the console
/* 7 */  { opcode: "EXIT" }, // Exits the program
/* 8 */  { opcode: "PRINT", arg1: 3 }, // Prints registers[3] to the console
/* 9 */  { opcode: "EXIT" }, // Exits the program
];

const vm = new VM(instructions);
vm.run();