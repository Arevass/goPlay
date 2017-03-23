var mongoose = require('mongoose');

var ClubSchema = new mongoose.Schema({

    name: String,
    desc: String,
    owner: String,
    pubKey: String,
    regFee: String,
    events: [{type: mongoose.Schema.Types.ObjectId, ref: 'Event'}],
    members: [{type: mongoose.Schema.Types.ObjectId, ref: 'Member'}]

});

mongoose.model('Club', ClubSchema);