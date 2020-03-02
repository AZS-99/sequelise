const express = require('express')
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')
const database = require('./database')

const HTTP_PORT = process.env.PORT || 8080

const app = express()
app.set('view engine', 'hbs')
app.engine('hbs', exphbs({
    extname: 'hbs',
    defaultLayout: 'main'
}))

app.use(bodyParser.urlencoded({
    extended: true
}))


app.get('/', (req, res) => {
    res.render('home', {
        title: 'Home'
    })
})


app.get('/sign_up', (req, res) => {
    res.render('sign_up')
})


app.post('/sign_up', async (req, res) => {
    try {
        await database.add_user(req.body)
        res.send(req.body)
    } catch(error) {
        console.log(error)
    }
})


;(async () => {
    try {
        await database.initialise()
        app.listen(HTTP_PORT)
    } catch (error) {
        console.log(error)
    }
}) ()