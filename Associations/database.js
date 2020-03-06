const Sequelise = require('sequelize')
const bcrypt = require('bcryptjs')

const saltRounds = 12

const database = new Sequelise('d14ncg8ancm2k1', 'u22fkhtkaiee5s', 'p3430522c48e82fa989dc8c77408b235f0c1fd532a5952fa077c252735270c809', {
    host: 'ec2-52-23-79-163.compute-1.amazonaws.com',
    port: 5432,
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
})


module.exports.initialise = async () => {
    try {
        await database.sync()
    } catch(error) {
        console.log(error)
    }
}


const users = database.define('user', {
    user_id: {
        type: Sequelise.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    first_name: {
        type: Sequelise.STRING,
        allowNull: false,
        validate: {
            is: {
                args: ['^[A-Z][a-z]{1,25}$'],
                msg: ['Only alphabets are accepted']
            }
        }
    },
    surname: {
        type: Sequelise.STRING,
        allowNull: false,
        validate: {
            is: {
                args: ['[A-Z][a-z]{1,25}'],
                msg: ['Only alphabets are accepted']
            }
        }
    },
    email: {
        type: Sequelise.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: Sequelise.STRING,
        allowNull: false,
        validate: {
            is: {
                args: ['^(?=.*?[0-9])(?=.*?[A-Z])(?=.*?[a-z])[a-zA-Z0-9]{2,30}$'],
                msg: ['At least 1 digit, 1 uppercase, and 1 lowercase']
            }
        }
    },
    gender: {
        type: Sequelise.ENUM,
        allowNull: false,
        values: ['MALE', 'FEMALE', 'OTHER']
    }, 
    status: {
        type: Sequelise.ENUM,
        values: ['PURPLE', 'BRONZE', 'SILVER', 'GOLD', 'GALACTIC', 'ADMIN', 'MODERATOR'],
        defaultValue: 'PURPLE'
    },
    admin: {
        type: Sequelise.BOOLEAN,
        defaultValue: false
    },
    points: {
        type: Sequelise.FLOAT,
        defaultValue: 0
    }
}, {
    hooks: { 
        afterValidate: async (user, options) => {
            if (user.password)
                user.password = await bcrypt.hash(user.password, saltRounds)
        }
    },
    timestamps: false
})


module.exports.add_user = async (user) => {
    try {
        user.first_name = user.first_name[0].toUpperCase() + user.first_name.slice(1,).toLowerCase()
        user.surname = user.surname[0].toUpperCase() + user.surname.slice(1,).toLowerCase()
        await users.create(user)
    } catch (error) {
        console.log(error)
    }
}


module.exports.count_users = async () => {
    try {
        return await users.count()
    } catch (error) {
        console.log(error)
    }
}

module.exports.get_user = async (user_id) => {
    try {
        return await users.findOne({
            where: {
                user_id: user_id
            },
            attributes: {
                exclude: ['password']
            }
        })
    } catch (error) {
        return error
    }
}


module.exports.get_all_users = async () => {
    try {
        return users.findAll({
            raw: true
        })
    } catch (error) {
        return (error)
    }
}


module.exports.update_user = async(user, user_new) => {
    try {
        await users.update(user_new, {
            where: {
                user_id: user.user_id
            }
        })
    } catch (error) {
        console.log(error)
    }
}


module.exports.update_password = async (user_id, new_password) => {
    try {
        await users.update({password: new_password}, {
            where: {
                user_id: user_id
            }
        })
    } catch (error) {
        console.log(error)
    }
}


module.exports.verify_user = async (credentials) => {
    try {
        const user = await users.findOne({
            where: {
                email: credentials.email
            },
            raw: true
        })
        const verified = await bcrypt.compare(credentials.password, user.password)
        return verified? user : null 
    } catch (error) {
        console.log(error)
    }
}


module.exports.incement_balance = async (user_id, amount) => {
    try {
        const user = await users.findOne({
            where: {
                user_id: user_id
            }
        })
        await user.increment({
            balance: amount
        })
    } catch (error) {
        console.log(error)
    }
}


module.exports.get_number_of_users = async () => {
    try {
        return await users.findAll({
            attributes: [[database.fn('COUNT', database.col('user_id')), 'number_of_users']],
        })
    } catch (error) {
        console.log(error)
    }
}


module.exports.get_vip_users = async () => {
    try{
        let users = await database.findAll({
            where: {
                balance: {
                    $gt : 10
                }
            }
        })
        return users
    } catch (error) {
        return (error)
    }
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
    imageURL: {
        type: Sequelise.STRING,
        allowNull: false
    }
})


module.exports.add_product = async (product) => {
    try {
        await products.create(product)
    } catch (error) {
        console.log(error)
    }
}


module.exports.get_product = async (product_id) => {
    try {
        return await products.findOne({
            where: {
                product_id: product_id
            },
            raw: true
        })
    } catch (error) {
        console.log(error)
    }
}


module.exports.get_products = async () => {
    try {
        return await products.findAll({
            raw: true
        })
    } catch (error) {
        console.log(error)
    }
}


module.exports.count_products = async () => {
    try {
        return await products.count()
    } catch (error) {
        console.log(error)
    }
}



const trolley = database.define('trolley', {
    user_id: {
        type: Sequelise.INTEGER,
        primaryKey: 'pk',
        references: {
            model: users,
            key: 'user_id'
        }
    },
    product_id: {
        type: Sequelise.INTEGER, 
        primaryKey: 'pk',
        references: {
            model: products,
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

users.belongsToMany(products, {
    through: trolley,
    foreignKey: 'user_id'
})
products.belongsToMany(users, {
    through: trolley,
    foreignKey: 'product_id'
})
trolley.belongsTo(users, {
    foreignKey: 'user_id'
})
trolley.belongsTo(products, {
    foreignKey: 'product_id'
})



module.exports.add_to_trolley = async (order) => {
    try {
        const product = await trolley.findOne({
            where: {
                user_id: order.user_id,
                product_id: order.product_id
            }
        })
        console.log("\n" + product + "\n")
        if (product) {
            await product.update({number_of_items: Number(order.number_of_items)})
        } else {
            await trolley.create(order)
        }
    } catch (error) {
        console.log(error)
    }
}


module.exports.get_trolley = async (user_id) => {
    try {
        let trolley_items = await users.findAll({
            where: {
                user_id: user_id
            },
            attributes: [],
            include: [{
                model: products,
                attributes: {
                    exclude: ['product_id']
                } 
            }],
            raw: true
        })

        let clean_key, clean_item
        return trolley_items.map(item => {
            clean_item = {}
            for (key in item) {
                clean_key = key.replace(/.*\./, '')
                clean_item[clean_key] = item[key]
            }
            delete clean_item.createdAt
            delete clean_item.updatedAt
            return clean_item
        })

    } catch (error) {
        console.log(error)
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


module.exports.remove_from_trolley = async (user_id, product_id) => {
    try {
        await trolley.destroy({
            where: {
                user_id: user_id,
                product_id: product_id
            }
        })
    } catch (error) {
        console.log(error)
    }
}


