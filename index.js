const dispatch = {
    or: drawOrAt,
    and: drawAndAt,
    xor: drawXorAt,
    nor: drawNorAt,
    nand: drawNandAt,
    not: drawNotAt
};
const calcDispatch = {
    or: (a, b) => a || b,
    and: (a, b) => a && b,
    xor: (a, b) => a ^ b,
    nor: (a, b) => !(a || b),
    nand: (a, b) => !(a && b),
    not: a => !a
};

function depthOf(object) {
    var level = 1;
    for (var key in object) {
        if (!object.hasOwnProperty(key)) continue;

        if (typeof object[key] == 'object') {
            var depth = depthOf(object[key]) + 1;
            level = Math.max(depth, level);
        }
    }
    return level;
}

function render(ctx, circuit, x, y, depth) {
    const currentNode = Object.keys(circuit)[0];

    if (typeof circuit === "string") {
        ctx.fillText(circuit, x, y);
    } else {
        dispatch[currentNode](ctx, x, y);

        if (currentNode != "not") { // binary operator
            let first = true;
            for (const subnode of circuit[currentNode]) {
                const nx = x - 100;
                const ny = y + (first ? -1 : 1) * 50 * depth;
                render(ctx, subnode, nx, ny, depth - 1);
                if (typeof subnode === "string") {
                    wireTo(ctx, x + 15, y + (first ? 15 : 35), nx + 15, ny - 6);
                } else {
                    wireTo(ctx, x + 15, y + (first ? 15 : 35), nx + 100, ny + 25);
                }
                first = false;
            }
        } else {
            const subnode = circuit[currentNode];
            const nx = x - 100;
            const ny = y;
            render(ctx, subnode, nx, ny, depth - 1);
            if (typeof subnode === "string") {
                wireTo(ctx, x + 15, y + 25, nx + 15, ny - 6);
            } else {
                wireTo(ctx, x + 15, y + 25, nx + 100, ny + 25);
            }

        }
    }
}

function calculateCircuit(circuit, a, b, c, d) {
    const currentOperator = Object.keys(circuit)[0];

    if (typeof circuit === "string") {
        switch (circuit) {
            case "A":
                return a;
            case "B":
                return b;
            case "C":
                return c;
            case "D":
                return d;
        }
    } else {
        if (currentOperator == "not") {
            return calcDispatch[currentOperator](calculateCircuit(circuit[currentOperator], a, b, c, d));
        } else {
            return calcDispatch[currentOperator](calculateCircuit(circuit[currentOperator][0], a, b, c, d), calculateCircuit(circuit[currentOperator][1], a, b, c, d));
        }
    }
}

function parseCircuit() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = '12px sans-serif';
    ctx.lineWidth = 2;

    const circText = document.getElementById("circuit").value;
    let circuit;
    {
        A = "A";
        B = "B";
        C = "C";
        D = "D";
        OR = (a, b) => ({or: [a, b]});
        AND = (a, b) => ({and: [a, b]});
        NOT = a => ({not: a});
        NOR = (a, b) => ({nor: [a, b]});
        XOR = (a, b) => ({xor: [a, b]});
        NAND = (a, b) => ({nand: [a, b]});
        circuit = eval(circText); // XOR(A,AND(B,OR(C,D)))
    }

    // const circuit = { // OR(AND(A, NOT(B)), XOR(NOR(C, D), NAND(A, B)))
    //     or: [
    //         {
    //             and: [
    //                 "A",
    //                 {
    //                     not: "B"
    //                 }
    //             ]
    //         },
    //         {
    //             xor: [
    //                 {
    //                     nor: ["C", "D"]
    //                 },
    //                 {
    //                     nand: ["A", "B"]
    //                 }
    //             ]
    //         }
    //     ]
    // };

    const x = 500;
    const y = 300;
    render(ctx, circuit, x, y, depthOf(circuit) - 3);
    wireTo(ctx, x + 100, y + 25, x + 150, y + 25);
    ctx.fillText("out", x + 150, y + 25);

    const table = document.getElementById("data");

    for (const row of table.rows) {
        if (row.cells[0].innerText == "A") continue;
        row.cells[4].innerText = +calculateCircuit(circuit, +row.cells[0].innerText, +row.cells[1].innerText, +row.cells[2].innerText, +row.cells[3].innerText);
    }

    const karnaugh = document.getElementById("karnaugh");

    for (let i = 1; i < 5; i++) {
        for (let j = 1; j < 5; j++) {
            const a = j >= 3;
            const b = (j - 1) & 1;
            const c = i >= 3;
            const d = (i - 1) & 1;
            const calc = calculateCircuit(circuit, a, b, c, d);

            karnaugh.rows[i].cells[j].innerText = +calc;
            karnaugh.rows[i].cells[j].style.backgroundColor = calc ? "rebeccapurple" : "white";
        }
    }

    const listToMinterm = (a,b,c,d) => {
      return [a ? '1' : '0', b ? '1' : '0', c ? '1' : '0', d ? '1' : '0'].join('');
    };
    //
    // const sentinel = 'alfalfa';
    //
    // const swapVariable = (minterm, variable) => {
    //     return minterm.replace(variable + '*', sentinel).replace(variable, variable + '*').replace(sentinel, variable);
    // };
    //
    // const removeVariable = (minterm, variable) => {
    //     return minterm.replace(variable + '*', '').replace(variable, '');
    // };
    //
    let minterms = []; // indexed
    for (let i = 0; i < 16; i++) {
        const a = (i >> 3) & 1;
        const b = (i >> 2) & 1;
        const c = (i >> 1) & 1;
        const d = (i >> 0) & 1;

        const result = calculateCircuit(circuit, a, b, c, d);
        if (result) {
            minterms.push(listToMinterm(a,b,c,d));
        }
    }
    //
    // console.log(minterms);
    // let nextMinterms = minterms;
    // let runOnce = true;
    // while (minterms.length !== nextMinterms.length || runOnce) {
    //     minterms = [...nextMinterms];
    //
    //     for (const minterm of minterms) {
    //         for (const variable of ["A", "B", "C", "D"]) {
    //             if (nextMinterms.indexOf(minterm) !== -1 && nextMinterms.indexOf(swapVariable(minterm, variable)) !== -1 && nextMinterms.indexOf(removeVariable(minterm, variable)) === -1) { // try this as minterms.indexOf
    //                 nextMinterms.splice(nextMinterms.indexOf(minterm), 1);
    //                 nextMinterms.splice(nextMinterms.indexOf(swapVariable(minterm, variable)), 1);
    //                 nextMinterms.push(removeVariable(minterm, variable));
    //             }
    //
    //             if (nextMinterms.indexOf(minterm) !== -1 && nextMinterms.indexOf(removeVariable(minterm, variable)) !== -1) {
    //                 nextMinterms.splice(nextMinterms.indexOf(minterm), 1);
    //             }
    //         }
    //     }
    //
    //     runOnce = false;
    // }
    //
    // console.log(minterms);
    let implicants = {
        1: [ // size 1 implicants

        ],
        2: [],
        4: [],
        8: [],
        16: []
    };

    const requiredMinterms = [];

    let primeImplicants = [];

    for (const minterm of minterms) {
        implicants[1].push({
            mValue: [parseInt(minterm, 2)],
            implicant: minterm
        });
        requiredMinterms.push(parseInt(minterm, 2));
    }

    let size = 1;

    function canCombine(implicant, implicantPair) {
        let diffs = 0;
        for (let i = 0; i < implicant.implicant.length; i++) {
            if (implicant.implicant[i] !== implicantPair.implicant[i]) {
                diffs++;
            }
        }

        return diffs === 1;
    }

    function combineImplicants(implicant, implicantPair) {
        let ni = implicant.implicant.split('');
        for (let i = 0; i < ni.length; i++) {
            if (ni[i] !== implicantPair.implicant[i]) {
                ni[i] = '*';
            }
        }

        return {
            mValue: implicant.mValue.concat(implicantPair.mValue),
            implicant: ni.join('')
        };
    }

    while (size < 16) {
        let knownCompositeImplicants = [];
        implicantLoop: for (const implicant of implicants[size]) {
            for (const implicantPair of implicants[size]) {
                if (canCombine(implicant, implicantPair)) {
                    let foundDuplicate = false;
                    const combined = combineImplicants(implicant, implicantPair);

                    for (const nextImplicantPair of implicants[size * 2]) {
                        if (nextImplicantPair.implicant === combined.implicant) {
                            foundDuplicate = true;
                            break;
                        }
                    }

                    if (!foundDuplicate) implicants[size * 2].push(combined);
                    knownCompositeImplicants.push(implicant);
                    knownCompositeImplicants.push(implicantPair);
                    continue implicantLoop;
                }
            }
            // combine and push to next implicant size
        }

        for (const implicant of implicants[size]) {
            if (knownCompositeImplicants.indexOf(implicant) === -1) {
                primeImplicants.push(implicant);
            }
        }

        size *= 2;
    }

    const chosenProviders = [];

    const providers = {};
    for (const i of requiredMinterms) {
        providers[i] = [];

        for (const implicant of primeImplicants) {
            if (implicant.mValue.indexOf(i) !== -1) {
                providers[i].push(implicant);
            }
        }
    }

    for (const i of requiredMinterms) {
        if (providers[i].length === 1 && chosenProviders.indexOf(providers[i][0]) === -1) {
            chosenProviders.push(providers[i][0]);
        }
    }

    for (const i of chosenProviders) {
        for (const m of i.mValue) {
            if (requiredMinterms.indexOf(m) !== -1) {
                requiredMinterms.splice(requiredMinterms.indexOf(m), 1);
            }
        }
    }

    while (requiredMinterms.length > 0) {
        const i = requiredMinterms[0];
        for (const implicant of primeImplicants) {
            if (implicant.mValue.indexOf(i) !== -1) {
                chosenProviders.push(implicant);

                for (const m of implicant.mValue) {
                    if (requiredMinterms.indexOf(m) !== -1) {
                        requiredMinterms.splice(requiredMinterms.indexOf(m), 1);
                    }
                }
                break;
            }
        }
    }

    const toFormat = x => (x[0] === '1' ? 'A' : (x[0] === '0' ? '\\overline{A}' : ''))
        + (x[1] === '1' ? 'B' : (x[1] === '0' ? '\\overline{B}' : ''))
        + (x[2] === '1' ? 'C' : (x[2] === '0' ? '\\overline{C}' : ''))
        + (x[3] === '1' ? 'D' : (x[3] === '0' ? '\\overline{D}' : ''))
    ;
    const karnaughReducedDisjunctiveNormalForm = chosenProviders.map(x => toFormat(x.implicant)).join(' \\vee ');
    document.getElementById("reduced").innerText = "Karnaugh-reduced Disjunctive Normal Form: \\(" + karnaughReducedDisjunctiveNormalForm + "\\)";
    MathJax.typeset();
}

function drawImageAt(ctx, src, x, y) {
    const image = new Image(); // Using optional size for image

    image.src = src;

    image.onload = () => {
        ctx.drawImage(image, x, y);
    }
}

function wireTo(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawNotAt(ctx, x, y) {
    drawImageAt(ctx, "./not.svg", x, y);
}

function drawNorAt(ctx, x, y) {
    drawImageAt(ctx, "./nor.svg", x, y);
}

function drawNandAt(ctx, x, y) {
    drawImageAt(ctx, "./nand.svg", x, y);
}

function drawXorAt(ctx, x, y) {
    drawImageAt(ctx, "./xor.svg", x, y);
}

function drawAndAt(ctx, x, y) {
    drawImageAt(ctx, "./and.svg", x, y);
}

function drawOrAt(ctx, x, y) {
    drawImageAt(ctx, "./or.svg", x, y);
}