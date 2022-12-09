// import modules
const axios = require('axios');
const prompt = require('prompt');
const { login, getGrades } = require('./functions/api.js');

const baseUrl = 'https://api.ecoledirecte.com/v3';

// function: prompt username and password with hidden characters for password
function promptUser() {
    let schema = {
        properties: {
            username: {
                description: 'Username',
                required: true
            },
            password: {
                description: 'Password',
                hidden: true,
                required: true
            }
        }
    };
    return new Promise((resolve, reject) => {
        prompt.start();
        prompt.get(schema, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });
}


// function: prompt user for a trimester and return the grades of that trimester
/**
 * @param grades
 * @param grades.data.data.periodes array of trimesters
 * @param trimester.periode
 * @returns {Promise<unknown>}
 */
function promptTrimester(grades) {
    console.log("Please select a trimester: ");
    let trimesters = grades.data.data.periodes;
    for (let i = 0; i < trimesters.length; i++) {
        console.log(`${i + 1}: ${trimesters[i].periode}`);
    }
    let schema = {
        properties: {
            trimester: {
                description: 'Trimester',
                required: true
            }
        }
    };
    return new Promise((resolve, reject) => {
        prompt.start();
        prompt.get(schema, (err, result) => {
            if (err) reject(err);
            else if (result.trimester < 1 || result.trimester > trimesters.length) {
                console.log("Error: you need to provide a valid trimester, please try again.");
                process.exit(1);
            } else if (isNaN(result.trimester)) {
                console.log("Error: you need to enter a number, please try again.");
                process.exit(1);
            }
            resolve(result);
        });
    });
}

/**
 *
 * @param data.accounts
 */
// function: main
async function main() {
    // prompt username and password
    let {username, password} = await promptUser();

    console.log("Logging in...")

    // login to EcoleDirecte
    let {data} = await login(username, password, baseUrl);
    if (!data.token) {
        console.log("Error: invalid credentials, please try again.");
        process.exit(1);
    }
    let token = data.token;
    let idEleve = data.data.accounts[0].id;
    console.log("Logged in successfully!")

    // get grades
    let grades = await getGrades(token, idEleve, baseUrl);

    /**
     * @param disciplines.ensembleMatieres array
     * @param ensembleMatieres.disciplines  array of subjects
     * @param element.sousMatiere boolean (true if subject is a part of another subject)
     */
    // prompt user for trimester and get grades of that trimester
    let {trimester} = await promptTrimester(grades);
    let disciplines = grades.data.data.periodes[trimester - 1].ensembleMatieres.disciplines
        .filter(element => !element.sousMatiere && element.moyenne)
        .map(element => {
            return {
                discipline: element.discipline,
                moyenne: parseFloat(element.moyenne.replace(",", ".")),
                coef: element.coef
            }
        })
    console.log("Grades fetched successfully!")

    // sum of all grades and divide by number of grades using coefs
    let moyenneGenerale = 0;
    let coefTotal = 0;

    disciplines.forEach(element => {
        moyenneGenerale += element.moyenne * element.coef;
        coefTotal += element.coef;
    });
    moyenneGenerale /= coefTotal
    moyenneGenerale = moyenneGenerale.toFixed(2);

    console.log('\n\n\n')
    console.log(!isNaN(moyenneGenerale) ? `Votre moyenne générale est de ${moyenneGenerale}` : `Aucune moyenne n'est disponible pour ce trimestre`);
}

console.log('\n\n\n\n\n')
main().then(() => {
    console.log('\n\n\n\n\n')
});