const mongoose = require('mongoose')
mongoose.connect('mongodb://root:foobar@127.0.0.1:27017', {useNewUrlParser: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo Connection Error:'))
db.once('open', function() {
    console.log('Connected')

    const kittySchema = new mongoose.Schema({
        name: String,
        breed: String
    })

    kittySchema.methods.speak = function() {
        const greeting = this.name
            ? `Meow name is ${this.name}, my breed is ${this.breed}`
            : "I don't have a name!";
        console.log(greeting)
    }

    const Kitten = mongoose.model('Kitten', kittySchema);

    const silence = new Kitten({name: 'Silence', breed: 'British Shorthair'})
    const fluffy = new Kitten({name: 'Flutty', breed: 'Tuxedo'})

    fluffy.save(function(err, data) {
        if (err) return console.error(err);
        data.speak();
    })

    silence.save(function(err, data) {
        if (err) return console.error(err);
        data.speak();
    })
});

