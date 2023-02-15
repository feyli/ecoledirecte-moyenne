let baseUrl = "https://api.ecoledirecte.com/v3";
const body = document.getElementsByTagName("body")[0];
let fields;
const submitButton = document.getElementById("submit");
const inputs = document.querySelectorAll(".fields");

inputs.forEach(input => input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") submit() && input.blur();
}));

$("#submit").click(submit);
$("#toggleButton").click(toggleView);

$(document).ready(function () {
    let rememberBox = $("#remember");
    $("#username").val(window.localStorage.getItem("username"));
    $("#password").val(window.localStorage.getItem("password"));

    if (window.localStorage.getItem("username") && window.localStorage.getItem("password")) $(".anonymous-container").css("display", "block");

    $("#anonymous").change(function () {
        if ($(this).prop("checked") === true) {
            rememberBox.prop("checked", false);
            rememberBox.prop("disabled", true);
            $(".checkbox-lbl[for=remember]").css("color", "grey");
            if ($("#username").val() === window.localStorage.getItem("username") && $("#password").val() === window.localStorage.getItem("password")) {
                reset();
            }
            $("#username").prop("placeholder", "Identifiant temporaire");
            $("#password").prop("placeholder", "Mot de passe temporaire");
        } else {
            rememberBox.removeAttr("disabled");
            $(".checkbox-lbl[for=remember]").removeAttr("style");
            rememberBox.prop("checked", window.localStorage.getItem("remember"));
            $("#username").prop("placeholder", "Identifiant");
            $("#password").prop("placeholder", "Mot de passe");
            if (!$("#username").val() && !$("#password").val()) {
                $("#username").val(window.localStorage.getItem("username"));
                $("#password").val(window.localStorage.getItem("password"));
            }

        }
    });

    rememberBox.prop("checked", window.localStorage.getItem("remember") === "true");
    rememberBox.change(function () {
        window.localStorage.setItem("remember", $(this).is(":checked"));
        if ($(this).prop("checked") === false && $("#anonymous").is(":checked") === false) {
            window.localStorage.removeItem("username");
            window.localStorage.removeItem("password");
            $(".anonymous-container").css("display", "none");
        }
    });
});

async function submit() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value
    fields = document.getElementsByClassName("fields");

    if (window.navigator.onLine === false) return message("Vous n'êtes pas connecté à Internet");
    if (!username || !password) return message("Vous devez entrer un identifiant et un mot de passe", 'red');
    let req = login(username, password, baseUrl);
    disable();

    req.then(data => {
        if (data.code === 505) {
            $("#submit").addClass('whenError');
            setTimeout(() => {
                $("submit").removeClass('whenError');
            }, 1);
            message("Identifiants incorrects", 'red');
            enable();
        } else if (data.code === 200) {
            message("Connexion réussie", 'green');
            if (!$("#anonymous").is(":checked") && window.localStorage.getItem("remember") === "true") {
                window.localStorage.setItem("username", username);
                window.localStorage.setItem("password", password);
                $(".anonymous-container").css("display", "block");
            }
            evalData(data).then(d => {
                reset();
                d = d.filter(e => e.sum);
                createTable(d);
                enable();
            })
        }
    })
}

function createTable(d) {
    // let promise = getGrades(d.token)
    let $tabDiv = $("#periodes-container");
    let $table = $("<table>", {id: "periodes"});
    let $tbody = $("<tbody>");
    let $tr = $("<tr>");
    let $thPeriode = $("<th>", {text: "Période"});
    let $thMoyenne = $("<th>", {text: "Moyenne"});
    $tr.append($thPeriode).append($thMoyenne);
    $tbody.append($tr);
    for (let i = 0; i < d.length; i++) {
        let $tr = $("<tr>");
        let $tdPeriode = $("<td>", {text: d[i].name});
        let $tdMoyenne = $("<td>", {text: d[i].sum});
        $tr.append($tdPeriode).append($tdMoyenne);
        $tbody.append($tr);
    }
    $table.append($tbody);
    $tabDiv.append($table);
}


function reset() {
    $(".fields").val('');
    $("#periodes").remove();
}

function toggleView() {
    let passField = document.getElementById("password");
    let toggleText = document.getElementById("hide/show");

    let newValue = {
        "password": ["text", "Afficher le mot de passe"],
        "text": ["password", "Masquer le mot de passe"]
    }

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
     * @param data.token
     * @param data.data.accounts[0]
     * @type {*}
     */
    let grades = await getGrades(data.token, data.data.accounts[0].id, baseUrl);

    /**
     * @param disciplines.ensembleMatieres array
     * @param ensembleMatieres.disciplines  array of subjects
     * @param element.sousMatiere boolean (true if subject is a part of another subject)
     * @param grades.periode
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