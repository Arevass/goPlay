var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

var Club = mongoose.model('Club');
var Event = mongoose.model('Event');
var User = mongoose.model('User');

router.post('/register', function(req, res, next){

    if(!req.body.username || !req.body.password){
        return res.status(400).json({message: 'Please fill out all fields'});
    }

    var user = new User();

    user.username = req.body.username;

    user.setPassword(req.body.password);

    user.save(function (err){

        if (err) { return next(err); }

        return res.json({token: user.generateJWT()})

    });
});

router.post('/login', function(req, res, next){

    if(!req.body.username || !req.body.password){
        return res.status(400).json({message: 'Please fill out all fields'});
    }

    passport.authenticate('local', function(err, user, info){
        if(err){ return next(err); }

        if(user){

            return res.json({token: user.generateJWT()});
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

router.get('/clubs', function (req, res, next) {

    Club.find(function (err, clubs) {

        if (err) { next(err); }

        res.json(clubs);

    });

});

router.get('/users', function (req, res, next) {

    User.find(function (err, users) {

        if (err) { next(err); }

        res.json(users);

    });

});

router.post('/clubs', auth, function (req, res, next) {

    var club = new Club(req.body);

    club.owner = req.payload.username;

    club.save(function (err, club) {

        if (err) { return next(err); }

        res.json(club);

    });

});

router.delete('/clubs/:club', auth, function (req, res, next) {

    var club = req.club;

    club.remove(function (err, club) {

        if (err) { return next(err); }

        res.json(club);

    });

});

router.param('club', function (req, res, next, id) {

    var query = Club.findById(id);

    query.exec(function (err, club) {

        if (err) { return next(err); }
        if (!club) { return next(new Error('Club not found')); }

        req.club = club;
        return next();

    });

});

router.param('event', function (req, res, next, id) {

    var query = Event.findById(id);

    query.exec(function (err, event) {

        if (err) { return next(err); }
        if (!event) { return next(new Error('Event not found')); }

        req.event = event;
        return next();

    });

});

router.param('user', function (req, res, next, id) {

    console.log('Processing :user');
    console.log(id);

    var query = User.findById(id);

    query.exec(function (err, user) {

        if (err) { return next(err); }
        if (!user) { return next(new Error('User not found')); }

        console.log(user);

        req.user = user;
        return next();

    });

});

router.get('/clubs/:club/', function (req, res) {

    req.club.populate('events', function (err, club) {

        if(err) { return next(err); }

        res.json(club);

    });

});

router.get('/users/:user/', function (req, res) {

    req.user.populate('clubs', function (err, user) {

        if(err) { return next(err); }

        res.json(user);

    })

});

router.post('/clubs/:club/events', auth, function (req, res, next) {

    var event = new Event(req.body);

    event.club = req.club;
    event.creator = req.payload.username;

    event.save(function (err, event) {

        if (err) { return next(err); }

        req.club.events.push(event);
        req.club.save(function (err, club) {

            if(err) { return next(err); }

            res.json(event);

        });

    });

});

router.post('/clubs/:club/members/:user/join', auth, function (req, res, next) {

    console.log('entering club join post');

    var member = req.user;

    //res.send(member);

    console.log('test');
    console.log(member);

    //member.username = req.payload.username;
    //member._id = req.payload._id;

    member.update(function (err, member) {

        if (err) { return next(err); }

        req.club.members.push(member);
        req.club.save(function (err, club) {

            if(err) { return next(err); }

            res.json(member);

        });

    });

});

var Simplify = require("simplify-commerce"),
    client = Simplify.getClient({
        publicKey: 'sbpb_MzI0ZmI0NWMtZTEwOS00NjBhLWJlMTUtN2JhZjEzNjQ4NThi',
        privateKey: 'bVA1s/Ofk03dw2DkxwNspVhHSGkEf0Jgq9LKBoK+H4B5YFFQL0ODSXAOkNtXTToq'
    });

router.post('/payment', function(req, res) {

    console.log('Amount', req.body.amount);
    console.log('Token', req.body.token);

    client.payment.create({
        amount : req.body.amount,
        token : req.body.token,
        reference : "7a6ef6be31",
        description : "Test Payment",
        currency : "USD"
    }, function(errData, data){

        if(errData){
            console.error("Error Message: " + errData.data.error.message);
            // handle the error

            res.sendStatus(404);
            return;
        }

        console.log("Payment Status: " + data.paymentStatus);
        res.redirect('/success.html');
    });
});

module.exports = router;
