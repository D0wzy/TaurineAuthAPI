'use strict';

const Sequelize = require('sequelize')
const express = require('express')
const database = new Sequelize('taurine', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    define: {
        charset: "utf8",
        collate: "utf8_general_ci",
        timestamps: true
    },
    pool: {
        max: 200,
        min: 0,
        acquire: 60000,
        idle: 10000
    },
    logging: false
});

var app = express();
database.define('notifications', {
    content: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    title: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    views: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1
    },
    readers: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: "",
        get() {
            return this.getDataValue('readers').split('=%;')
        },
        set(val) {
            this.setDataValue('readers', val.join('=%;'));
        },
        push: function (...e) {
            let arr = JSON.parse(this.getDataValue('readers'))
            arr.push(e)
            this.setDataValue('readers', JSON.stringify(arr));

            return this.getDataValue('readers')
        }
    },
    date: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    author: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: "Taurine Bot"
    },
    image: {
        type: Sequelize.TEXT
    }
}, {
    timestamps: true
})

database.define('users', {
    hwid: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    userid: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    password: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    ip: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    lastConnection: {
        type: Sequelize.INTEGER
    },
    username: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    mail: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    clicker: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    clickerExpireOn: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    licence: {
        type: Sequelize.TEXT,
        allowNull: false
    }
}, {
    timestamps: true
})

database.models.notifications.findOrCreate({
    where: {
        content: "Welcome to Taurine !",
        author: "D0wzy - Developer",
        date: 2147483647
    }
})

database.sync({
    force: false,
    alter: true
})

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.get('/login', async (req, res) => {
    console.log(req.query)
    let result = await database.models.users.findOne({
        where: {
            password: req.query.password,
            username: req.query.username
        }
    })

    if (result) {
        result.lastConnection = Date.now()
        result.save()
    }
    res.status(200).json(result)
})



app.get('/info', async (req, res) => {
    console.log(req.query)
    let result = await database.models.users.findOne({
        where: {
            username: req.query.username
        }
    })
    if (!result) return res.json(null)

    let n = await database.models.notifications.findAll()

    let r = {
        id: result.id,
        lastConnection: result.lastConnection,
        licence: result.licence,
        clickerExpireOn: result.clickerExpireOn,
        username: result.username,
        notification: n.filter(x => !x.readers.includes("23")),
    }
    res.json(r)
})

app.get('/notifications/read', async (req, res) => {
    let result = await database.models.notifications.findOne({
        where: {
            id: req.query.id
        }
    })

    let arr = result.readers
    arr.push(req.query.userid)
    result.readers = arr
    result.save()

    res.json({
        success: "Readed !"
    })
})

app.listen(1337)
