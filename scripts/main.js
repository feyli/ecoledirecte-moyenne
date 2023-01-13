let baseUrl = "https://api.ecoledirecte.com/v3";
let box = document.getElementById("box");
let fields;
let submitButton;

async function submit() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value
    fields = document.getElementsByClassName("fields");
    submitButton = document.getElementById("submit")

    let req = login(username, password, baseUrl);
    disable();

    req.then(data => {
        if (data.code === 505) {
            console.log("Error: invalid credentials")
            enable();
        } else if (data.code === 200) {
            console.log("Logged in successfully!")
            evalData(data).then(d => {
                d = d.filter(e => e.sum);
                createTable(d);
                enable();
            })
        }
    })
}

function createTable(d) {
    // let promise = getGrades(d.token)
    let tabDiv = document.getElementById("periodes-container");
    let table = document.createElement("table");
    table.id = "periodes";
    let thead = document.createElement("thead");
    thead.colspan = 2;
    thead.innerText = "Periodes";
    let tbody = document.createElement("tbody");
    let tr = document.createElement("tr");
    let thPeriode = document.createElement("th");
    thPeriode.innerText = "Periode";
    let thMoyenne = document.createElement("th");
    thMoyenne.innerText = "Moyenne";
    tr.appendChild(thPeriode);
    tr.appendChild(thMoyenne);
    tbody.appendChild(tr);
    for (let i = 0; i < d.length; i++) {
        let tr = document.createElement("tr");
        let tdPeriode = document.createElement("td");
        tdPeriode.innerText = d[i].name;
        let tdMoyenne = document.createElement("td");
        tdMoyenne.innerText = d[i].sum;
        tr.appendChild(tdPeriode);
        tr.appendChild(tdMoyenne);
        tbody.appendChild(tr);
    }
    table.appendChild(thead);
    table.appendChild(tbody);
    tabDiv.appendChild(table);
}

function toggleView() {
    let passField = document.getElementById("password");
    let toggleText = document.getElementById("hide/show");

    let newValue = {
        "password": ["text", "Afficher le mot de passe"],
        "text": ["password", "Masquer le mot de passe"]
    };

    // new regex to filter html beacon out of toggleButton innerHTML
    let regex = /<[^>]*>/g;

    passField.type = newValue[passField.type][0];
    toggleText.innerText = newValue[passField.type][1];
}

function disable() {
    submitButton.disabled = true;
    for (let i = 0; i < fields.length; i++) {
        fields[i].disabled = true;
    }
}

function enable() {
    submitButton.disabled = false;
    for (let i = 0; i < fields.length; i++) {
        fields[i].disabled = false;
    }
}

async function evalData(data) {
    let d = []
    /**
     * @param data.idEleve
     * @type {*}
     */
    let grades = await getGrades(data.token, data.data.accounts[0].id, baseUrl);

    /**
     * @param disciplines.ensembleMatieres array
     * @param ensembleMatieres.disciplines  array of subjects
     * @param element.sousMatiere boolean (true if subject is a part of another subject)
     */

    for (let p = 0; p < grades.length; p++) {
        let disciplines = grades[p].ensembleMatieres.disciplines
            .filter(element => !element.sousMatiere && element.moyenne)
            .map(element => {
                return {
                    discipline: element.discipline,
                    moyenne: parseFloat(element.moyenne.replace(",", ".")),
                    coef: element.coef
                }
            })

        // sum of all grades and divide by number of grades using coefs
        let moyenneGenerale = 0;
        let coefTotal = 0;

        disciplines.forEach(element => {
            moyenneGenerale += element.moyenne * element.coef;
            coefTotal += element.coef;
        });
        moyenneGenerale /= coefTotal
        moyenneGenerale = moyenneGenerale.toFixed(2);
        console.log(grades[p].periode, moyenneGenerale)
        d.push({
            name: grades[p].periode,
            sum: Number(moyenneGenerale)
        })
    }
    return d;
}

function error(err) {
  let errorDiv = document.createElement("div");
  errorDiv.innerHTML = err;
  document.getElementById("errors").appendChild(errorDiv);
}