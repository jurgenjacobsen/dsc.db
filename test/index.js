const { Database } = require("../lib");

const db = new Database({
    uri: 'mongodb+srv://admin:PCbjMMRxnswBQLK7@alpha.kxr0g3b.mongodb.net/Library?retryWrites=true&w=majority',
    collection: 'articles',
    debug: true,
})

//db.fetch("9855634").then(console.log);

//db.set("9855634.title", "Guerra Fria").then(console.log);

//db.push("9855634.subjects", "Português").then(console.log);

//db.pull("9855634.subjects", "Português").then(console.log);

//db.list().then(console.log);