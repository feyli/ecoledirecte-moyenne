// import modules
const axios = require('axios');
const prompt = require('prompt');

const baseUrl = 'https://api.ecoledirecte.com/v3';

// function: prompt username and password with hidden characters for password
function promptUser() {
    var schema = {
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

// function: login to EcoleDirecte with prompted credentials
function login(username, password) {
    let data = 'data={"identifiant": "' + username + '", "motdepasse": "' + password + '"}';
    return axios.post(baseUrl + '/login.awp', data);
}

function getGrades(token, idEleve) {
    let data = 'data={"token": "' + token + '"}';
    return axios.post(baseUrl + '/eleves/' + idEleve + '/notes.awp?verbe=get&', data);
}

// function: prompt user for a trimester and return the grades of that trimester
function promptTrimester(grades) {
    console.log("Please select a trimester: ");
    let trimesters = grades.data.data.periodes;
    for (let i = 0; i < trimesters.length; i++) {
        console.log(`${i + 1}: ${trimesters[i].periode}`);
    }
    var schema = {
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
            }

            else if (isNaN(result.trimester)) {
                console.log("Error: you need to enter a number, please try again.");
                process.exit(1);
            }
            resolve(result);
        });
    });
}

// function: main
async function main() {
    // prompt username and password
    let { username, password } = await promptUser();

    console.log("Logging in...")

    // login to EcoleDirecte
    let { data } = await login(username, password);
    if (!data.token) {
        console.log("Error: invalid credentials, please try again.");
        process.exit(1);
    }
    let token = data.token;
    let idEleve = data.data.accounts[0].id;
    console.log("Logged in successfully!")

    // get grades
    let grades = await getGrades(token, idEleve);

    // prompt user for trimester and get grades of that trimester
    let { trimester } = await promptTrimester(grades);
    let disciplines = grades.data.data.periodes[trimester - 1].ensembleMatieres.disciplines.filter(element => !element.sousMatiere && element.moyenne).map(element => {return {discipline: element.discipline, moyenne: parseFloat(element.moyenne), coef: parseFloat(element.coef), rank: element.rang}})
    console.log("Grades fetched successfully!")
    
    // sum of all grades and divide by number of grades using coefs
    let moyenneGenerale = 0;
    rangGeneral = 0;
    let coefTotal = 0;
    disciplines.forEach(element => {
        moyenneGenerale += element.moyenne * element.coef; 
        rangGeneral += element.rank * element.coef;
        coefTotal += element.coef;
    });
    moyenneGenerale /= coefTotal
    moyenneGenerale = moyenneGenerale.toFixed(2);
    rangGeneral /= coefTotal;
    rangGeneral = rangGeneral.toFixed(0);
    
    console.log('\n\n\n')
    console.log(!isNaN(moyenneGenerale) ? `Votre moyenne générale est de ${moyenneGenerale}` :  `Aucune moyenne n'est disponible pour ce trimestre`, `\n\n`, !isNaN(rangGeneral) ? `Votre rang général est de ${rangGeneral}\nVeuillez noter que ce rang n'est qu'une moyenne des rangs de chaque matière, il ne représente pas le rang de votre moyenne générale` : `Aucun rang n'est disponible pour ce trimestre`);
}

console.log('\n\n\n\n\n')
main().then(() => {
    console.log('\n\n\n\n\n')
});