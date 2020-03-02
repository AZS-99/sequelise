const alert = require('alert-node')
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const express = require('express')
const exphbs = require('express-handlebars')
const multer = require('multer')
const path = require('path')
const database = require('./database')


const HTTP_PORT = process.env.PORT || 8080
const products = multer({dest: './public/assets/photos/products'})


const app = express()
app.set('view engine', 'hbs')
app.engine('hbs', exphbs({
    extname: 'hbs',
    defaultLayout: 'main'
}))
app.use(bodyParser.urlencoded({extended: true}))
app.use('/public', express.static(path.join(__dirname, '/public')))
app.use(cookieSession({
    cookieName: 'session',
    secret: 'ourfatherwhoartinheaven,hallowedbethyname',
    duration: 1 * 60 * 1000,
    //activeDuration: 2 * 60 * 1000, //Extend the duration when the user interacts by this duration
    cookie: {
        maxAge: 2 * 60 * 1000,
        ephemeral: true,
        secure: false
    },
    resave: false,
    saveUninitialized: false
}))


app.get('/', async (req, res) => {
    try {
        res.render('home', {
            title: 'Home',
            user: req.session.user,
            trolley_count: await count_trolley_items(req.session) || 0, //Sequelise returns NaN if the user is not in trolley table 
            all_products: await database.getProducts()
        })
    } catch (error) {
        alert(error)
    }
    
})

app.get('/about', async (req, res) => {
    res.render('about', {
        title: "About Martianally",
        user: req.session.user,
        trolley_count: await count_trolley_items(req.session) || 0
    })
})


app.get('/account', async (req, res) => {
    if (req.session.user) {
        res.render('account', {
            title: "My Account",
            user: req.session.user,
            trolley_count:  await count_trolley_items(req.session) || 0
        })
    } else {
        res.redirect('/')
    }
})


app.post('/add_product_to_trolley', async (req, res) => {
    try {
        if (req.session.user) {
            await database.add_to_trolley(req.body)
        } else {
            if (!req.session.trolley)
                req.session.trolley = {}
            req.session.trolley[req.body.productID] = Number(req.body.number_of_items)
        }
        res.redirect('/')
        
    } catch(error) {
        alert(error)
    }
})


app.get('/address', async (req, res) => {
    res.render('address_form', {
        title: "Address Info",
        user: req.session.user,
        trolley_count:  await count_trolley_items(req.session) || 0
    })
})


app.post('/address', async (req, res) => {
    try {
        await database.addAddress(req.body)
    } catch(error) {
        alert(error)
    }
    res.send(req.body)
})


app.get('/create_product', (req, res) => {
    res.render('productForm', {
        user: req.session.user
    })
})


app.post('/create_product', products.single('product_image'), async (req, res) => {
    try {
        let product = req.body
        product.product_imageURL = req.file.path
        await database.addProduct(product)
        res.redirect('/')
    } catch (error) {
        alert(error)
    }
})


app.get('/emailExists/:email', async (req, res) => {
    try {
        let user = await database.getUser({"email": req.params.email})
        if (user) {
            res.send({"exists": true})
        } else {
            res.send({"exists": false})
        }
    } catch (error) {
        alert(error)
    }
})





app.get('/listProducts', async (req, res) => {
    try {
        res.send(await database.getProducts())
    } catch (error) {

    }
})


app.get('/logIn', (req, res) => {
    if (req.session.user) {
        res.redirect('/')
    } else {
        res.render('logIn', {
            title: 'Log In Form'
        })
    }
})


app.post('/logIn', async (req, res) => {
    try {
        const user =  await database.validateUser(req.body)
        if (user) {
            delete user.password
            req.session.user = user
        }
        
        res.redirect('/')
    } catch (error) {
        alert(error)
    }
    
})


app.get('/logOut', (req, res) => {
    req.session = null
    res.redirect('/')
})


app.get('/product/:productNo', async (req, res) => {
    try {
        const product = await database.getProduct({product_id: req.params.productNo})
        
        res.render('product', {
            title: product.label,
            product: product,
            user: req.session.user
        })
    } catch (error) {
        alert(error)
    }
    
})


//querying like that is extremely dangerous. anyone could use it
app.get('/removefromtrolley/:productID', async (req, res) => {
    try {
        const query = {productID: req.params.productID, userID: req.session.user.userID}
        
        await database.remove_from_trolley(query)
        res.redirect('/trolley')
    } catch(error) {
        alert(error)
    }
})


app.get('/signUp', (req, res) => {
    if (req.session.user) {
        res.redirect('/')
    } else {
        res.render('signUpForm', {
            title: "Become a Martian!!"
        })
    }
})


app.post('/signUp', async (req, res) => {
    try {
        await database.addUser(req.body)
        req.session.user = await database.getUser({"email": req.body.email})
        res.redirect('/')
    } catch (error) {
        console.log(error)
    }
})


app.get('/trolley', async (req, res) => {
    try {
        if (req.session.user) {
            let item
            let trolley_rows = await database.get_trolley_items(req.session.user.userID)

            let items = await Promise.all(trolley_rows.map(async row => {
                item = await database.getProduct({productID: row.productID})
                item.number_of_items = row.number_of_items
                delete item.createdAt
                delete item.updatedAt
                return item
            }))
            
            console.log(await database.get_trolley_total_price(req.session.user.userID))
            res.render('trolley', {
                items: items,
                user: req.session.user,
                trolley_count:  await count_trolley_items(req.session) || 0
            })
        } else {
            res.send(req.session.trolley)
        }
    } catch(error) {
        console.log(error)
    }
    
})


count_trolley_items = async (session) => {
    let trolley_count
    if (session.user) {
        trolley_count =  await database.count_trolley_items(session.user.userID) 
    } else {
        trolley_count = 0
    }
    return trolley_count
}

;(async () => {
    try {
        await database.initalise()
        app.listen(HTTP_PORT)
    } catch (error) {
        alert(error)
    }  
})() 

