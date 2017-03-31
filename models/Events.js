var mongoose = require('mongoose');

var EventSchema = new mongoose.Schema({

    name: String,
    desc: String,
    creator: String,
    price: String,
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]

});

mongoose.model('Event', EventSchema);