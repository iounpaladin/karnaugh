let minterms = [
    "0001",
    "0010",
    "0011",
    "0101",
    "0110",
    "0111",
    "1000",
    "1001",
    "1010",
    "1011",
    "1100"
];
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

toFormat = x => (x[0] === '1' ? 'A' : (x[0] === '0' ? '\\overline{A}' : ''))
    + (x[1] === '1' ? 'B' : (x[1] === '0' ? '\\overline{B}' : ''))
    + (x[2] === '1' ? 'C' : (x[2] === '0' ? '\\overline{C}' : ''))
    + (x[3] === '1' ? 'D' : (x[3] === '0' ? '\\overline{D}' : ''))
;
const karnaughReducedDisjunctiveNormalForm = chosenProviders.map(x => toFormat(x.implicant)).join(' \\vee ');