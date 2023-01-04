function login(username, password, baseUrl) {
    let data = 'data={"identifiant": "' + username + '", "motdepasse": "' + password + '"}';
    // use fetch to send a POST request to the login endpoint
    return fetch(baseUrl + '/login.awp', {
        method: 'POST',
        body: data
    }).then(response => response.json());
}

function getGrades(token, idEleve, baseUrl) {
    let data = 'data={"token": "' + token + '"}';
    // use fetch to send a POST request to the grades endpoint
    return fetch(baseUrl + '/eleves/' + idEleve + '/notes.awp?verbe=get&', {
        method: 'POST',
        body: data
    }).then(response => response.json());
}

async function main(username, password) {
    return new Promise(async (resolve) => {
        console.log("Logging in...")

        // login to EcoleDirecte
        let data = await login(username, password, baseUrl);
        if (!data.token) {
            console.log("Error: invalid credentials, please try again.");
            resolve("invcrd");
        }
        if (!data.token) return;
        let token = data.token;
        console.log(token);
        let idEleve = data.data.accounts[0].id;
        console.log(idEleve);
        console.log("Logged in successfully!")

        // get grades
        let grades = await getGrades(token, idEleve, baseUrl);

        /**
         * @param disciplines.ensembleMatieres array
         * @param ensembleMatieres.disciplines  array of subjects
         * @param element.sousMatiere boolean (true if subject is a part of another subject)
         */
            // prompt user for trimester and get grades of that trimester
        let trimester = 3;
        let disciplines = grades.data.periodes[trimester - 1].ensembleMatieres.disciplines
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

        resolve(moyenneGenerale);
    });
}