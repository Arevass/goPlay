var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

var nodemailer = require('nodemailer');

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
    user.email = req.body.email;

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
            user.countLogins();
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

router.get('/events', function (req, res, next) {

    Event.find(function (err, events) {

        if (err) { next(err); }

        res.json(events);

    })

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

router.delete('/events/:event', auth, function (req, res, next) {

    var event = req.event;

    event.remove(function (err, event) {

        if (err) { return next(err); }

        res.json(event);

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

    //console.log('Processing :event parameter: ');
    //console.log(id);

    var query = Event.findById(id);

    query.exec(function (err, event) {

        if (err) { return next(err); }
        if (!event) { return next(new Error('Event not found')); }

        //console.log(event)

        req.event = event;
        return next();

    });

    //req.event = id;

    //return next();

});

router.param('user', function (req, res, next, id) {

    //console.log('Processing :user');
    //console.log(id);

    var query = User.findById(id);

    query.exec(function (err, user) {

        if (err) { return next(err); }
        if (!user) { return next(new Error('User not found')); }

        //console.log(user);

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

        if (err) { return next(err); }

        //console.log(user);
        res.json(user);

    })

});

router.get('/events/:event/', function (req, res) {

    req.event.populate('tickets', function (err, event) {

        if (err) { return next(err); }

        res.json(event);

    })

});

router.get('/clubs/:club/events/:event', function (req, res) {

    /*req.club.populate('events', function (err, club) {

        if (err) { return next(err); }

        for ( var i = 0; i < club.events.length; i++ ) {

            console.log(req.event);
            console.log(club.events[i]);

            if (club.events[i]._id == req.event._id) {

                res.json(club.events[i]);

            }
        }
    });*/

    res.json(req.event);

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

router.post('/events/:event/tickets/:user/join', function (req, res, next) {

    console.log('Entering event join post');

    var user = req.user;
    var event = req.event;

    req.user.events.push(event);
    req.user.save();

    req.event.tickets.push(user);
    req.event.save(function (err, event) {

        if(err) { return next(err); }

        res.json(user);

    });

});

router.post('/clubs/:club/members/:user/join', function (req, res, next) {

    console.log('entering club join post');

    var member = req.user;
    var clubToJoin = req.club;

    req.club.populate('events', function (err, clubToJoin) {

        if(err) { return next(err); }

        //console.log('Next club is important');
        //console.log(clubToJoin);

        req.user.clubs.push(clubToJoin);
        req.user.save();

    });

    req.club.members.push(member);
    req.club.save(function (err, club) {

        if(err) { return next(err); }

        console.log('Successfully joined club');
        res.json(member);

    });

});

router.post('/email', function (req, res) {

    console.log('Sending email');

    var email = req.body;

    console.log('ITS HERE');
    console.log(email);

    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'goplaynotifications@gmail.com',
            pass: '06061994'
        }
    });

    transporter.verify(function (err, success) {

        if(err) { console.log(err); } else {

            console.log('Server is ready to send');

        }

    });

    var mailOptions = {

        from: 'goplaynotifications@gmail.com',
        to: email.recipient,
        subject: email.subject,
        text: email.subject,
        html: email.message

    };

    transporter.sendMail(mailOptions, function (err, info) {

        if (err) { console.log(err); }

        //console.log('Message %s sent: %s', info.messageId, info.response);

    });

    res.send('Email sent');

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
