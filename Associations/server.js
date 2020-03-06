const bodyParser = require('body-parser')
const expressSession = require('express-session')
const express = require('express')
const exphbs = require('express-handlebars')
const multer = require('multer')
const path = require('path')

const database = require('./database')

const HTTP_PORT = process.env.PORT || 8080
const product_dest = multer({
    dest: './public/assets/photos/products'
})

const app = express()
app.set('view engine', 'hbs')
app.engine('hbs', exphbs({
    extname: 'hbs',
    defaultLayout: 'main'
}))

app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(expressSession({
    cookieName: 'session',
    secret: 'ourfatherwhoartinheaven,hallowedbethyname',
    // duration: 1 * 60 * 1000,
    //activeDuration: 2 * 60 * 1000, //Extend the duration when the user interacts by this duration
    cookie: {
        maxAge: 20 * 60 * 1000,
        ephemeral: true,
        secure: false
    },
    resave: false,
    saveUninitialized: false
}))




app.use('/public', express.static(path.join(__dirname, '/public')))


app.get('/', async (req, res) => {
    try {
        res.render('home', {
            title: 'Home',
            user: req.session.user,
            products: await database.get_products()
        })
    } catch (error) {
        console.log(error)
    }
    
})

app.get('/account', ensure_login, async(req, res) => {
    res.render('account', {
        user: req.session.user
    })
})


app.post('/add_to_trolley', async (req, res) => {
    try {
        await database.add_to_trolley(req.body)
        req.session.user.count_items = await database.count_trolley_items(req.session.user.user_id) || 0
        res.redirect('/')
    } catch (error)  {
        console.log(error)
    }
})


app.get('/change_password', ensure_login, async(req, res) => {
    res.render('change_password', {
        user: req.session.user
    })
})

app.post('/change_password', async (req, res) => {
    const credentials = {}
    credentials.email = req.session.user.email
    credentials.password = req.body.current_password

    const user = await database.verify_user(credentials) 
    if (user) {
        await database.update_password(user.user_id, req.body.new_password)
        res.redirect('/')
    } else {
        res.send('You have one more trial, and then your account will get frozen if credentials are not correct')
    }
})


app.get('/edit_account', ensure_login, (req, res) => {
    res.render('edit_account', {
        user: req.session.user
    })
})


app.post('/edit_account', async (req, res) => {
    console.log("\n" + req.body + "\n")
    let credentials = {}
    credentials.email = req.session.user.email
    credentials.password = req.body.password
    let user = await database.verify_user(credentials)
    delete req.body.password
    if (user) {
        await database.update_user(user, req.body)
        
        req.session.user = await database.get_user(user.user_id)
        res.redirect('/')
    } else {
        res.send('You are blocked')
    }
})


app.get('/log_in', (req, res) => {
    res.render('log_in')
})

app.post('/log_in', async (req, res) => {
    try {
        let user = await database.verify_user(req.body)
        if (user) {
            delete user.password
            req.session.user = user
            req.session.user.count_items = await database.count_trolley_items(user.user_id) || 0
            res.redirect('/')
        } else {
            res.send('try again')
        }
        
    } catch (error) {
        console.log(error)
    }
})


app.get('/log_out', ensure_login, (req, res) => {
    req.session.destroy()
    res.redirect('/')
})


app.get('/manage_website', ensure_admin_authority, async (req, res) => {
    try {
        res.render('manage_website', {
            user: req.session.user,
            count_users: await database.count_users(),
            count_products: await database.count_products()
        })
    } catch (error) {
        console.log(error)
    }
    
})


app.get('/product/:product_id', async (req, res) => {
    try {
        res.render('product', {
            user: req.session.user,
            product: await database.get_product(req.params.product_id)
        })
    } catch (error) {
        console.log(error)
    }
})


app.get('/product_form', ensure_admin_authority, (req, res) => {
    res.render('product_form', {
        user: req.session.user
    })
})


app.post('/product_form', product_dest.single('product_image'), async (req, res) => {
    try {
        const product = req.body
        product.imageURL = req.file.path
        await database.add_product(product)
        res.redirect('/')
    } catch (error) {
        console.log(error)
    }
})



app.get('/number_of_users', async (req, res) => {
    try {
        res.send(await database.get_number_of_users())
    } catch (error) {
        console.log(error)
    }
})


app.get('/remove_from_trolley/:product_id', async (req, res) => {
    try {
        await database.remove_from_trolley(req.session.user.user_id, req.params.product_id)
        req.session.user.count_items = await database.count_trolley_items(req.session.user.user_id) || 0
        res.redirect('/trolley')
    }
    catch(error) {
        res.redirect(error)
    }
})


app.get('/sign_up', (req, res) => {
    res.render('sign_up')
})


app.post('/sign_up', async (req, res) => {
    try {
        await database.add_user(req.body)
        let user = req.body
        user.count_items = 0
        delete user.password
        
        req.session.user = user
        res.redirect('/')
    } catch(error) {
        console.log(error)
    }
})


app.get('/trolley', async (req, res) => {
    try {
        
        res.render('trolley', {
            user: req.session.user,
            trolley_items: await database.get_trolley(req.session.user.user_id)
        })
    } catch (error) {
        console.log(error)
    }
})


app.get('/users', ensure_admin_authority, async (req, res) => {
    try {
        res.render('users', {
            users: await database.get_all_users()
        })
    } catch (error) {
        console.log(error)
    }
})


app.post('/users', async (req, res) => {
    try {
        res.send(req.body)
    } catch (error) {
        console.log(error)
    }
})


function ensure_admin_authority (req, res, next) {
    if (req.session.user && req.session.user.admin) {
        next()
    } else {
        res.redirect('/')
    }
}


function ensure_login(req, res, next) {
    if (!req.session.user) 
        res.redirect('/log_in')
    else
        next()
}




;(async () => {
    try {
        await database.initialise()
        app.listen(HTTP_PORT)

        // const me = {first_name: 'Adam', surname: 'Saher', email: 'saher.zachary.adam@icloud.com', 
        //         password: 'adamSaher1', gender: 'MALE', admin: true}
        // await database.add_user(me)

        // const adrian = {first_name: 'Adrian', surname: 'Ally', email: 'adrianally@icloud.com', 
        //          password: 'adrianAlly1', gender: 'MALE', admin: true}
        // await database.add_user(adrian)

    } catch (error) {
        console.log(error)
    }
}) ()