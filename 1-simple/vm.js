class VM {
    constructor(instructions) {
        this.instructions = instructions;
        this.registers = Array(10).fill(0); // Setup with 10 registers
    }

    getOperation(instruction) {
        const { opcode } = instruction;

        switch (opcode) {
            case "ADD": // ADD: registers[arg1] + registers[arg2] -> registers[target]
                return () => {
                    this.registers[instruction.target] = this.registers[instruction.arg1] + this.registers[instruction.arg2];
                };

            case "STORE": // STORE: arg1 -> registers[target]
                return () => {
                    this.registers[instruction.target] = instruction.arg1;
                };

            case "PRINT": // PRINT: console.log(registers[arg1])
                return () => {
                    console.log(this.registers[instruction.arg1])
                };
            default:
                throw new Error(`UNKNOWN_OPCODE: ${opcode}`);
        }
    }

    run() {
        for (const instruction of this.instructions) {
            const operation = this.getOperation(instruction);
            if (!operation) {
                throw new Error(`UNKNOWN_OPCODE: ${instruction.opcode}`);
            }
            operation();
        }
    }
}

const instructions = [
    { opcode: "STORE", arg1: 5, target: 0 }, //Store value of 5 in registers[0]
    { opcode: "STORE", arg1: 10, target: 1, }, //Store value of 10 in registers[1]
    { opcode: "ADD", arg1: 0, arg2: 1, target: 0 }, //Add registers[0] and registers[1] together and store in registers[0]
    { opcode: "PRINT", arg1: 0 }, //Print registers[0] to the console
];

const vm = new VM(instructions);
vm.run();