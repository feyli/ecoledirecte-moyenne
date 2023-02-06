let baseUrl = "https://api.ecoledirecte.com/v3";
const box = document.getElementById("box");
const body = document.getElementsByTagName("body")[0];
let fields;
const submitButton = document.getElementById("submit");
const toggleButton = document.getElementById("toggleButton");
const inputs = document.querySelectorAll(".fields");

inputs.forEach(input => input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") submit() && input.blur();
}));
submitButton.addEventListener("click", submit);
toggleButton.addEventListener("click", toggleView);

async function submit() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value
    fields = document.getElementsByClassName("fields");

    let req = login(username, password, baseUrl);
    disable();

    req.then(data => {
        if (data.code === 505) {
            message("Identifiants incorrects", 'red');
            enable();
        } else if (data.code === 200) {
            console.log("Logged in successfully!")
            message("Connexion réussie", 'green');
            evalData(data).then(d => {
                d = d.filter(e => e.sum);
                resetTable();
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
    let tbody = document.createElement("tbody");
    let tr = document.createElement("tr");
    let thPeriode = document.createElement("th");
    thPeriode.innerText = "Période";
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
    table.appendChild(tbody);
    tabDiv.appendChild(table);
}

function resetTable() {
    let table = document.getElementById("periodes");
    if (table) table.remove();
}

function toggleView() {
    let passField = document.getElementById("password");
    let toggleText = document.getElementById("hide/show");

    let newValue = {
        "password": ["text", "Afficher le mot de passe"],
        "text": ["password", "Masquer le mot de passe"]
    }

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

function message(content, color) {
    let background = {
        "red": "#cd1478",
        "green": "#6aaf11"
    }
    console.log(content);
    let messageDiv = document.createElement("div");
    messageDiv.innerHTML = content;
    messageDiv.classList.add("message");
    messageDiv.style.backgroundColor = background[color];
    document.getElementById("message-container").appendChild(messageDiv);
    messageDiv.addEventListener("click", () => {
        close(messageDiv);
    });
    setTimeout(() => {
        close(messageDiv);
    }, 5000);
}

function close(element) {
    element.classList.add("close");
    setTimeout(() => {
        element.remove();
    }, 250);
}