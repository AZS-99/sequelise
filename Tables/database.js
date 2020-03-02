const Sequelise = require('sequelize')

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
        validate: {
            is: {
                args: ['[A-Z][a-z]{1,25}'],
                msg: ['Only alphabets are accepted']
            }
        }
    },
    email: {
        type: Sequelise.STRING,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: Sequelise.STRING
    },
    gender: {
        type: Sequelise.ENUM,
        values: ['MALE', 'FEMALE', 'OTHER']
    }
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