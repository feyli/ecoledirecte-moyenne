let baseUrl = "https://api.ecoledirecte.com/v3";
let fields;
let submitButton;

async function submit() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    fields = document.getElementsByClassName("fields");
    submitButton = document.getElementById("submit")

    let req = login(username, password, baseUrl);
    disable();

    req.then(data => {
        if (data.code === 505) {
            console.log("Error: invalid credentials")
            enable();
        }
    })
}

async function createButtons(d) {
    // let promise = getGrades(d.token)
    let array = {

    }
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
    for (let i = 0; i <= fields.length; i++) {
        fields[i].disabled = true;
    }
}

function enable() {
    submitButton.disabled = false;
    for (let i = 0; i <= fields.length; i++) {
        fields[i].disabled = false;
    }
}