var express = require('express');
var exphbs  = require('express-handlebars');
const fs = require("fs");
let mercadopago = require("mercadopago");
mercadopago.configure(
    {
        access_token: "APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398",
        integrator_id: "dev_24c65fb163bf11ea96500242ac130004",
    }
);

var app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(express.urlencoded({ extended: false }));

app.get('/', function (req, res) {
    return res.render('home');
});

app.get('/detail', function (req, res) {
    return res.render('detail', req.query);
});

app.get("/success", function (req, res) {
    return res.render("purchase", {query: req.query});
});
app.get("/pending", function (req, res) {
    return res.render("purchase", {purchase: "Su compra está pendiente."});
});
app.get("/failure", function (req, res) {
    return res.render("purchase", {purchase: "La compra no se ha podido completar."});
});

app.post("/notifications", function (req, res) {
    let notification = {
        query: req.query,
        body: req.body
    }
    fs.writeFileSync("webhook.json", JSON.stringify(notification));
    return res.send(200);
});
app.get("/notifications", function (req, res) {
    let webhook = fs.readFileSync("webhook.json");
    return res.send(webhook);
});

app.post("/checkout", function (req, res) {
    let preference = {
        items: [
            {
                id: "1234",
                title: req.body.title,
                description: "Dispositivo móvil de Tienda e-commerce",
                picture_url: req.body.img,
                quantity: 1,
                unit_price: parseInt(req.body.price)
            }
        ],
        payer: {
            name: "Lalo",
            surname: "Landa",
            email: "test_user_63274575@testuser.com",
            phone: {
                area_code: "11",
                number: 22223333
            },
            address: {
                zip_code: "1111",
                street_name: "False",
                street_number: 123
            }

        },
        payment_methods: {
            excluded_payment_methods: [
                {id: "amex"}
            ],
            excluded_payment_types: [
                {id: "atm"}
            ],
            installments: 6
        },
        back_urls: {
            success: "https://emelipasini-mp-commerce-nodejs.herokuapp.com/success",
            pending: "https://emelipasini-mp-commerce-nodejs.herokuapp.com/pending",
            failure: "https://emelipasini-mp-commerce-nodejs.herokuapp.com/failure"
        },
        notification_url: "https://emelipasini-mp-commerce-nodejs.herokuapp.com/notifications",
        auto_return: "approved",
        external_reference: "emelipasini@gmail.com"
    }
    mercadopago.preferences.create(preference)
    .then(data => {
        fs.writeFileSync("preference.json", JSON.stringify(data.response.id))
        return res.redirect(data.response.init_point);
    }).catch(err => console.log(err));
});

app.use(express.static('assets'));
 
app.use('/assets', express.static(__dirname + '/assets'));
 
app.listen(process.env.PORT || 3000);