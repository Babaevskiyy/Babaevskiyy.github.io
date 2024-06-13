const express = require('express');
const router = express.Router();
const Product = require('../models/products');
const User = require('../models/user');
const multer = require('multer');
const fs = require("fs");

router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
});

var upload = multer({
    storage: storage,
}).single("image");

router.post('/add', upload, async (req, res) => {
    try {
        const product = new Product({
            name: req.body.name,
            count: req.body.count,
            bought: req.body.bought,
            sold: req.body.sold,
            image: req.file.filename,
        });

        await product.save();

        req.session.message = {
            type: "success",
            message: "Товар успешно добавлен",
        };

        res.redirect("/");
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});

router.get('/register', (req, res) => {
    res.render('register', { title: 'Регистрация', error: req.session.error });
    req.session.error = null;
});

// Обработка регистрации
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = new User({ username, password });
        await user.save();
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.redirect('/register');
    }
});

router.get('/login', (req, res) => {
    res.render('login', { title: 'Вход', error: req.session.error });
    req.session.error = null;
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && user.password === password) {
            req.session.user = user;
            res.redirect('/');
        } else {
            req.session.error = 'Неверное имя пользователя или пароль';
            res.redirect('/login');
        }
    } catch (err) {
        console.error(err);
        req.session.error = 'Произошла ошибка. Попробуйте снова.';
        res.redirect('/login');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.redirect('/');
        }
        res.redirect('/login');
    });
});

router.get("/", isAuthenticated, async (req, res) => {
    try {
        const products = await Product.find().exec();
        res.render('index', {
            title: 'АВТОСКЛАД',
            products: products,
            user: req.session.user
        });
    } catch (err) {
        res.json({ message: err.message });
    }
});

router.get("/add", isAuthenticated, (req, res) => {
    res.render("add_products", { title: "Добавить товар", user: req.session.user });
});

router.get('/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findById(id).exec();
        if (!product) {
            res.redirect('/');
        } else {
            res.render("edit_products", {
                title: "Изменить товар",
                product: product,
                user: req.session.user
            });
        }
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

router.post('/update/:id', isAuthenticated, upload, async (req, res) => {
    let id = req.params.id;
    let new_image = '';

    if (req.file) {
        new_image = req.file.filename;
        try {
            fs.unlinkSync('./uploads/' + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    try {
        const updatedProduct = await Product.findByIdAndUpdate(id, {
            name: req.body.name,
            count: req.body.count,
            bought: req.body.bought,
            sold: req.body.sold,
            image: new_image,
        }).exec();

        req.session.message = {
            type: 'success',
            message: 'Товар успешно обновлен!',
        };
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.json({ message: err.message, type: 'danger' });
    }
});

router.get('/delete/:id', isAuthenticated, async (req, res) => {
    try {
        const id = req.params.id;
        const deletedProduct = await Product.findByIdAndDelete(id).exec();
        if (!deletedProduct) {
            res.redirect('/');
        } else {
            if (deletedProduct.image) {
                try {
                    fs.unlinkSync('./uploads/' + deletedProduct.image);
                } catch (err) {
                    console.log(err);
                }
            }
            req.session.message = {
                type: 'info',
                message: 'Товар успешно удален!',
            };
            res.redirect("/");
        }
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

module.exports = router;
