const axios = require("axios");

function login(username, password, baseUrl) {
    let data = 'data={"identifiant": "' + username + '", "motdepasse": "' + password + '"}';
    return axios.post(baseUrl + '/login.awp', data);
}

function getGrades(token, idEleve, baseUrl) {
    let data = 'data={"token": "' + token + '"}';
    return axios.post(baseUrl + '/eleves/' + idEleve + '/notes.awp?verbe=get&', data);
}

module.exports = {
    login,
    getGrades
}