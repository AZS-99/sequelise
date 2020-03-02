const Sequelise = require('sequelize') 
const pg = require('pg')
const bcrypt = require('bcryptjs')
const alert = require('alert-node')

const saltRounds = 12

const database = new Sequelise('d14ncg8ancm2k1', 'u22fkhtkaiee5s', 'p3430522c48e82fa989dc8c77408b235f0c1fd532a5952fa077c252735270c809', {
    host: 'ec2-52-23-79-163.compute-1.amazonaws.com',
    port: 5432,
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            required: true,
            rejectUnauthorized: false
        }
    }
})


module.exports.initalise = async () => {
    try {
        await database.sync()
    } catch (error) {
        alert(error)
    }
}


const users = database.define('user', {
    user_id: {
        type: Sequelise.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    first_name: {
        type: Sequelise.STRING,
        validate: {
            is: ['^[a-z]{2,25}$', 'i']
        }
    },
    surname: {
        type: Sequelise.STRING,
        validate: {
            is: ['^[a-z]{2,30}$', 'i']
        }
    },
    email: {
        type: Sequelise.STRING,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: Sequelise.STRING
    },
    phone_number: {
        type: Sequelise.STRING,
        validate: {
            is: ['^$|^[0-9]{10,15}$']
        }
    },
    gender: {
        type: Sequelise.ENUM,
        values: ['male', 'female', 'human']
    },
    status: {
        type: Sequelise.ENUM,
        values: ['ADMIN', 'BRONZE', 'GALACTIC', 'GOLD','MODERATOR', 'OWNER', 'PURPLE','SILVER'],
        defaultValue: 'PURPLE'
    }
})


const addresses = database.define('address', {
        user_id: {
        type: Sequelise.INTEGER,
        primaryKey: true,
        references: {
            model: users,
            key: 'user_id'
        }
    },
    street_no: {
        type: Sequelise.INTEGER
    },
    street: {
        type: Sequelise.STRING
    },
    city: {
        type: Sequelise.ENUM,
        values: ['TORONTO', 'VANCOUVER']
    },
    country: {
        type: Sequelise.ENUM,
        values: ['CANADA', 'USA']
    },
    postal_code: {
        type: Sequelise.STRING,
        validate: {
            is: ['^([A-Z][0-9]){3}$']
        }
    }
})


//Only to set the associations
users.hasOne(addresses, {
    foreignKey: {
        name: 'user_id'
    }
})
addresses.belongsTo(users, {  //foreign key options have to be specified in the table where the column is placed
    foreignKey: {
        allowNull: false,
        name: 'user_id',
        unique: true
    }
})



module.exports.addAddress = async (address) => {
    try {
        address.postal_code = address.postal_code.toUpperCase()
        address.city = address.city.toUpperCase()
        await addresses.create(address)
    } catch (error) {
        alert( error)
    }
}


module.exports.addUser = async (user) => {
    user.first_name = user.first_name[0].toUpperCase() + user.first_name.slice(1,).toLowerCase()
    user.surname = user.surname[0].toUpperCase() + user.surname.slice(1,).toLowerCase()
    user.password = await bcrypt.hash(user.password, saltRounds)
    try {
        user = await users.create(user)
    } catch (error) {
        alert(error) 
    }
   
}


module.exports.getUser = async (query) => {
    return await users.findOne({
        where: query,
        raw: true
    })
}


module.exports.getUsers = async (query) => {
    return await users.findAll({
        where: query,
        raw: true
    })
}


module.exports.validateUser = async (credentials) => {
    const user = await users.findOne({
        where: {
            email: credentials.email
        },
        raw: true
    })
    const validated = await bcrypt.compare(credentials.password, user.password)
    return validated? user : null
}



const products = database.define('product', {
    product_id: {
        type: Sequelise.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    product_label: {
        type: Sequelise.STRING,
        unique: true,
        allowNull: false,
        validate: {
            is: {
                args: ['^[a-z0-9, ]{3,200}$', 'i'],
                msg: "The label which you entered doesn't meet the requested format (only alphanumerics, commas, and spaces)"
            }
        }
    },
    price: {
        type: Sequelise.FLOAT,
        allowNull: false
    },
    description: Sequelise.TEXT,
    product_imageURL: {
        type: Sequelise.STRING
    }

})


module.exports.addProduct = async (product) => {
    try {
        await products.create(product)
    } catch (error) {
        alert(error)
    }
}


module.exports.getProduct = async (query) => {
    try {
        return await products.findOne({
            where: query,
            raw: true
        })
    } catch (error) {
        alert(error)
    }
}


module.exports.getProducts = async (query) => {
    try {
        return await products.findAll({
            raw: true
        })
    } catch (error) {
        alert(error)
    }
}



const trolley = database.define('trolley', {
    user_id: {
        type: Sequelise.INTEGER,
        primaryKey: 'pk',   //Unique and PKs can have 2 types of values: boolean & strings. Those with same string are composite
        references: {
            model: users,
            key: 'user_id'
        }
    },
    product_id: {
        type: Sequelise.INTEGER,
        primaryKey: 'pk',
        references: {
            model: users,
            key: 'product_id'
        }
    },
    number_of_items: {
        type: Sequelise.INTEGER,
        validate: {
            min: {
                args: 1,
                msg: "We know it is Martianally, but imaginary numbers aren't supported yet!"
            },
            max: {
                args: 9,
                msg: 'You can add max 9 items of the same product'
            }
        }
    }
})

//Associating a junction table
users.belongsToMany(products, {
    through: trolley,
    foreignKey: {
        name: 'user_id'
    }
})
products.belongsToMany(users, {
    through: trolley,
    foreignKey: 'product_id'
})


module.exports.add_to_trolley = async (potential_order) => {
    try {
        const trolley_order = await trolley.findOne({
            where: {
                user_id: potential_order.user_id,
                product_id: potential_order.product_id
            }
        })
        if (!trolley_order) {
            await trolley.create(potential_order)
        } else {
            await trolley_order.update({
                number_of_items: Number(trolley_order.number_of_items)  + Number(potential_order.number_of_items)
            })
        }
    } catch (error) {
        alert(error)
    }
}


module.exports.get_trolley_items = async (user_id) => {
    try {
        return await trolley.findAll({
            where: {
                user_id: user_id
            },
            raw: true
        })
    } catch (error){
        alert(error)
    }
}


module.exports.remove_from_trolley = async (query) => {
    try {
        await trolley.destroy({
            where: query
        })
        
    } catch(error) {
        alert (error)
    }
}


module.exports.count_trolley_items = async (user_id) => {
    try {
        return await trolley.sum('number_of_items', {
            where: {
                user_id: user_id
            }
        })
    } catch (error) {
        console.log(error)
    }
}


module.exports.get_trolley_total_price = async (user_id) => {
    try {
        const rows = await users.findAll({
            attributes: [], //no attributes needed; we only need the junction table
            where: {
                user_id: user_id
            },
            include: [{
                model: products,
                attributes: ['price'], //The only attribute we need from PRODUCTs tables
            }],
            raw: true
        })
        const prices = rows.map(row => {
            return  Number(row['products.price']) * Number(row['products.trolley.number_of_items'])
        })
        return prices
       
    } catch (error) {
        alert(error)
    }
}

