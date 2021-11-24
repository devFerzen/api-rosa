import express from 'express';
import https from 'https';
import axios from 'axios';

let router = express.Router();

router.get('/', (req, res) => {
    /*https.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            console.log(JSON.parse(data).explanation);
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
    axios.get('https://jsonplaceholder.typicode.com/users')
        .then(res => {
            const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
            console.log('Status Code:', res.status);
            console.log('Date in Response header:', headerDate);

            const users = res.data;

            for (user of users) {
                console.log(`Got user with id: ${user.id}, name: ${user.name}`);
            }
        })
        .catch(err => {
            console.log('Error: ', err.message);
        });*/

    res.json({ "mensaje": "hola" });
});

export default router;